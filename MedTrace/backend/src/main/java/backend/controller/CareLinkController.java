package backend.controller;

import backend.dto.CareLinkRequest;
import backend.dto.CareLinkResponse;
import backend.model.User;
import backend.service.CareLinkService;
import jakarta.validation.Valid;

import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/care-links")
public class CareLinkController {

    private final CareLinkService careLinkService;

    public CareLinkController(CareLinkService careLinkService) {
        this.careLinkService = careLinkService;
    }

    // Patient invites a caregiver. The authenticated user is always the patient
    // here — patient-initiated by design.
    @PostMapping
    public CareLinkResponse invite(@AuthenticationPrincipal User patient,
                                   @Valid @RequestBody CareLinkRequest request) {
        return careLinkService.invite(patient, request);
    }

    // Patient: list links I created (as the patient).
    @GetMapping("/as-patient")
    public List<CareLinkResponse> asPatient(@AuthenticationPrincipal User user) {
        return careLinkService.linksAsPatient(user);
    }

    // Caregiver: list links where I'm the caregiver (pending + active invites).
    @GetMapping("/as-caregiver")
    public List<CareLinkResponse> asCaregiver(@AuthenticationPrincipal User user) {
        return careLinkService.linksAsCaregiver(user);
    }

    // Caregiver accepts a pending invite.
    @PatchMapping("/{id}/accept")
    public CareLinkResponse accept(@AuthenticationPrincipal User user,
                                   @PathVariable Long id) {
        return careLinkService.respondToInvite(user, id, true);
    }

    // Caregiver declines a pending invite.
    @PatchMapping("/{id}/decline")
    public CareLinkResponse decline(@AuthenticationPrincipal User user,
                                    @PathVariable Long id) {
        return careLinkService.respondToInvite(user, id, false);
    }

    // Either party revokes the link.
    @PatchMapping("/{id}/revoke")
    public CareLinkResponse revoke(@AuthenticationPrincipal User user,
                                   @PathVariable Long id) {
        return careLinkService.revoke(user, id);
    }
}