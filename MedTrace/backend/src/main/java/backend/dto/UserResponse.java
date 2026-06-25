package backend.dto;

import backend.model.AgeRange;
import backend.model.User;

public record UserResponse(
    Long id,
    String name,
    String email,
    String role,
    AgeRange ageRange
) {
    public static UserResponse from(User user) {
        return new UserResponse(
            user.getId(),
            user.getName(),
            user.getEmail(),
            user.getRole().name(),
            user.getAgeRange()
        );
    }
}