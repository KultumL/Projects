package backend.controller;

import backend.dto.CheckInRequest;
import backend.dto.CheckInResponse;
import backend.model.User;
import backend.service.CheckInService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/checkins")
@RequiredArgsConstructor
public class CheckInController {

    private final CheckInService checkInService;

    @PostMapping
    public CheckInResponse create(
            @RequestBody CheckInRequest request,
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) Long patientId
    ) {
        return checkInService.createCheckIn(request, user, patientId);
    }

    // patientId optional: omitted -> own history; provided -> caregiver reads
    // that patient's history, view gate verifies an active link.
    @GetMapping
    public List<CheckInResponse> list(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) Long patientId
    ) {
        return checkInService.getCheckIns(user, patientId);
    }
}
