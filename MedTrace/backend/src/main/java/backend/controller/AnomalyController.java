package backend.controller;

import backend.dto.Anomaly;
import backend.model.User;
import backend.service.AnomalyDetectionService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/anomalies")
public class AnomalyController {

    private final AnomalyDetectionService anomalyDetectionService;

    public AnomalyController(AnomalyDetectionService anomalyDetectionService) {
        this.anomalyDetectionService = anomalyDetectionService;
    }

    // For now returns RAW detected anomalies (no AI phrasing yet) so we can
    // verify the rules fire correctly. We'll add the Gemini phrasing layer
    // once detection is confirmed.
    @GetMapping
    public List<Anomaly> getAnomalies(@AuthenticationPrincipal User user) {
        return anomalyDetectionService.detect(user);
    }
    // The phrased, patient-facing version — your code detects, Gemini phrases.
    @GetMapping("/summary")
    public java.util.Map<String, String> getAnomalySummary(@AuthenticationPrincipal User user) {
        return java.util.Map.of("summary", anomalyDetectionService.describeAnomalies(user));
    }
}