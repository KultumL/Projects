package backend.repository;

import backend.model.CareLink;
import backend.model.CareLinkStatus;
import backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CareLinkRepository extends JpaRepository<CareLink, Long> {

    // All links where this user is the patient (their outgoing grants).
    List<CareLink> findByPatient(User patient);

    // All links where this user is the caregiver (invites/access they hold).
    List<CareLink> findByCaregiver(User caregiver);

    // The specific link between a caregiver and patient at a given status —
    // this is the lookup the authorization gate will use in step 5.
    Optional<CareLink> findByCaregiverAndPatientAndStatus(
            User caregiver, User patient, CareLinkStatus status);

    // Guards against duplicate invites at the service layer before the
    // DB constraint has to fire.
    Optional<CareLink> findByPatientAndCaregiver(User patient, User caregiver);
}