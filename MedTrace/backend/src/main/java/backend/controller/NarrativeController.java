package backend.controller;

import backend.model.User;
import backend.service.NarrativeService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/narrative")
public class NarrativeController {

    private final NarrativeService narrativeService;

    public NarrativeController(NarrativeService narrativeService) {
        this.narrativeService = narrativeService;
    }

    // GET because generating a narrative is a read — it derives a summary
    // from existing data and changes nothing. User comes from the JWT, so
    // the narrative is always scoped to the caller's own check-ins.
    @GetMapping
    public Map<String, String> getNarrative(@AuthenticationPrincipal User user) {
        String narrative = narrativeService.generateNarrative(user);
        // Wrap in a small JSON object rather than returning a bare string —
        // gives the future app a stable shape ({"narrative": "..."}) to read,
        // consistent with how your other endpoints return structured JSON.
        return Map.of("narrative", narrative);
    }

    @GetMapping("/grounded")
    public Map<String, String> getGroundedNarrative(@AuthenticationPrincipal User user) {
        return Map.of("narrative", narrativeService.generateGroundedNarrative(user));
    }
}