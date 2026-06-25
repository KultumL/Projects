package backend.service;

import backend.dto.DoseLogRequest;
import backend.dto.DoseLogResponse;
import backend.dto.DoseStatusResponse;
import backend.exception.BadRequestException;
import backend.model.*;
import backend.repository.DoseLogRepository;
import backend.repository.MedicationRepository;
import backend.repository.MedicationScheduleRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DoseLogService {

    private static final int GRACE_MINUTES = 60;

    private final DoseLogRepository doseLogRepository;
    private final MedicationRepository medicationRepository;
    private final MedicationScheduleRepository scheduleRepository;
    private final CareLinkService careLinkService;

    public DoseLogService(DoseLogRepository doseLogRepository,
                          MedicationRepository medicationRepository,
                          MedicationScheduleRepository scheduleRepository,
                          CareLinkService careLinkService) {
        this.doseLogRepository = doseLogRepository;
        this.medicationRepository = medicationRepository;
        this.scheduleRepository = scheduleRepository;
        this.careLinkService = careLinkService;
    }

    // ---------- logging a dose ----------

    @Transactional
    public DoseLogResponse logDose(User caller, DoseLogRequest request, Long targetPatientId) {
        // Resolve who this dose is for. Null target => caller's own data.
        // The gate throws if the caller lacks VIEW_AND_INPUT access.
        Long effectiveTarget = (targetPatientId != null) ? targetPatientId : caller.getId();
        User patient = careLinkService.resolveInputTarget(caller, effectiveTarget);

        // Ownership: the medication must belong to the PATIENT (the data owner),
        // not the caller. A caregiver never owns the medication; the patient does.
        Medication medication = medicationRepository.findById(request.medicationId())
                .orElseThrow(() -> new BadRequestException("Medication not found"));
        if (!medication.getUser().getId().equals(patient.getId())) {
            throw new BadRequestException("Medication not found");
        }

        MedicationSchedule schedule = null;
        if (request.scheduleId() != null) {
            schedule = scheduleRepository.findById(request.scheduleId())
                    .orElseThrow(() -> new BadRequestException("Schedule not found"));
            if (!schedule.getMedication().getId().equals(medication.getId())) {
                throw new BadRequestException("Schedule does not belong to this medication");
            }
        }

        LocalDateTime takenAt = request.takenAt() != null
                ? request.takenAt() : LocalDateTime.now();
        LocalDate doseDate = request.doseDate() != null
                ? request.doseDate() : LocalDate.now();

        if (schedule != null) {
            doseLogRepository.findBySchedule_IdAndDoseDate(schedule.getId(), doseDate)
                    .ifPresent(existing -> {
                        throw new BadRequestException("This dose has already been logged for today");
                    });
        }

        // Stamp enteredBy only when a caregiver acts for someone else.
        User enteredBy = caller.getId().equals(patient.getId()) ? null : caller;

        DoseLog log = DoseLog.builder()
                .medication(medication)
                .schedule(schedule)   // null for PRN — that's fine
                .takenAt(takenAt)
                .doseDate(doseDate)
                .enteredBy(enteredBy)
                .build();

        return DoseLogResponse.from(doseLogRepository.save(log));
    }

    // ---------- detection ----------

    @Transactional(readOnly = true)
    public List<DoseLogResponse> history(User caller, Long targetPatientId) {
        Long effectiveTarget = (targetPatientId != null) ? targetPatientId : caller.getId();
        User patient = careLinkService.resolveViewTarget(caller, effectiveTarget);

        return doseLogRepository
                .findByMedication_User_IdOrderByTakenAtDesc(patient.getId())
                .stream()
                .map(DoseLogResponse::from)
                .toList();
    }

    public List<DoseStatusResponse> statusForDate(User caller, LocalDate date, Long targetPatientId) {
        Long effectiveTarget = (targetPatientId != null) ? targetPatientId : caller.getId();
        User user = careLinkService.resolveViewTarget(caller, effectiveTarget);

        LocalDate target = (date != null) ? date : LocalDate.now();

        List<MedicationSchedule> schedules =
                scheduleRepository.findByMedication_User_IdAndActiveTrue(user.getId());

        Map<Long, DoseLog> logsBySchedule =
                doseLogRepository.findByMedication_User_IdAndDoseDate(user.getId(), target)
                        .stream()
                        .filter(d -> d.getSchedule() != null)
                        .collect(Collectors.toMap(
                                d -> d.getSchedule().getId(),
                                d -> d,
                                (a, b) -> a
                        ));

        LocalDateTime now = LocalDateTime.now();
        List<DoseStatusResponse> result = new ArrayList<>();

        for (MedicationSchedule s : schedules) {
            DoseStatus status = decideStatus(s, target, logsBySchedule, now);
            result.add(new DoseStatusResponse(
                    s.getId(),
                    s.getMedication().getId(),
                    s.getMedication().getName(),
                    s.getTimeOfDay(),
                    target,
                    status
            ));
        }
        return result;
    }

    private DoseStatus decideStatus(MedicationSchedule s,
                                    LocalDate target,
                                    Map<Long, DoseLog> logsBySchedule,
                                    LocalDateTime now) {
        // Rule 1: a logged dose is TAKEN regardless of the clock.
        // This is what lets late logging self-correct OVERDUE/MISSED -> TAKEN.
        if (logsBySchedule.containsKey(s.getId())) {
            return DoseStatus.TAKEN;
        }

        LocalDate today = now.toLocalDate();

        // A past day that was never logged is a genuine miss — the day is over.
        if (target.isBefore(today)) {
            return DoseStatus.MISSED;
        }

        // Target is today (or, defensively, the future).
        LocalDateTime deadline =
                target.atTime(s.getTimeOfDay()).plusMinutes(GRACE_MINUTES);

        // Past the grace deadline but still today -> OVERDUE (still takeable).
        // Not yet past -> UPCOMING.
        return now.isAfter(deadline) ? DoseStatus.OVERDUE : DoseStatus.UPCOMING;
    }
}
