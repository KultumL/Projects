package backend.dto;

import jakarta.validation.constraints.NotBlank;

public record MedicationRequest(
    @NotBlank(message = "Medication name is required")
    String name,

    @NotBlank(message = "Dosage is required")
    String dosage,

    @NotBlank(message = "Frequency is required")
    String frequency
) {}