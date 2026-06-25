package backend.dto;

public record Anomaly(
        String type,        // machine label, e.g. "RISING_PAIN" — for logic/testing
        String observation  // plain factual statement of what was detected
) {
    // No from(entity) — like DoseStatusResponse, this is computed, not mapped.
    // 'observation' is deliberately factual and neutral ("pain rose from 2 to 6
    // over the period"); the AI phrasing layer makes it warm later, but the
    // raw detection states only what the numbers show — no interpretation.
}