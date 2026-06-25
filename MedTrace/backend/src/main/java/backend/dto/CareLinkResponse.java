package backend.dto;

import backend.model.CareLink;
import backend.model.CareLinkPermission;
import backend.model.CareLinkStatus;

import java.time.LocalDateTime;

public record CareLinkResponse(
        Long id,
        Long patientId,
        String patientName,
        Long caregiverId,
        String caregiverName,
        CareLinkPermission permission,
        CareLinkStatus status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static CareLinkResponse from(CareLink link) {
        return new CareLinkResponse(
                link.getId(),
                link.getPatient().getId(),
                link.getPatient().getName(),
                link.getCaregiver().getId(),
                link.getCaregiver().getName(),
                link.getPermission(),
                link.getStatus(),
                link.getCreatedAt(),
                link.getUpdatedAt()
        );
    }
}