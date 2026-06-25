package backend.dto;

import backend.model.DailyCheckIn;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record CheckInResponse(
    Long id,
    LocalDate checkInDate,
    Integer mood,
    Integer energy,
    Integer painLevel,
    Double sleepHours,
    Boolean medicationsTaken,
    String journalEntry,
    LocalDateTime createdAt,
    Long enteredById,
    String enteredByName
) {
    public static CheckInResponse from(DailyCheckIn checkIn) {
        return new CheckInResponse(
            checkIn.getId(),
            checkIn.getCheckInDate(),
            checkIn.getMood(),
            checkIn.getEnergy(),
            checkIn.getPainLevel(),
            checkIn.getSleepHours(),
            checkIn.getMedicationsTaken(),
            checkIn.getJournalEntry(),
            checkIn.getCreatedAt(),
            checkIn.getEnteredBy() != null ? checkIn.getEnteredBy().getId() : null,
            checkIn.getEnteredBy() != null ? checkIn.getEnteredBy().getName() : null
        );
    }
}
