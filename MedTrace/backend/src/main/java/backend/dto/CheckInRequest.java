package backend.dto;

import java.time.LocalDate;

public record CheckInRequest(
    LocalDate checkInDate,
    Integer mood,
    Integer energy,
    Integer painLevel,
    Double sleepHours,
    Boolean medicationsTaken,
    String journalEntry
) {}