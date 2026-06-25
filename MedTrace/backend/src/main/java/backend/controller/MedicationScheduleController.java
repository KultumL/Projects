package backend.controller;

import backend.dto.ScheduleRequest;
import backend.dto.ScheduleResponse;
import backend.model.User;
import backend.service.MedicationScheduleService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/schedules")
public class MedicationScheduleController {

    private final MedicationScheduleService scheduleService;

    public MedicationScheduleController(MedicationScheduleService scheduleService) {
        this.scheduleService = scheduleService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ScheduleResponse create(@AuthenticationPrincipal User user,
                                   @Valid @RequestBody ScheduleRequest request) {
        return scheduleService.create(user, request);
    }

    @GetMapping
    public List<ScheduleResponse> list(@AuthenticationPrincipal User user) {
        return scheduleService.listForUser(user);
    }

    @PatchMapping("/{id}/active")
    public ScheduleResponse setActive(@AuthenticationPrincipal User user,
                                      @PathVariable Long id,
                                      @RequestParam boolean active) {
        return scheduleService.setActive(id, active, user);
    }
}