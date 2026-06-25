package backend.model;

import java.time.LocalDate;

public enum ReportPeriod {
    WEEKLY,
    MONTHLY,
    YEARLY;

    public LocalDate resolveStartDate() {
        return switch (this) {
            case WEEKLY  -> LocalDate.now().minusWeeks(1);
            case MONTHLY -> LocalDate.now().minusMonths(1);
            case YEARLY  -> LocalDate.now().minusYears(1);
        };
    }
}