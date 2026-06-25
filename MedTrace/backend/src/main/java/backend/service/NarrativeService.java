package backend.service;

import backend.model.DailyCheckIn;
import backend.model.User;
import backend.repository.DailyCheckInRepository;
import backend.service.DrugEmbeddingService;
import backend.repository.MedicationRepository;
import backend.model.Medication;
import backend.repository.MedicationRepository;

import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class NarrativeService {

    private static final int WINDOW_DAYS = 14;

    private final DailyCheckInRepository checkInRepository;
    private final GeminiService geminiService;
    private final MedicationRepository medicationRepository;
    private final DrugEmbeddingService drugEmbeddingService;
    private static final int GROUNDING_CHUNKS = 3;

    public NarrativeService(DailyCheckInRepository checkInRepository,
                            GeminiService geminiService,
                            MedicationRepository medicationRepository,
                            DrugEmbeddingService drugEmbeddingService) {
        this.checkInRepository = checkInRepository;
        this.geminiService = geminiService;
        this.medicationRepository = medicationRepository;
        this.drugEmbeddingService = drugEmbeddingService;
    }

    public String generateNarrative(User user) {
        // Default window: the trailing 14 days, ending today.
        return generateNarrative(user, LocalDate.now().minusDays(WINDOW_DAYS), LocalDate.now());
    }

    public String generateNarrative(User user, LocalDate start, LocalDate end) {
        // Filter check-ins to the explicit [start, end] window, inclusive.
        List<DailyCheckIn> recent = checkInRepository
                .findByUserOrderByCheckInDateDesc(user)
                .stream()
                .filter(c -> !c.getCheckInDate().isBefore(start)
                          && !c.getCheckInDate().isAfter(end))
                .toList();

        if (recent.isEmpty()) {
            return "There aren't enough check-ins in this period to generate a "
                    + "summary yet. Log a few daily check-ins and try again.";
        }

        String systemInstruction = buildSystemInstruction();
        String userPrompt = buildDataPrompt(recent);
        return geminiService.generate(systemInstruction, userPrompt);
    }

    /**
     * The integrity boundary of the whole feature. These rules keep the model
     * on the OBSERVATION side: it describes what was logged, never interprets
     * it medically, never advises. Worded as hard constraints because that's
     * what your project's "AI summarizes, never advises" promise requires.
     */
    private String buildSystemInstruction() {
        return """
            You are a careful assistant that writes a short, plain-English summary \
            of a patient's own self-reported health check-ins. You ONLY describe \
            patterns that are present in the data you are given.

            Strict rules you must follow:
            - Describe what the patient reported, using phrasing like "you reported" \
              or "your logs show". Do NOT diagnose, and do NOT name or suggest any \
              medical condition.
            - Do NOT give medical advice or recommendations. Never say "you should", \
              "try", "consider", or suggest any treatment, medication, or action.
            - Do NOT claim causes. Never say one thing caused, led to, or explains \
              another (for example, do not link mood to medication). You may note \
              that two things happened in the same period, but not that one caused \
              the other.
            - Stay strictly within the numbers and notes provided. Do not invent or \
              assume anything not present in the data.
            - Keep it to 3-5 sentences, warm and readable, for the patient themselves.
            - End with one short sentence reminding the reader this is a summary of \
              their own entries, not medical advice.

            If there is very little data, say so plainly rather than padding.
            """;
    }

    /**
     * Formats the gathered check-ins as plain text for the model to summarize.
     * One line per check-in. Null-safe: any field the patient skipped is shown
     * as "not recorded" rather than crashing or printing "null".
     */
    private String buildDataPrompt(List<DailyCheckIn> checkIns) {
        DateTimeFormatter dateFmt = DateTimeFormatter.ofPattern("MMM d");
        StringBuilder sb = new StringBuilder();
        sb.append("Here are the patient's daily check-ins for the report period, ")
          .append("newest first:\n\n");

        for (DailyCheckIn c : checkIns) {
            sb.append("- ").append(c.getCheckInDate().format(dateFmt)).append(": ");
            sb.append("mood ").append(fmt(c.getMood())).append("/10, ");
            sb.append("energy ").append(fmt(c.getEnergy())).append("/10, ");
            sb.append("pain ").append(fmt(c.getPainLevel())).append("/10, ");
            sb.append("sleep ").append(fmt(c.getSleepHours())).append("h, ");
            sb.append("meds taken: ").append(fmt(c.getMedicationsTaken()));
            if (c.getJournalEntry() != null && !c.getJournalEntry().isBlank()) {
                sb.append(", journal: \"").append(c.getJournalEntry()).append("\"");
            }
            sb.append("\n");
        }
        return sb.toString();
    }
    /**
     * Like generateNarrative, but GROUNDED in retrieved FDA drug facts (RAG).
     * Flow: gather check-ins -> get the patient's medication names -> retrieve
     * the most relevant stored drug facts by vector similarity -> inject them
     * as factual context -> generate. The model summarizes the patient's data
     * informed by real drug-label facts rather than its own training.
     */
    public String generateGroundedNarrative(User user) {
        // Same check-in gathering as the plain narrative.
        LocalDate cutoff = LocalDate.now().minusDays(WINDOW_DAYS);
        List<DailyCheckIn> recent = checkInRepository
                .findByUserOrderByCheckInDateDesc(user)
                .stream()
                .filter(c -> !c.getCheckInDate().isBefore(cutoff))
                .toList();

        if (recent.isEmpty()) {
            return "There aren't enough check-ins in the last "
                    + WINDOW_DAYS + " days to generate a summary yet. "
                    + "Log a few daily check-ins and try again.";
        }

        // Build the retrieval query from the patient's medication NAMES.
        // We search drug-fact embeddings for the drugs they're actually on.
        List<Medication> meds = medicationRepository.findByUser(user);
        String medNames = meds.stream()
                .map(Medication::getName)
                .collect(Collectors.joining(", "));

        // Retrieve the most relevant stored drug facts. If the patient has no
        // meds (empty query) or nothing is embedded yet, this returns empty
        // and we simply generate without grounding rather than failing.
        List<String> groundingFacts = medNames.isBlank()
                ? List.of()
                : drugEmbeddingService.retrieveRelevant(user.getId(), medNames, GROUNDING_CHUNKS);

        String systemInstruction = buildGroundedSystemInstruction();
        String userPrompt = buildGroundedPrompt(recent, groundingFacts);

        return geminiService.generate(systemInstruction, userPrompt);
    }

    private String buildGroundedSystemInstruction() {
        return """
            You are a careful assistant that writes a short, plain-English summary \
            of a patient's own self-reported health check-ins. You may be given \
            factual drug information from official FDA labels as background context.

            Strict rules you must follow:
            - Describe what the patient reported, using phrasing like "you reported" \
              or "your logs show". Do NOT diagnose or name any medical condition.
            - You may mention the provided drug facts as neutral background \
              (e.g. "FDA labeling notes that ..."), but ONLY as factual context. \
              Do NOT turn a drug fact into advice or a recommendation. Never say \
              "you should", "try", "consider", "watch for", or suggest any action.
            - Do NOT claim causes. Do not link the patient's symptoms to a drug, \
              or say one thing caused another. You may state facts side by side, \
              not as cause and effect.
            - Only use drug facts that are actually relevant to what the patient \
              reported. If a provided fact isn't relevant, leave it out.
            - Keep it to 3-6 sentences, warm and readable, for the patient.
            - End with one short sentence reminding the reader this is a summary of \
              their own entries and general drug information, not medical advice.
            """;
    }

    private String buildGroundedPrompt(List<DailyCheckIn> checkIns, List<String> facts) {
        StringBuilder sb = new StringBuilder();
        sb.append(buildDataPrompt(checkIns));  // reuse existing check-in formatter

        if (!facts.isEmpty()) {
            sb.append("\nRelevant drug information (from FDA labels), for factual context only:\n");
            for (String fact : facts) {
                sb.append("- ").append(fact).append("\n");
            }
        }
        return sb.toString();
    }

    // Renders a possibly-null value as "not recorded" instead of "null".
    private String fmt(Object value) {
        return value == null ? "not recorded" : value.toString();
    }
}