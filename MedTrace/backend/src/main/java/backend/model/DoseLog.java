package backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "dose_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DoseLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medication_id", nullable = false)
    private Medication medication;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "schedule_id", nullable = true)
    private MedicationSchedule schedule;

    @Column(nullable = false)
    private LocalDateTime takenAt;

    @Column(nullable = false)
    private LocalDate doseDate;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    // Who actually logged this dose. Null = the patient logged it themselves.
    // Set = a caregiver logged it on the patient's behalf. Same audit trail
    // as DailyCheckIn.enteredBy.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entered_by_id")
    private User enteredBy;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
