package backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "care_links",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_patient_caregiver",
        columnNames = {"patient_id", "caregiver_id"}
    )
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CareLink {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // The patient whose data this link grants access to. Patient-initiated:
    // the patient is always the one who creates the invite.
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private User patient;

    // The caregiver being granted access.
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "caregiver_id", nullable = false)
    private User caregiver;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CareLinkPermission permission;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CareLinkStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}