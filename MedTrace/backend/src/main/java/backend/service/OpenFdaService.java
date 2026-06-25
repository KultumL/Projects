package backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class OpenFdaService {

    private final RestClient restClient = RestClient.create();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public DrugInfo lookup(String drugName) {
        try {
            String responseBody = restClient.get()
                    .uri("https://api.fda.gov/drug/label.json?search=openfda.generic_name:{name}&limit=1", drugName)
                    .retrieve()
                    .body(String.class);

            if (responseBody == null) {
                return DrugInfo.empty();
            }

            JsonNode response = objectMapper.readTree(responseBody);

            if (!response.has("results") || response.get("results").isEmpty()) {
                return DrugInfo.empty();
            }

            JsonNode result = response.get("results").get(0);

            String purpose = firstString(result, "purpose");
            String warnings = firstString(result, "warnings");
            String sideEffects = firstString(result, "adverse_reactions");

            return new DrugInfo(purpose, warnings, sideEffects);

        } catch (Exception e) {
            return DrugInfo.empty();
        }
    }

    private String firstString(JsonNode node, String field) {
        if (node.has(field) && node.get(field).isArray() && !node.get(field).isEmpty()) {
            return node.get(field).get(0).asText();
        }
        return null;
    }

    public record DrugInfo(String purpose, String warnings, String sideEffects) {
        public static DrugInfo empty() {
            return new DrugInfo(null, null, null);
        }
    }
}