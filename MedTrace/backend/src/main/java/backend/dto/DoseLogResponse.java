package backend.dto;

import backend.model.DoseLog;

import java.time.LocalTime;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record DoseLogResponse(
        Long id,
        Long medicationId,
        String medicationName,
        Long scheduleId,
        LocalTime scheduledTime,
        LocalDateTime takenAt,
        LocalDate doseDate,
        Long enteredById,
        String enteredByName
) {
    public static DoseLogResponse from(DoseLog d) {

        Long schedId = d.getSchedule() != null ? d.getSchedule().getId() : null;
        LocalTime schedTime = d.getSchedule() != null ? d.getSchedule().getTimeOfDay() : null;

        return new DoseLogResponse(
                d.getId(),
                d.getMedication().getId(),
                d.getMedication().getName(),
                schedId,
                schedTime,
                d.getTakenAt(),
                d.getDoseDate(),
                d.getEnteredBy() != null ? d.getEnteredBy().getId() : null,
                d.getEnteredBy() != null ? d.getEnteredBy().getName() : null
        );
    }
}
