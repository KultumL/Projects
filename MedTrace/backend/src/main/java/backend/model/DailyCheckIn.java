package backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "daily_checkins",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "check_in_date"})
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyCheckIn {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "check_in_date", nullable = false)
    private LocalDate checkInDate;

    @Column(name = "mood")
    private Integer mood;

    @Column(name = "energy")
    private Integer energy;

    @Column(name = "pain_level")
    private Integer painLevel;

    @Column(name = "sleep_hours")
    private Double sleepHours;

    @Column(name = "medications_taken")
    private Boolean medicationsTaken;

    @Column(name = "journal_entry", columnDefinition = "TEXT")
    private String journalEntry;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Who actually entered this check-in. Null = the patient entered it
    // themselves (all existing rows). Set = a caregiver entered it on the
    // patient's behalf. This is the audit trail: a caregiver's entry must
    // never look identical to the patient's own.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entered_by_id")
    private User enteredBy;
}