package backend.dto;

import backend.model.MedicationSchedule;

import java.time.LocalTime;

public record ScheduleResponse(
        Long id,
        Long medicationId,
        String medicationName,
        LocalTime timeOfDay,
        boolean active
) {

    public static ScheduleResponse from(MedicationSchedule s) {
        return new ScheduleResponse(
                s.getId(),
                s.getMedication().getId(),
                s.getMedication().getName(),
                s.getTimeOfDay(),
                s.isActive()
        );
    }
}