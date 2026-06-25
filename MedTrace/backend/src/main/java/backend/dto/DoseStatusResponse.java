package backend.dto;

import backend.model.DoseStatus;

import java.time.LocalDate;
import java.time.LocalTime;

public record DoseStatusResponse(
        Long scheduleId,
        Long medicationId,
        String medicationName,
        LocalTime scheduledTime,
        LocalDate date,
        DoseStatus status
) {

}