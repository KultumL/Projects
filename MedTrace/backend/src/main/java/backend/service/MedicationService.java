package backend.service;

import backend.dto.MedicationRequest;
import backend.dto.MedicationResponse;
import backend.model.Medication;
import backend.model.MedicationChange;
import backend.model.User;
import backend.repository.MedicationRepository;
import backend.repository.MedicationChangeRepository;
import lombok.RequiredArgsConstructor;
import backend.dto.MedicationChangeResponse;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MedicationService {

    private final MedicationRepository medicationRepository;
    private final OpenFdaService openFdaService;
    private final MedicationChangeRepository medicationChangeRepository;
    private final CareLinkService careLinkService;
    
    public MedicationResponse addMedication(MedicationRequest request, User user) {
        OpenFdaService.DrugInfo drugInfo = openFdaService.lookup(request.name());

        Medication medication = Medication.builder()
                .name(request.name())
                .dosage(request.dosage())
                .frequency(request.frequency())
                .startDate(LocalDateTime.now())
                .user(user)
                .purpose(drugInfo.purpose())
                .warnings(drugInfo.warnings())
                .sideEffects(drugInfo.sideEffects())
                .build();

        Medication saved = medicationRepository.save(medication);
        logChange(user, saved.getName(), MedicationChange.ChangeType.ADDED, "Medication added");
        return MedicationResponse.from(saved);
    }

    public List<MedicationResponse> getMedications(User caller, Long targetPatientId) {
        Long effectiveTarget = (targetPatientId != null) ? targetPatientId : caller.getId();
        User patient = careLinkService.resolveViewTarget(caller, effectiveTarget);

        return medicationRepository.findByUser(patient)
                .stream()
                .map(MedicationResponse::from)
                .toList();
    }

    public void deleteMedication(Long medicationId, User user) {
        Medication medication = medicationRepository.findById(medicationId)
                .orElseThrow(() -> new RuntimeException("Medication not found"));

        if (!medication.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("You do not have permission to delete this medication");
        }

        logChange(user, medication.getName(), MedicationChange.ChangeType.REMOVED, "Medication removed");
        medicationRepository.delete(medication);
    }

    public MedicationResponse updateMedication(Long medicationId, MedicationRequest request, User user) {
        Medication medication = medicationRepository.findById(medicationId)
                .orElseThrow(() -> new RuntimeException("Medication not found"));

        if (!medication.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("You do not have permission to edit this medication");
        }

        boolean nameChanged = !medication.getName().equalsIgnoreCase(request.name());
        boolean dosageChanged = !medication.getDosage().equalsIgnoreCase(request.dosage());

        medication.setName(request.name());
        medication.setDosage(request.dosage());
        medication.setFrequency(request.frequency());

        if (nameChanged) {
            OpenFdaService.DrugInfo drugInfo = openFdaService.lookup(request.name());
            medication.setPurpose(drugInfo.purpose());
            medication.setWarnings(drugInfo.warnings());
            medication.setSideEffects(drugInfo.sideEffects());
        }

        Medication saved = medicationRepository.save(medication);

        if (nameChanged) {
            logChange(user, saved.getName(), MedicationChange.ChangeType.SWITCHED,
                    "Medication switched to " + saved.getName());
        } else if (dosageChanged) {
            logChange(user, saved.getName(), MedicationChange.ChangeType.DOSAGE_CHANGED,
                    "Dosage changed to " + saved.getDosage());
        }

        return MedicationResponse.from(saved);
    }

    public List<MedicationChangeResponse> getChangeHistory(User user) {
        return medicationChangeRepository.findByUserOrderByChangedAtDesc(user)
                .stream()
                .map(MedicationChangeResponse::from)
                .toList();
    }

    private void logChange(User user, String medicationName, MedicationChange.ChangeType type, String details) {
        MedicationChange change = MedicationChange.builder()
                .user(user)
                .medicationName(medicationName)
                .changeType(type)
                .details(details)
                .build();
        medicationChangeRepository.save(change);
    }
}