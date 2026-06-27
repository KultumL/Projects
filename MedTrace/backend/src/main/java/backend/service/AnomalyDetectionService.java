package backend.service;

import backend.dto.Anomaly;
import backend.model.DailyCheckIn;
import backend.model.User;
import backend.repository.DailyCheckInRepository;
import backend.dto.DoseStatusResponse;
import backend.model.DoseStatus;
import backend.model.CareLink;
import backend.model.CareLinkStatus;
import backend.repository.CareLinkRepository;

import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class AnomalyDetectionService {

    private static final int WINDOW_DAYS = 14;

    // --- Thresholds. These are TRANSPARENT OBSERVATIONAL TRIGGERS for when to
    // --- surface a pattern to the patient — NOT medical/diagnostic criteria.
    // --- They decide when to show someone their own trend, nothing more.
    // --- Tunable; chosen as reasonable, explainable starting points.
    private static final int RISING_PAIN_DELTA = 3;     // pain up >=3 points across window
    private static final int LOW_MOOD_VALUE = 2;        // mood <=2 counts as "low"
    private static final int LOW_MOOD_RUN = 3;
    private static final int MISSED_DOSE_THRESHOLD = 5;   // >=5 missed in window          // ...for >=3 consecutive check-ins

    private final DailyCheckInRepository checkInRepository;
    private final GeminiService geminiService;
    private final DoseLogService doseLogService;
    private final CareLinkRepository careLinkRepository;
    private final ResendService resendService;

    public AnomalyDetectionService(DailyCheckInRepository checkInRepository,
                                   GeminiService geminiService,
                                   DoseLogService doseLogService,
                                   CareLinkRepository careLinkRepository,
                                   ResendService resendService) {
        this.checkInRepository = checkInRepository;
        this.geminiService = geminiService;
        this.doseLogService = doseLogService;
        this.careLinkRepository = careLinkRepository;
        this.resendService = resendService;
    }

    public List<Anomaly> detect(User user) {
        LocalDate cutoff = LocalDate.now().minusDays(WINDOW_DAYS);

        // Fetch window, then sort OLDEST-first. The repo returns newest-first,
        // but trend logic ("did pain rise over time?") reads naturally in
        // chronological order, so we reverse it once here.
        List<DailyCheckIn> checkIns = checkInRepository
                .findByUserOrderByCheckInDateDesc(user)
                .stream()
                .filter(c -> !c.getCheckInDate().isBefore(cutoff))
                .sorted(Comparator.comparing(DailyCheckIn::getCheckInDate))
                .toList();

        List<Anomaly> anomalies = new ArrayList<>();

        // Dose-based detection is independent of check-in volume — run it first.
        checkMissedDoses(user, anomalies);

        // Check-in trend rules need at least 2 data points to be meaningful.
        if (checkIns.size() >= 2) {
            checkRisingPain(checkIns, anomalies);
            checkSustainedLowMood(checkIns, anomalies);
        }

        return anomalies;
    }

    /**
     * Rising pain: compare the window's BASELINE (earliest recorded pain)
     * against its PEAK (highest recorded pain). If the peak exceeded the
     * baseline by >= RISING_PAIN_DELTA, flag it.
     *
     * We use peak rather than the last value on purpose: a pain spike that
     * later recedes is still a pain event worth surfacing. Comparing
     * earliest-to-latest would miss a mid-window spike if pain dipped again
     * by the final check-in — which is common in noisy real data.
     */
    private void checkRisingPain(List<DailyCheckIn> checkIns, List<Anomaly> out) {
        Integer baselinePain = null;   // earliest recorded
        Integer peakPain = null;       // highest recorded anywhere in window

        for (DailyCheckIn c : checkIns) {
            if (c.getPainLevel() == null) continue;   // skip days pain wasn't logged
            if (baselinePain == null) {
                baselinePain = c.getPainLevel();       // first recorded value
            }
            if (peakPain == null || c.getPainLevel() > peakPain) {
                peakPain = c.getPainLevel();           // track the maximum
            }
        }

        // Need at least one recorded pain value, and a real rise above baseline.
        if (baselinePain == null) return;

        if (peakPain - baselinePain >= RISING_PAIN_DELTA) {
            out.add(new Anomaly(
                    "RISING_PAIN",
                    "Reported pain rose from a baseline of " + baselinePain
                            + "/10 to a peak of " + peakPain + "/10 during the period."
            ));
        }
    }

    /**
     * Sustained low mood: any run of >= LOW_MOOD_RUN consecutive check-ins
     * (by recorded order) where mood <= LOW_MOOD_VALUE. A null mood breaks
     * the run (we don't assume a skipped day was low).
     */
    private void checkSustainedLowMood(List<DailyCheckIn> checkIns, List<Anomaly> out) {
        int run = 0;
        for (DailyCheckIn c : checkIns) {
            Integer mood = c.getMood();
            if (mood != null && mood <= LOW_MOOD_VALUE) {
                run++;
                if (run >= LOW_MOOD_RUN) {
                    out.add(new Anomaly(
                            "SUSTAINED_LOW_MOOD",
                            "Mood was logged at " + LOW_MOOD_VALUE + "/5 or below for "
                                    + run + " or more check-ins in a row."
                    ));
                    return; // one flag is enough; don't re-fire as the run extends
                }
            } else {
                run = 0; // null or higher mood resets the streak
            }
        }
    }
    /**
     * Phrases detected anomalies into a warm, plain-English summary via Gemini.
     * The AI ONLY rephrases facts your code already detected — it does not
     * decide what's notable. Same integrity boundary as narratives: describe,
     * never diagnose, advise, or claim causes.
     */
    public String describeAnomalies(User user) {
        List<Anomaly> anomalies = detect(user);

        // No anomalies => say so plainly. Don't spend a Gemini call (or its
        // tokens) inventing concern where the rules found none.
        if (anomalies.isEmpty()) {
            return "No notable trends stood out in your check-ins over the last "
                    + WINDOW_DAYS + " days.";
        }

        // Build the factual findings list for the model to phrase.
        StringBuilder findings = new StringBuilder();
        findings.append("The following patterns were detected in the patient's "
                + "own check-in data:\n");
        for (Anomaly a : anomalies) {
            findings.append("- ").append(a.observation()).append("\n");
        }

        String systemInstruction = """
            You are a careful assistant. You are given a list of patterns that have \
            ALREADY been detected in a patient's own self-reported check-in data. \
            Your only job is to restate these specific findings warmly and clearly \
            for the patient, in 2-4 sentences.

            Strict rules:
            - Only restate the findings you are given. Do NOT add new observations, \
              and do NOT invent anything not in the list.
            - Frame them as gentle observations, e.g. "We noticed that ...". \
              Do NOT diagnose or name any medical condition.
            - Do NOT give advice or recommendations. Never say "you should", "try", \
              "consider", or suggest any treatment or action.
            - Do NOT claim causes. Do not say one thing caused or explains another.
            - End with one short sentence reminding the reader these are observations \
              from their own entries, not medical advice.
            """;

        return geminiService.generate(systemInstruction, findings.toString());
    }
    /**
     * Missed-dose cluster: count MISSED scheduled doses across the window by
     * asking DoseLogService for each day's dose status (reusing Week 4's
     * detection). If the total reaches MISSED_DOSE_THRESHOLD, flag it.
     *
     * Note this loops one statusForDate call per day — fine at this data scale.
     * PRN/as-needed doses never appear as MISSED (they have no schedule), so
     * they can't inflate this count — that property comes free from Week 4.
     */
    private void checkMissedDoses(User user, List<Anomaly> out) {
        int missedCount = 0;
        LocalDate today = LocalDate.now();

        // Walk each day in the window, summing MISSED statuses.
        for (int daysAgo = 0; daysAgo < WINDOW_DAYS; daysAgo++) {
            LocalDate date = today.minusDays(daysAgo);
            List<DoseStatusResponse> statuses = doseLogService.statusForDate(user, date, null);
            for (DoseStatusResponse s : statuses) {
                if (s.status() == DoseStatus.MISSED) {
                    missedCount++;
                }
            }
        }

        if (missedCount >= MISSED_DOSE_THRESHOLD) {
            out.add(new Anomaly(
                    "MISSED_DOSE_CLUSTER",
                    missedCount + " scheduled doses were missed over the last "
                            + WINDOW_DAYS + " days."
            ));
        }
    }
    public int alertCaregiversIfMissedDoseCluster(User patient) {
        boolean hasCluster = detect(patient).stream()
                .anyMatch(a -> "MISSED_DOSE_CLUSTER".equals(a.type()));
        if (!hasCluster) return 0;

        List<CareLink> links = careLinkRepository.findByPatient(patient);
        int sent = 0;
        for (CareLink link : links) {
            if (link.getStatus() != CareLinkStatus.ACTIVE) continue;
            User caregiver = link.getCaregiver();

            String subject = "MedTrace: a check-in note about " + patient.getName();
            String body = "Hello " + caregiver.getName() + ",\n\n"
                    + "This is an automated note from MedTrace. Over the recent period, "
                    + patient.getName() + " has a number of scheduled medication doses "
                    + "logged as missed.\n\n"
                    + "This is a simple observation from their own dose records, not "
                    + "medical advice. You may want to check in with them.\n\n"
                    + "- MedTrace";

            if (resendService.sendEmail(caregiver.getEmail(), subject, body)) {
                sent++;
            }
        }
        return sent;
    }
    
}