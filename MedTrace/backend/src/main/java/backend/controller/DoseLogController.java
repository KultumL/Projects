package backend.controller;

import backend.dto.DoseLogRequest;
import backend.dto.DoseLogResponse;
import backend.dto.DoseStatusResponse;
import backend.model.User;
import backend.service.DoseLogService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import backend.service.AnomalyDetectionService;
import backend.service.CareLinkService;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/doses")
public class DoseLogController {

    private final DoseLogService doseLogService;
    private final CareLinkService careLinkService;
    private final AnomalyDetectionService anomalyDetectionService;

    public DoseLogController(DoseLogService doseLogService,
                            CareLinkService careLinkService,
                            AnomalyDetectionService anomalyDetectionService) {
        this.doseLogService = doseLogService;
        this.careLinkService = careLinkService;
        this.anomalyDetectionService = anomalyDetectionService;
    }

    // Log that a dose was taken. 201 — a resource was created.
    // patientId optional: omitted => caller logs their own dose (unchanged);
    // provided => caller acts as caregiver, gate verifies VIEW_AND_INPUT access.
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DoseLogResponse logDose(@AuthenticationPrincipal User user,
                                   @Valid @RequestBody DoseLogRequest request,
                                   @RequestParam(required = false) Long patientId) {
        return doseLogService.logDose(user, request, patientId);
    }

    // Detection: status of every scheduled dose for a date (default today).
    @GetMapping("/status")
    public List<DoseStatusResponse> status(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) Long patientId) {
        List<DoseStatusResponse> result = doseLogService.statusForDate(user, date, patientId);

        // When a caregiver views a patient's status, check for a missed-dose
        // cluster and email the patient's caregivers if found. Best-effort:
        // resolve the patient through the same view gate, then alert. Only fires
        // when patientId is set (a caregiver acting), never on a patient's own view.
        if (patientId != null) {
            User patient = careLinkService.resolveViewTarget(user, patientId);
            anomalyDetectionService.alertCaregiversIfMissedDoseCluster(patient);
        }

        return result;
    }
    // Raw history of logged doses, newest first.
    @GetMapping
    public List<DoseLogResponse> history(@AuthenticationPrincipal User user,
                                         @RequestParam(required = false) Long patientId) {
        return doseLogService.history(user, patientId);
    }
}
