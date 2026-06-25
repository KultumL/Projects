package backend.service;

import backend.dto.CareLinkRequest;
import backend.dto.CareLinkResponse;
import backend.exception.BadRequestException;
import backend.model.CareLink;
import backend.model.CareLinkStatus;
import backend.model.User;
import backend.repository.CareLinkRepository;
import backend.repository.UserRepository;
import backend.model.CareLinkPermission;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CareLinkService {

    private final CareLinkRepository careLinkRepository;
    private final UserRepository userRepository;

    public CareLinkService(CareLinkRepository careLinkRepository,
                           UserRepository userRepository) {
        this.careLinkRepository = careLinkRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public CareLinkResponse invite(User patient, CareLinkRequest request) {
        User caregiver = userRepository.findByEmail(request.caregiverEmail())
                .orElseThrow(() -> new BadRequestException("No caregiver found with that email"));

        if (caregiver.getId().equals(patient.getId())) {
            throw new BadRequestException("You cannot add yourself as a caregiver");
        }

        if (caregiver.getRole() != User.Role.CAREGIVER) {
            throw new BadRequestException("That user is not a caregiver account");
        }

        var existing = careLinkRepository.findByPatientAndCaregiver(patient, caregiver);
        if (existing.isPresent()) {
            CareLink link = existing.get();
            if (link.getStatus() == CareLinkStatus.REVOKED) {
                link.setStatus(CareLinkStatus.PENDING);
                link.setPermission(request.permission());
                return CareLinkResponse.from(link);
            }
            throw new BadRequestException("You already have a link with this caregiver");
        }

        CareLink link = CareLink.builder()
                .patient(patient)
                .caregiver(caregiver)
                .permission(request.permission())
                .status(CareLinkStatus.PENDING)
                .build();

        return CareLinkResponse.from(careLinkRepository.save(link));
    }

    @Transactional(readOnly = true)
    public List<CareLinkResponse> linksAsPatient(User patient) {
        return careLinkRepository.findByPatient(patient)
                .stream().map(CareLinkResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<CareLinkResponse> linksAsCaregiver(User caregiver) {
        return careLinkRepository.findByCaregiver(caregiver)
                .stream().map(CareLinkResponse::from).toList();
    }

    @Transactional
    public CareLinkResponse respondToInvite(User caregiver, Long linkId, boolean accept) {
        CareLink link = careLinkRepository.findById(linkId)
                .orElseThrow(() -> new BadRequestException("Care link not found"));

        if (!link.getCaregiver().getId().equals(caregiver.getId())) {
            throw new BadRequestException("Care link not found");
        }

        if (link.getStatus() != CareLinkStatus.PENDING) {
            throw new BadRequestException("This invite is no longer pending");
        }

        link.setStatus(accept ? CareLinkStatus.ACTIVE : CareLinkStatus.REVOKED);
        return CareLinkResponse.from(link);
    }

    @Transactional
    public CareLinkResponse revoke(User actor, Long linkId) {
        CareLink link = careLinkRepository.findById(linkId)
                .orElseThrow(() -> new BadRequestException("Care link not found"));

        boolean isParty =
                link.getPatient().getId().equals(actor.getId())
             || link.getCaregiver().getId().equals(actor.getId());
        if (!isParty) {
            throw new BadRequestException("Care link not found");
        }

        if (link.getStatus() == CareLinkStatus.REVOKED) {
            throw new BadRequestException("This link is already revoked");
        }

        link.setStatus(CareLinkStatus.REVOKED);
        return CareLinkResponse.from(link);
    }
    /**
     * The authorization gate for acting on a patient's data. Returns the target
     * patient if the caller is allowed to write on their behalf, otherwise throws.
     *
     * Two ways to pass:
     *   1. The caller IS the target patient (acting on your own data).
     *   2. The caller holds an ACTIVE VIEW_AND_INPUT care link to the patient.
     *
     * VIEW_ONLY does NOT grant input rights. Anything else is rejected with a
     * vague message so a caregiver can't probe which patient ids exist.
     */
    @Transactional(readOnly = true)
    public User resolveInputTarget(User caller, Long targetPatientId) {
        // Case 1: acting on your own data. No link needed.
        if (caller.getId().equals(targetPatientId)) {
            return caller;
        }

        // Case 2: caller must be a caregiver with an ACTIVE VIEW_AND_INPUT link.
        User patient = userRepository.findById(targetPatientId)
                .orElseThrow(() -> new BadRequestException("Patient not found or access not granted"));

        CareLink link = careLinkRepository
                .findByCaregiverAndPatientAndStatus(caller, patient, CareLinkStatus.ACTIVE)
                .orElseThrow(() -> new BadRequestException("Patient not found or access not granted"));

        if (link.getPermission() != CareLinkPermission.VIEW_AND_INPUT) {
            throw new BadRequestException("You do not have input permission for this patient");
        }

        return patient;
    }
    /**
     * The authorization gate for READING a patient's data. Looser than
     * resolveInputTarget: any ACTIVE link grants viewing, regardless of
     * permission level. VIEW_ONLY and VIEW_AND_INPUT both pass here — the
     * difference between them only matters for writing.
     *
     * Two ways to pass:
     *   1. The caller IS the target patient (reading your own data).
     *   2. The caller holds ANY active care link to the patient.
     */
    @Transactional(readOnly = true)
    public User resolveViewTarget(User caller, Long targetPatientId) {
        // Case 1: your own data.
        if (caller.getId().equals(targetPatientId)) {
            return caller;
        }

        // Case 2: any active link, either permission level, grants viewing.
        User patient = userRepository.findById(targetPatientId)
                .orElseThrow(() -> new BadRequestException("Patient not found or access not granted"));

        careLinkRepository
                .findByCaregiverAndPatientAndStatus(caller, patient, CareLinkStatus.ACTIVE)
                .orElseThrow(() -> new BadRequestException("Patient not found or access not granted"));

        return patient;
    }

}
