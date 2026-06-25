package backend.dto;

import backend.model.MedicationChange;

import java.time.LocalDateTime;

public record MedicationChangeResponse(
    Long id,
    String medicationName,
    String changeType,
    String details,
    LocalDateTime changedAt
) {
    public static MedicationChangeResponse from(MedicationChange change) {
        return new MedicationChangeResponse(
            change.getId(),
            change.getMedicationName(),
            change.getChangeType().name(),
            change.getDetails(),
            change.getChangedAt()
        );
    }
}