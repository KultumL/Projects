package backend.service;

import backend.dto.MedicationRequest;
import backend.dto.MedicationResponse;
import backend.model.Medication;
import backend.model.MedicationChange;
import backend.model.User;
import backend.repository.MedicationRepository;
import backend.repository.MedicationChangeRepository;
import lombok.RequiredArgsConstructor;
import backend.dto.MedicationChangeResponse;
import backend.service.DrugEmbeddingService;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MedicationService {

    private final MedicationRepository medicationRepository;
    private final OpenFdaService openFdaService;
    private final MedicationChangeRepository medicationChangeRepository;
    private final CareLinkService careLinkService;
    private final DrugEmbeddingService drugEmbeddingService;
    
    public MedicationResponse addMedication(MedicationRequest request, User user) {
        OpenFdaService.DrugInfo drugInfo = openFdaService.lookup(request.name());

        Medication medication = Medication.builder()
                .name(request.name())
                .dosage(request.dosage())
                .frequency(request.frequency())
                .startDate(LocalDateTime.now())
                .user(user)
                .purpose(drugInfo.purpose())
                .warnings(drugInfo.warnings())
                .sideEffects(drugInfo.sideEffects())
                .build();

        Medication saved = medicationRepository.save(medication);
        logChange(user, saved.getName(), MedicationChange.ChangeType.ADDED, "Medication added");
        embedFacts(saved);
        return MedicationResponse.from(saved);
    }

    public List<MedicationResponse> getMedications(User caller, Long targetPatientId) {
        Long effectiveTarget = (targetPatientId != null) ? targetPatientId : caller.getId();
        User patient = careLinkService.resolveViewTarget(caller, effectiveTarget);

        return medicationRepository.findByUser(patient)
                .stream()
                .map(MedicationResponse::from)
                .toList();
    }

    public void deleteMedication(Long medicationId, User user) {
        Medication medication = medicationRepository.findById(medicationId)
                .orElseThrow(() -> new RuntimeException("Medication not found"));

        if (!medication.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("You do not have permission to delete this medication");
        }

        logChange(user, medication.getName(), MedicationChange.ChangeType.REMOVED, "Medication removed");
        medicationRepository.delete(medication);
    }

    public MedicationResponse updateMedication(Long medicationId, MedicationRequest request, User user) {
        Medication medication = medicationRepository.findById(medicationId)
                .orElseThrow(() -> new RuntimeException("Medication not found"));

        if (!medication.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("You do not have permission to edit this medication");
        }

        boolean nameChanged = !medication.getName().equalsIgnoreCase(request.name());
        boolean dosageChanged = !medication.getDosage().equalsIgnoreCase(request.dosage());

        medication.setName(request.name());
        medication.setDosage(request.dosage());
        medication.setFrequency(request.frequency());

        if (nameChanged) {
            OpenFdaService.DrugInfo drugInfo = openFdaService.lookup(request.name());
            medication.setPurpose(drugInfo.purpose());
            medication.setWarnings(drugInfo.warnings());
            medication.setSideEffects(drugInfo.sideEffects());
        }

        Medication saved = medicationRepository.save(medication);

        if (nameChanged) {
            embedFacts(saved);
        }

        if (nameChanged) {
            logChange(user, saved.getName(), MedicationChange.ChangeType.SWITCHED,
                    "Medication switched to " + saved.getName());
        } else if (dosageChanged) {
            logChange(user, saved.getName(), MedicationChange.ChangeType.DOSAGE_CHANGED,
                    "Dosage changed to " + saved.getDosage());
        }

        return MedicationResponse.from(saved);
    }

    public List<MedicationChangeResponse> getChangeHistory(User user) {
        return medicationChangeRepository.findByUserOrderByChangedAtDesc(user)
                .stream()
                .map(MedicationChangeResponse::from)
                .toList();
    }

    private void logChange(User user, String medicationName, MedicationChange.ChangeType type, String details) {
        MedicationChange change = MedicationChange.builder()
                .user(user)
                .medicationName(medicationName)
                .changeType(type)
                .details(details)
                .build();
        medicationChangeRepository.save(change);
    }
    // Best-effort embedding for RAG. The medication and its facts are the
    // primary data; the embedding is an enhancement, so a Gemini failure here
    // must never fail the add/update. We only embed when OpenFDA actually
    // returned fact text — an empty-fact medication has nothing to index.
    private void embedFacts(Medication med) {
        String content = buildFactText(med);
        if (content.isBlank()) return;  // no facts -> nothing to embed
        try {
            drugEmbeddingService.embedAndStore(med.getId(), content);
        } catch (Exception e) {
            System.err.println("Drug embedding failed for medication "
                    + med.getId() + " (" + med.getName() + "): " + e.getMessage());
        }
    }

    // Combine the OpenFDA fact fields into one document for embedding.
    private String buildFactText(Medication med) {
        StringBuilder sb = new StringBuilder();
        if (med.getPurpose() != null && !med.getPurpose().isBlank()) {
            sb.append("Purpose: ").append(med.getPurpose()).append("\n");
        }
        if (med.getWarnings() != null && !med.getWarnings().isBlank()) {
            sb.append("Warnings: ").append(med.getWarnings()).append("\n");
        }
        if (med.getSideEffects() != null && !med.getSideEffects().isBlank()) {
            sb.append("Side effects: ").append(med.getSideEffects()).append("\n");
        }
        return sb.toString().trim();
    }
}