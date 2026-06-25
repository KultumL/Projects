package backend.repository;

import backend.model.MedicationChange;
import backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MedicationChangeRepository extends JpaRepository<MedicationChange, Long> {

    List<MedicationChange> findByUserOrderByChangedAtDesc(User user);
}