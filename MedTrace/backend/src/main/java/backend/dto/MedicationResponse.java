package backend.dto;

import backend.model.Medication;

import java.time.LocalDateTime;

public record MedicationResponse(
    Long id,
    String name,
    String dosage,
    String frequency,
    LocalDateTime startDate,
    LocalDateTime createdAt,
    String purpose,
    String warnings,
    String sideEffects
) {
    public static MedicationResponse from(Medication med) {
        return new MedicationResponse(
            med.getId(),
            med.getName(),
            med.getDosage(),
            med.getFrequency(),
            med.getStartDate(),
            med.getCreatedAt(),
            med.getPurpose(),
            med.getWarnings(),
            med.getSideEffects()
        );
    }
}