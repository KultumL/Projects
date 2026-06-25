package backend.service;

import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;


@Service
public class DrugEmbeddingService {

    private final GeminiService geminiService;
    private final JdbcTemplate jdbcTemplate;

    // JdbcTemplate is auto-configured by Spring Boot from your existing
    // DataSource — no setup needed, it just gets injected. We use it instead
    // of a JPA repository because drug_embeddings has a vector(768) column
    // Hibernate can't map, and raw SQL is the honest tool for that.
    public DrugEmbeddingService(GeminiService geminiService,
                                JdbcTemplate jdbcTemplate) {
        this.geminiService = geminiService;
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Embeds the given drug-fact text and stores it against a medication.
     * taskType is RETRIEVAL_DOCUMENT because this text is being indexed for
     * later retrieval (as opposed to a search query).
     */
    public void embedAndStore(Long medicationId, String content) {
        float[] vector = geminiService.embed(content, "RETRIEVAL_DOCUMENT");
        String vectorLiteral = toVectorLiteral(vector);

        // ::vector cast turns the bracketed string into pgvector's type.
        jdbcTemplate.update(
                "INSERT INTO drug_embeddings (medication_id, content, embedding) "
                        + "VALUES (?, ?, CAST(? AS vector))",
                medicationId, content, vectorLiteral);
    }

    /**
     * Formats a float[] as pgvector's expected literal: "[0.1,0.2,0.3]".
     * Plain comma-separated values inside square brackets — no spaces needed.
     */
    private String toVectorLiteral(float[] vec) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < vec.length; i++) {
            if (i > 0) sb.append(",");
            sb.append(vec[i]);
        }
        sb.append("]");
        return sb.toString();
    }
    /**
     * Retrieves the drug-fact chunks most semantically similar to a query.
     * Embeds the query (RETRIEVAL_QUERY task type — the search side, distinct
     * from RETRIEVAL_DOCUMENT used when storing), then asks pgvector for the
     * nearest rows by cosine distance.
     *
     * Scoped to a user: only searches embeddings for medications THIS user
     * owns, via the join to medications. A patient's RAG context never pulls
     * another patient's drug data.
     */
    public List<String> retrieveRelevant(Long userId, String query, int limit) {
        float[] queryVector = geminiService.embed(query, "RETRIEVAL_QUERY");
        String queryLiteral = toVectorLiteral(queryVector);

        // The <=> operator is pgvector's COSINE DISTANCE: smaller = more
        // similar. ORDER BY distance ASC LIMIT n gives the n nearest chunks.
        // We join drug_embeddings -> medications to scope by owner.
        return jdbcTemplate.query(
                """
                SELECT de.content
                FROM drug_embeddings de
                JOIN medications m ON m.id = de.medication_id
                WHERE m.user_id = ?
                ORDER BY de.embedding <=> CAST(? AS vector)
                LIMIT ?
                """,
                (rs, rowNum) -> rs.getString("content"),
                userId, queryLiteral, limit);
    }
}