package backend.repository;

import backend.model.DailyCheckIn;
import backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DailyCheckInRepository extends JpaRepository<DailyCheckIn, Long> {

    List<DailyCheckIn> findByUserOrderByCheckInDateDesc(User user);

    Optional<DailyCheckIn> findByUserAndCheckInDate(User user, LocalDate checkInDate);
}