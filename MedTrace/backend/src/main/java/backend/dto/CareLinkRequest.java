package backend.dto;

import backend.model.CareLinkPermission;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CareLinkRequest(
        @NotBlank @Email String caregiverEmail,
        @NotNull CareLinkPermission permission
) {}