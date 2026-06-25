package backend.repository;

import backend.model.DoseLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface DoseLogRepository extends JpaRepository<DoseLog, Long> {

    Optional<DoseLog> findBySchedule_IdAndDoseDate(Long scheduleId, LocalDate doseDate);
    List<DoseLog> findByMedication_User_IdAndDoseDate(Long userId, LocalDate doseDate);
    List<DoseLog> findByMedication_User_IdOrderByTakenAtDesc(Long userId);
}