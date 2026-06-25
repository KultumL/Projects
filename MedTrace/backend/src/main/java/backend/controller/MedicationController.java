package backend.controller;

import backend.dto.MedicationRequest;
import backend.dto.MedicationResponse;
import backend.dto.MedicationChangeResponse;
import backend.model.User;
import backend.service.MedicationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/medications")
@RequiredArgsConstructor

public class MedicationController {

    private final MedicationService medicationService;

    @PostMapping
    public MedicationResponse add(
            @Valid @RequestBody MedicationRequest request,
            @AuthenticationPrincipal User user
    ) {
        return medicationService.addMedication(request, user);
    }

    @GetMapping
    public List<MedicationResponse> list(@AuthenticationPrincipal User user,
                                         @RequestParam(required = false) Long patientId) {
        return medicationService.getMedications(user, patientId);
    }
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id, @AuthenticationPrincipal User user) {
        medicationService.deleteMedication(id, user);
    }
    @GetMapping("/changes")
    public List<MedicationChangeResponse> changes(@AuthenticationPrincipal User user) {
        return medicationService.getChangeHistory(user);
    }
    @PutMapping("/{id}")
    public MedicationResponse update(
            @PathVariable Long id,
            @Valid @RequestBody MedicationRequest request,
            @AuthenticationPrincipal User user
    ) {
        return medicationService.updateMedication(id, request, user);
    }
}