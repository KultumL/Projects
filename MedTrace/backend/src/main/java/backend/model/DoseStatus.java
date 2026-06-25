package backend.model;

public enum DoseStatus {
    TAKEN,      // a matching DoseLog exists for this schedule + date
    UPCOMING,   // no log, scheduled time hasn't arrived yet (today)
    OVERDUE,    // no log, time passed, but still today — can still be taken
    MISSED      // no log, and the day has ended (target date is in the past)
}