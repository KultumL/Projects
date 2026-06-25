package backend.repository;

import backend.model.MedicationSchedule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MedicationScheduleRepository
        extends JpaRepository<MedicationSchedule, Long> {

    // Traverses schedule -> medication -> user. Spring Data parses the
    // method name: "Medication_User_Id" walks the relationship path
    // (the underscores make the boundaries explicit so it doesn't guess).
    // This is how you scope by owner when the entity has no direct User ref.
    List<MedicationSchedule> findByMedication_User_IdAndActiveTrue(Long userId);

    // All active schedules for one specific medication — used when you
    // edit/delete a med's schedule and need its current rows.
    List<MedicationSchedule> findByMedication_IdAndActiveTrue(Long medicationId);
}