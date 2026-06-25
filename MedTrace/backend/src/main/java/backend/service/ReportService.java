package backend.service;

import backend.dto.MedicationResponse;
import backend.dto.ScheduleResponse;
import backend.model.ReportPeriod;
import backend.model.User;
import backend.service.MedicationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import backend.dto.DoseLogResponse;
import backend.dto.DoseStatusResponse;
import backend.model.DoseStatus;
import backend.dto.CheckInResponse;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {
    private final PdfRenderer pdfRenderer;
    private final MedicationService medicationService;
    private final MedicationScheduleService scheduleService;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("MMMM d, yyyy");
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("h:mm a");
    private final CheckInService checkInService;
    private final DoseLogService doseLogService;
    private final NarrativeService narrativeService;

    public byte[] generateReport(User user, ReportPeriod period) {
        LocalDate start = period.resolveStartDate();
        LocalDate end   = LocalDate.now();

        String html = buildHtml(user, start, end);
        return pdfRenderer.htmlToPdf(html);
    }

    private String buildHtml(User user, LocalDate start, LocalDate end) {
        return "<html><head><meta charset='utf-8'/><style>"
             + css()
             + "</style></head><body>"
             + header(user, start, end)
             + medicationsSection(user)
             + adherenceSection(user, start, end)
             + checkInSection(user, start, end)
             + journalSummarySection(user, start, end)
             + "</body></html>";
    }

    private String header(User user, LocalDate start, LocalDate end) {
        return "<div class='header'>"
             + "<h1>MedTrace Health Report</h1>"
             + "<p><strong>Patient:</strong> " + esc(user.getName()) + "</p>"
             + "<p><strong>Period:</strong> " + start.format(DATE_FMT)
             + " to " + end.format(DATE_FMT) + "</p>"
             + "<p><strong>Generated:</strong> " + LocalDate.now().format(DATE_FMT) + "</p>"
             + "</div>";
    }

    private String medicationsSection(User user) {
        List<MedicationResponse> meds = medicationService.getMedications(user, null);
        Map<Long, List<ScheduleResponse>> schedulesByMed = scheduleService.listForUser(user)
                .stream()
                .collect(Collectors.groupingBy(ScheduleResponse::medicationId));

        if (meds.isEmpty()) {
            return "<h2>Medications</h2><p>No medications on record.</p>";
        }

        StringBuilder rows = new StringBuilder();
        for (MedicationResponse med : meds) {
            List<ScheduleResponse> schedules = schedulesByMed.getOrDefault(med.id(), List.of());
            String times = schedules.isEmpty()
                    ? "As needed"
                    : schedules.stream()
                        .map(s -> s.timeOfDay().format(TIME_FMT))
                        .collect(Collectors.joining(", "));

            rows.append("<tr>")
                .append("<td>").append(esc(med.name())).append("</td>")
                .append("<td>").append(esc(med.dosage())).append("</td>")
                .append("<td>").append(esc(med.frequency())).append("</td>")
                .append("<td>").append(esc(times)).append("</td>")
                .append("</tr>");
        }

        return "<h2>Medications</h2>"
             + "<table>"
             + "<thead><tr><th>Medication</th><th>Dosage</th>"
             + "<th>Frequency</th><th>Scheduled Times</th></tr></thead>"
             + "<tbody>" + rows + "</tbody>"
             + "</table>";
    }

    private String css() {
        return """
            body { font-family: 'Helvetica', sans-serif; color: #1a1a1a; font-size: 12px; }
            .header { border-bottom: 2px solid #2c5f7c; padding-bottom: 12px; margin-bottom: 20px; }
            h1 { color: #2c5f7c; font-size: 22px; margin: 0 0 8px 0; }
            h2 { color: #2c5f7c; font-size: 16px; margin-top: 24px;
                 border-bottom: 1px solid #ccc; padding-bottom: 4px; }
            .header p { margin: 2px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
            th { background-color: #eef3f6; }
            .journal-box { border: 1px solid #b0c4d0; background-color: #f7fafb;
                           border-radius: 4px; padding: 4px 16px 12px 16px; margin-top: 24px; }
            .journal-h { border-bottom: none; margin-top: 12px; }
            .journal-note { font-size: 10px; color: #555; font-style: italic;
                            margin-top: 0; }
                            """;
    }

    private String esc(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;");
    }
    private String adherenceSection(User user, LocalDate start, LocalDate end) {
        // Per-medication taken/missed, accumulated across every day in the period.
        Map<Long, int[]> tally = new java.util.LinkedHashMap<>(); // medId -> [taken, missed]
        Map<Long, String> names = new java.util.HashMap<>();
        int totalTaken = 0, totalMissed = 0;

        for (LocalDate day : start.datesUntil(end.plusDays(1)).toList()) {
            for (DoseStatusResponse d : doseLogService.statusForDate(user, day, null)) {
                names.putIfAbsent(d.medicationId(), d.medicationName());
                int[] tm = tally.computeIfAbsent(d.medicationId(), k -> new int[2]);
                if (d.status() == DoseStatus.TAKEN)  { tm[0]++; totalTaken++; }
                else if (d.status() == DoseStatus.MISSED) { tm[1]++; totalMissed++; }
                // UPCOMING (not yet due) and OVERDUE (late but still today,
                // not yet resolved) are both excluded from the rate. A dose
                // that ends the day unlogged becomes MISSED on the next day's
                // computation and is counted then.
            }
        }

        StringBuilder html = new StringBuilder("<h2>Medication Adherence</h2>");

        if (tally.isEmpty()) {
            html.append("<p>No scheduled doses in this period.</p>");
        } else {
            html.append("<p><strong>Overall:</strong> ")
                .append(rate(totalTaken, totalMissed))
                .append(" (").append(totalTaken).append(" taken, ")
                .append(totalMissed).append(" missed)</p>");

            StringBuilder rows = new StringBuilder();
            for (Map.Entry<Long, int[]> e : tally.entrySet()) {
                int taken = e.getValue()[0], missed = e.getValue()[1];
                rows.append("<tr>")
                    .append("<td>").append(esc(names.get(e.getKey()))).append("</td>")
                    .append("<td>").append(taken).append("</td>")
                    .append("<td>").append(missed).append("</td>")
                    .append("<td>").append(rate(taken, missed)).append("</td>")
                    .append("</tr>");
            }
            html.append("<table>")
                .append("<thead><tr><th>Medication</th><th>Taken</th>")
                .append("<th>Missed</th><th>Adherence</th></tr></thead>")
                .append("<tbody>").append(rows).append("</tbody></table>");
        }

        // PRN doses: raw event counts from the existing history call, filtered
        // to this period. Never part of the adherence rate — no schedule to adhere to.
        Map<String, Long> prnCounts = doseLogService.history(user, null).stream()
                .filter(d -> d.scheduleId() == null)
                .filter(d -> !d.doseDate().isBefore(start) && !d.doseDate().isAfter(end))
                .collect(Collectors.groupingBy(DoseLogResponse::medicationName, Collectors.counting()));

        if (!prnCounts.isEmpty()) {
            StringBuilder prnRows = new StringBuilder();
            prnCounts.forEach((name, count) ->
                prnRows.append("<tr><td>").append(esc(name)).append("</td><td>")
                       .append(count).append("</td></tr>"));
            html.append("<h2>As-Needed (PRN) Doses</h2>")
                .append("<table><thead><tr><th>Medication</th>")
                .append("<th>Times Taken</th></tr></thead><tbody>")
                .append(prnRows).append("</tbody></table>");
        }

        return html.toString();
    }

    private String rate(int taken, int missed) {
        int total = taken + missed;
        if (total == 0) return "\u2014"; // em-dash char as data, not prose: "no due doses"
        return Math.round(100.0 * taken / total) + "%";
    }
    private String checkInSection(User user, LocalDate start, LocalDate end) {
        List<CheckInResponse> checkIns = checkInService.getCheckIns(user, null).stream()
                .filter(c -> !c.checkInDate().isBefore(start) && !c.checkInDate().isAfter(end))
                .toList();

        StringBuilder html = new StringBuilder("<h2>Check-In Summary</h2>");

        if (checkIns.isEmpty()) {
            html.append("<p>No check-ins recorded in this period.</p>");
            return html.toString();
        }

        html.append("<p><strong>Check-ins logged:</strong> ")
            .append(checkIns.size()).append(" of ")
            .append(start.datesUntil(end.plusDays(1)).count()).append(" days</p>");

        // Each average is over only the days where that field was filled in.
        html.append("<table>")
            .append("<thead><tr><th>Metric</th><th>Average</th>")
            .append("<th>Days Recorded</th></tr></thead><tbody>")
            .append(metricRow("Mood (1-10)",   checkIns, CheckInResponse::mood))
            .append(metricRow("Energy (1-10)", checkIns, CheckInResponse::energy))
            .append(metricRow("Pain (1-10)",   checkIns, CheckInResponse::painLevel))
            .append(sleepRow(checkIns))
            .append("</tbody></table>");

        return html.toString();
    }

    // Integer metrics: average the non-null values, report how many days contributed.
    private String metricRow(String label, List<CheckInResponse> checkIns,
                             java.util.function.Function<CheckInResponse, Integer> field) {
        List<Integer> values = checkIns.stream()
                .map(field).filter(java.util.Objects::nonNull).toList();
        String avg = values.isEmpty() ? "\u2014"
                : String.format("%.1f", values.stream().mapToInt(Integer::intValue).average().orElse(0));
        return "<tr><td>" + label + "</td><td>" + avg
             + "</td><td>" + values.size() + "</td></tr>";
    }

    // Sleep is a Double, so it needs its own row rather than the Integer helper.
    private String sleepRow(List<CheckInResponse> checkIns) {
        List<Double> values = checkIns.stream()
                .map(CheckInResponse::sleepHours).filter(java.util.Objects::nonNull).toList();
        String avg = values.isEmpty() ? "\u2014"
                : String.format("%.1f hrs", values.stream().mapToDouble(Double::doubleValue).average().orElse(0));
        return "<tr><td>Sleep</td><td>" + avg
             + "</td><td>" + values.size() + "</td></tr>";
    }
    private String journalSummarySection(User user, LocalDate start, LocalDate end) {
        String summary = narrativeService.generateNarrative(user, start, end);

        // The narrative is generated from the patient's own journal/check-in
        // text. It is boxed and explicitly framed as non-clinical so a reader
        // never mistakes it for a finding the app or a clinician produced.
        return "<div class='journal-box'>"
             + "<h2 class='journal-h'>Journal Summary</h2>"
             + "<p class='journal-note'>This section summarizes the patient's own "
             + "daily journal entries from this period. It was generated automatically "
             + "and does not represent a medical assessment, diagnosis, or advice.</p>"
             + "<p>" + esc(summary) + "</p>"
             + "</div>";
    }
}