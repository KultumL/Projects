package backend.service;

import backend.dto.ScheduleRequest;
import backend.dto.ScheduleResponse;
import backend.exception.BadRequestException;
import backend.model.Medication;
import backend.model.MedicationSchedule;
import backend.model.User;
import backend.repository.MedicationRepository;
import backend.repository.MedicationScheduleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class MedicationScheduleService {

    private final MedicationScheduleRepository scheduleRepository;
    private final MedicationRepository medicationRepository;

    public MedicationScheduleService(MedicationScheduleRepository scheduleRepository,
                                     MedicationRepository medicationRepository) {
        this.scheduleRepository = scheduleRepository;
        this.medicationRepository = medicationRepository;
    }

    @Transactional
    public ScheduleResponse create(User user, ScheduleRequest request) {

        Medication medication = loadOwnedMedication(request.medicationId(), user);

        MedicationSchedule schedule = MedicationSchedule.builder()
                .medication(medication)
                .timeOfDay(request.timeOfDay())
                .active(true)
                .build();

        MedicationSchedule saved = scheduleRepository.save(schedule);

        // Mapped inside the @Transactional method: the session is open, so
        // saved.getMedication().getName() can lazy-load without blowing up.
        return ScheduleResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<ScheduleResponse> listForUser(User user) {

        return scheduleRepository
                .findByMedication_User_IdAndActiveTrue(user.getId())
                .stream()
                .map(ScheduleResponse::from)
                .toList();
    }

    @Transactional
    public ScheduleResponse setActive(Long scheduleId, boolean active, User user) {
        MedicationSchedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new BadRequestException("Schedule not found"));

        if (!schedule.getMedication().getUser().getId().equals(user.getId())) {
            throw new BadRequestException("Schedule not found");
        }

        schedule.setActive(active);

        return ScheduleResponse.from(schedule);
    }

    private Medication loadOwnedMedication(Long medicationId, User user) {
        Medication medication = medicationRepository.findById(medicationId)
                .orElseThrow(() -> new BadRequestException("Medication not found"));

        if (!medication.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("Medication not found");
        }
        return medication;
    }
}
