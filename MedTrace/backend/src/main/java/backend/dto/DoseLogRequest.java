package backend.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record DoseLogRequest(
        @NotNull(message = "medicationId is required")
        Long medicationId,
        Long scheduleId,
        LocalDateTime takenAt,
        LocalDate doseDate
) {}