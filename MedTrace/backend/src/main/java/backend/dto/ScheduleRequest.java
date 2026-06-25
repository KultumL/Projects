package backend.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalTime;

public record ScheduleRequest(
        @NotNull(message = "medicationId is required")
        Long medicationId,
        
        @NotNull(message = "timeOfDay is required")
        LocalTime timeOfDay
) {}