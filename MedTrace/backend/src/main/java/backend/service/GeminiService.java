package backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.HttpStatusCodeException;

@Service
public class GeminiService {

    // Injected from application.properties (which read them from env vars).
    // The key has no fallback on purpose — app fails loudly if it's missing,
    // rather than silently running without auth.
    private final String apiKey;
    private final String model;
    private final String baseUrl;

    private final RestClient restClient = RestClient.create();
    // One reusable mapper — same manual-parse approach as OpenFdaService,
    // because RestClient.body(JsonNode.class) throws in Spring Boot 4.
    private final ObjectMapper objectMapper = new ObjectMapper();
    private static final String EMBED_MODEL = "gemini-embedding-001";
    private static final int EMBED_DIMENSIONS = 768;
    public GeminiService(
            @Value("${gemini.api.key}") String apiKey,
            @Value("${gemini.model}") String model,
            @Value("${gemini.api.url}") String baseUrl) {
        this.apiKey = apiKey;
        this.model = model;
        this.baseUrl = baseUrl;
    }

    /**
     * Takes a system instruction (the behavioral guardrails) and a user prompt
     * (the actual content/data), calls Gemini, returns the generated text.
     * Split into two params because Gemini has a dedicated systemInstruction
     * field — keeping the "never advise" rules separate from the data.
     */
    public String generate(String systemInstruction, String userPrompt) {
        // Build the request body with Jackson rather than string concatenation.
        // Hand-building JSON with String.format invites escaping bugs the
        // moment a journal entry contains a quote or newline — the mapper
        // escapes everything correctly for free.
        ObjectNode root = objectMapper.createObjectNode();

        // systemInstruction: { "parts": [ { "text": "..." } ] }
        ObjectNode sysInstruction = root.putObject("systemInstruction");
        ArrayNode sysParts = sysInstruction.putArray("parts");
        sysParts.addObject().put("text", systemInstruction);

        // contents: [ { "parts": [ { "text": "..." } ] } ]
        ArrayNode contents = root.putArray("contents");
        ObjectNode contentItem = contents.addObject();
        ArrayNode userParts = contentItem.putArray("parts");
        userParts.addObject().put("text", userPrompt);

        String url = baseUrl + "/" + model + ":generateContent";

        try {
            // Fetch as String, then parse — the Spring Boot 4 RestClient pattern.
            String responseBody = restClient.post()
                    .uri(url)
                    .header("x-goog-api-key", apiKey)
                    .header("Content-Type", "application/json")
                    .body(root.toString())
                    .retrieve()
                    .body(String.class);

            return extractText(responseBody);

        } catch (HttpStatusCodeException e) {
            // Gemini returned a 4xx/5xx — most commonly a 503 "model busy"
            // (UNAVAILABLE), which is transient and on Google's side. We saw
            // this live. Degrade gracefully rather than 500-ing the user.
            // Same instinct as OpenFDA: an external service hiccup shouldn't
            // crash our feature.
            return "The summary service is briefly unavailable. Please try again in a moment.";
        } catch (Exception e) {
            // Network failure, timeout, malformed request — anything else.
            // Still degrade rather than propagate.
            return "A summary could not be generated right now. Please try again later.";
        }
    }
    /**
     * Turns text into a 768-dim embedding vector via Gemini's embedContent
     * endpoint. taskType tells the model how the vector will be used:
     * RETRIEVAL_DOCUMENT for text we're storing, RETRIEVAL_QUERY for a search.
     *
     * Returns a NORMALIZED float[] (unit length). Normalization is mandatory
     * at 768 dims — Gemini only pre-normalizes the full 3072-dim output, so
     * at any smaller size we must do it ourselves or cosine similarity is wrong.
     */
    public float[] embed(String text, String taskType) {
        ObjectNode root = objectMapper.createObjectNode();
        // content: { "parts": [ { "text": "..." } ] }
        ObjectNode content = root.putObject("content");
        content.putArray("parts").addObject().put("text", text);
        root.put("taskType", taskType);
        root.put("outputDimensionality", EMBED_DIMENSIONS);

        String url = baseUrl + "/" + EMBED_MODEL + ":embedContent";

        try {
            String responseBody = restClient.post()
                    .uri(url)
                    .header("x-goog-api-key", apiKey)
                    .header("Content-Type", "application/json")
                    .body(root.toString())
                    .retrieve()
                    .body(String.class);

            return extractEmbedding(responseBody);
        } catch (HttpStatusCodeException e) {
            throw new RuntimeException("Embedding request failed: " + e.getStatusCode(), e);
        }
    }

    /**
     * Pulls the vector from embedding.values, converts to float[], and
     * normalizes to unit length.
     */
    private float[] extractEmbedding(String responseBody) {
        try {
            JsonNode values = objectMapper.readTree(responseBody)
                    .path("embedding")
                    .path("values");
            if (!values.isArray() || values.isEmpty()) {
                throw new RuntimeException("No embedding returned");
            }

            float[] vec = new float[values.size()];
            for (int i = 0; i < values.size(); i++) {
                vec[i] = (float) values.get(i).asDouble();
            }
            return normalize(vec);
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse embedding response", e);
        }
    }

    /**
     * Scales a vector to unit length (magnitude 1). Required because cosine
     * similarity compares direction, not magnitude — and at 768 dims Gemini
     * returns un-normalized vectors. Divides each component by the L2 norm.
     */
    private float[] normalize(float[] vec) {
        double sumSquares = 0;
        for (float v : vec) sumSquares += v * v;
        double magnitude = Math.sqrt(sumSquares);
        if (magnitude == 0) return vec; // avoid divide-by-zero on a zero vector
        for (int i = 0; i < vec.length; i++) {
            vec[i] = (float) (vec[i] / magnitude);
        }
        return vec;
    }

    /**
     * Digs the generated text out of Gemini's response shape:
     * candidates[0].content.parts[0].text
     * Defensive at each hop — a safety block or empty candidate list means
     * the path isn't there, and we'd rather return a clear message than NPE.
     */
    private String extractText(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode candidates = root.path("candidates");
            if (!candidates.isArray() || candidates.isEmpty()) {
                // Happens if the prompt was blocked or nothing generated.
                return "No narrative could be generated at this time.";
            }
            JsonNode text = candidates.get(0)
                    .path("content")
                    .path("parts")
                    .path(0)
                    .path("text");
            return text.asText("No narrative could be generated at this time.");
        } catch (Exception e) {
            // Malformed/unexpected response — degrade gracefully, like the
            // OpenFDA "unrecognized drug saves with null facts" instinct.
            return "No narrative could be generated at this time.";
        }
    }
}