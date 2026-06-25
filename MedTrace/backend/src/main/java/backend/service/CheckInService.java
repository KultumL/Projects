package backend.service;

import backend.dto.CheckInRequest;
import backend.dto.CheckInResponse;
import backend.model.DailyCheckIn;
import backend.model.User;
import backend.repository.DailyCheckInRepository;
import lombok.RequiredArgsConstructor;
import backend.exception.BadRequestException;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CheckInService {

    private final DailyCheckInRepository checkInRepository;
    private final CareLinkService careLinkService;

    @Transactional
    public CheckInResponse createCheckIn(CheckInRequest request, User caller, Long targetPatientId) {
        Long effectiveTarget = (targetPatientId != null) ? targetPatientId : caller.getId();
        User patient = careLinkService.resolveInputTarget(caller, effectiveTarget);

        LocalDate date = request.checkInDate() != null ? request.checkInDate() : LocalDate.now();

        checkInRepository.findByUserAndCheckInDate(patient, date).ifPresent(existing -> {
            throw new BadRequestException("There is already a check-in for " + date);
        });

        User enteredBy = caller.getId().equals(patient.getId()) ? null : caller;

        DailyCheckIn checkIn = DailyCheckIn.builder()
                .user(patient)
                .enteredBy(enteredBy)
                .checkInDate(date)
                .mood(request.mood())
                .energy(request.energy())
                .painLevel(request.painLevel())
                .sleepHours(request.sleepHours())
                .medicationsTaken(request.medicationsTaken())
                .journalEntry(request.journalEntry())
                .build();

        DailyCheckIn saved = checkInRepository.save(checkIn);
        return CheckInResponse.from(saved);
    }

    // Read check-in history. caller may be the patient (own data) or a
    // caregiver with any active link (view gate). targetPatientId null = own.
    @Transactional(readOnly = true)
    public List<CheckInResponse> getCheckIns(User caller, Long targetPatientId) {
        Long effectiveTarget = (targetPatientId != null) ? targetPatientId : caller.getId();
        User patient = careLinkService.resolveViewTarget(caller, effectiveTarget);

        return checkInRepository.findByUserOrderByCheckInDateDesc(patient)
                .stream()
                .map(CheckInResponse::from)
                .toList();
    }
}
