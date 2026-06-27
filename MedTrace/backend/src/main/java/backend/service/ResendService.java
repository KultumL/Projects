package backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

import backend.model.CareLink;
import backend.model.CareLinkStatus;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.HttpStatusCodeException;

@Service
public class ResendService {

    private final String apiKey;
    private final String fromAddress;
    private final String baseUrl;
    private final RestClient restClient = RestClient.create();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ResendService(
            @Value("${resend.api.key}") String apiKey,
            @Value("${resend.from}") String fromAddress,
            @Value("${resend.api.url}") String baseUrl) {
        this.apiKey = apiKey;
        this.fromAddress = fromAddress;
        this.baseUrl = baseUrl;
    }

    /**
     * Sends a plain-text email. Returns true on success, false on any failure.
     * Email is best-effort: a send failure must never break the request that
     * triggered it, so failures are swallowed and reported via the return value.
     */
    public boolean sendEmail(String to, String subject, String body) {
        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("from", fromAddress);
        ArrayNode toArray = payload.putArray("to");
        toArray.add(to);
        payload.put("subject", subject);
        payload.put("text", body);

        try {
            restClient.post()
                    .uri(baseUrl)
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .body(payload.toString())
                    .retrieve()
                    .toBodilessEntity();
            return true;
        } catch (HttpStatusCodeException e) {
            // Resend returned an error status — log-and-continue, don't throw.
            System.err.println("Resend send failed: " + e.getStatusCode()
                    + " " + e.getResponseBodyAsString());
            return false;
        } catch (Exception e) {
            System.err.println("Resend send error: " + e.getMessage());
            return false;
        }
    }
    
}