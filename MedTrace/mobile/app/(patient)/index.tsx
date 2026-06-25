import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import {
  DoseStatusEntry,
  getTodayDoseStatus,
  markDoseTaken,
} from '@/api/doses';
import ThemedText from '@/components/ThemedText';
import ThemedButton from '@/components/ThemedButton';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/theme';
import { useTour, TourStep } from '@/context/TourContext';
import { getTutorialSeen } from '@/api/storage';

// Amber that reads comfortably on the warm tan background without clashing with red.
const COLOR_OVERDUE = '#9a6a00';
// Calmer, more desaturated red than Colors.textError.
const COLOR_MISSED  = '#9e4444';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning,';
  if (h < 17) return 'Good afternoon,';
  return 'Good evening,';
}

function getDateLabel(): string {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

// Backend returns "HH:MM:SS" — convert to "H:MM AM/PM" for display.
function formatTime(t: string): string {
  const [hStr, mStr = '00'] = t.split(':');
  const h = parseInt(hStr, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${mStr} ${ampm}`;
}

// ─── Medication row ───────────────────────────────────────────────────────────

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function MedCard({
  dose,
  marking,
  rowError,
  onMark,
  markRef,
}: {
  dose: DoseStatusEntry;
  marking: boolean;
  rowError: string | null;
  onMark: () => void;
  markRef?: React.RefObject<View | null>;
}) {
  const isTaken   = dose.status === 'TAKEN';
  const isOverdue = dose.status === 'OVERDUE';
  const isMissed  = dose.status === 'MISSED';
  const isActionable = dose.status === 'UPCOMING' || dose.status === 'OVERDUE';

  const statusIcon: IoniconName = isTaken
    ? 'checkmark-circle'
    : isOverdue
    ? 'alert-circle-outline'
    : isMissed
    ? 'close-circle-outline'
    : 'time-outline';

  const statusColor = isTaken
    ? Colors.accentBorder
    : isOverdue
    ? COLOR_OVERDUE
    : isMissed
    ? COLOR_MISSED
    : Colors.textSecondary;

  const metaSuffix = isTaken
    ? 'Taken'
    : isOverdue
    ? `Overdue · ${formatTime(dose.scheduledTime)}`
    : isMissed
    ? 'Missed'
    : `Due ${formatTime(dose.scheduledTime)}`;

  const isMuted = isTaken || isMissed;

  return (
    <View style={[styles.medCard, isMuted && styles.medCardMuted]}>
      <View style={styles.medRow}>
        <Ionicons
          name={statusIcon}
          size={22}
          color={statusColor}
          style={styles.medIcon}
        />

        <View style={styles.medInfo}>
          <ThemedText style={styles.medName}>
            {dose.medicationName}
          </ThemedText>
          <ThemedText
            style={[
              styles.medMeta,
              isOverdue && styles.medMetaOverdue,
              isMissed  && styles.medMetaMissed,
            ]}
          >
            {dose.dosage ? `${dose.dosage} · ` : ''}
            {metaSuffix}
          </ThemedText>
        </View>

        {/* Check button: UPCOMING and OVERDUE only */}
        {isActionable && (
          <View style={styles.medActions}>
            {/* Show time on right only for UPCOMING; OVERDUE already has it in the meta */}
            {dose.status === 'UPCOMING' && (
              <ThemedText style={styles.medTime}>
                {formatTime(dose.scheduledTime)}
              </ThemedText>
            )}
            <Pressable
              ref={markRef}
              onPress={onMark}
              disabled={marking}
              style={styles.markBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel={`Mark ${dose.medicationName} as taken`}
            >
              {marking ? (
                <ActivityIndicator size="small" color={Colors.accentBorder} />
              ) : (
                <Ionicons
                  name="checkmark-circle-outline"
                  size={28}
                  color={Colors.accentBorder}
                />
              )}
            </Pressable>
          </View>
        )}
      </View>

      {rowError && (
        <ThemedText style={styles.rowError}>{rowError}</ThemedText>
      )}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PatientHomeScreen() {
  const { user, token } = useAuth();
  const insets = useSafeAreaInsets();
  const { startTour } = useTour();

  // Tour refs
  const medsCardRef    = useRef<View>(null);
  const markBtnRef     = useRef<View>(null);
  const checkinCardRef = useRef<View>(null);

  if (!user) return null;

  const greeting  = useMemo(getGreeting, []);
  const dateLabel = useMemo(getDateLabel, []);

  const [doses, setDoses]               = useState<DoseStatusEntry[]>([]);
  const [dosesLoading, setDosesLoading] = useState(true);
  const [dosesError, setDosesError]     = useState<string | null>(null);
  const [markingId, setMarkingId]       = useState<string | null>(null);
  const [rowErrors, setRowErrors]       = useState<Record<string, string>>({});
  const rowErrorTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  function showRowError(key: string, msg: string) {
    setRowErrors(prev => ({ ...prev, [key]: msg }));
    if (rowErrorTimers.current[key]) clearTimeout(rowErrorTimers.current[key]);
    rowErrorTimers.current[key] = setTimeout(() => {
      setRowErrors(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }, 3500);
  }

  useEffect(() => {
    const timers = rowErrorTimers.current;
    return () => { Object.values(timers).forEach(clearTimeout); };
  }, []);

  const fetchDoseStatus = useCallback(async () => {
    setDosesLoading(true);
    setDosesError(null);
    try {
      const list = await getTodayDoseStatus(token!);
      setDoses(list);
    } catch (err) {
      setDosesError(err instanceof Error ? err.message : 'Failed to load today\'s doses.');
    } finally {
      setDosesLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchDoseStatus(); }, [fetchDoseStatus]);

  // Show tour on first visit — check after doses have loaded so refs are attached.
  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      void (async () => {
        const seen = await getTutorialSeen(String(user.id));
        if (seen) return;
        // Small delay so the layout settles before measuring refs.
        setTimeout(() => {
          const steps: TourStep[] = [
            {
              id: 'meds-card',
              title: 'Today\'s medications',
              description: 'Here you\'ll see every dose scheduled for today — marked as upcoming, taken, overdue, or missed.',
              ref: medsCardRef,
            },
            {
              id: 'mark-btn',
              title: 'Mark as taken',
              description: 'Tap the circle check to log a dose right away. You can still mark an overdue dose if you took it late.',
              ref: markBtnRef,
            },
            {
              id: 'checkin-card',
              title: 'Daily check-in',
              description: 'Log how you\'re feeling — mood, energy, pain, sleep — and keep a brief journal entry. It all builds your health picture over time.',
              ref: checkinCardRef,
            },
            {
              id: 'tabs',
              title: 'Your tabs',
              description: 'Use the bottom tabs to switch between Home, Medications, Check-in, and Profile. We\'ll always return you to Home.',
            },
          ];
          startTour(steps);
        }, 350);
      })();
    }, [user, startTour]),
  );

  async function handleMarkTaken(dose: DoseStatusEntry) {
    const key = String(dose.scheduleId);
    setMarkingId(key);

    setDoses(prev =>
      prev.map(d =>
        String(d.scheduleId) === key ? { ...d, status: 'TAKEN' as const } : d,
      ),
    );

    try {
      await markDoseTaken(token!, {
        medicationId: dose.medicationId,
        scheduleId:   dose.scheduleId,
      });
    } catch (err) {
      setDoses(prev =>
        prev.map(d =>
          String(d.scheduleId) === key ? { ...d, status: dose.status } : d,
        ),
      );
      showRowError(key, err instanceof Error ? err.message : 'Failed to log dose.');
    } finally {
      setMarkingId(null);
    }
  }

  // MISSED doses can't be taken today — exclude them from the "Y" count.
  const takenCount = doses.filter(d => d.status === 'TAKEN').length;
  const totalCount = doses.filter(d => d.status !== 'MISSED').length;

  // ── Medications section content ─────────────────────────────────────────────
  let medContent: React.ReactNode;

  if (dosesLoading) {
    medContent = (
      <View style={styles.medStateRow}>
        <ActivityIndicator color={Colors.textSecondary} size="small" />
        <ThemedText variant="bodySmall" secondary>
          Loading today's schedule…
        </ThemedText>
      </View>
    );
  } else if (dosesError) {
    medContent = (
      <Pressable style={styles.medStateRow} onPress={fetchDoseStatus}>
        <ThemedText variant="bodySmall" secondary style={styles.medStateMsg}>
          {dosesError}
        </ThemedText>
        <ThemedText style={styles.retryLink} accessibilityRole="button">
          Retry
        </ThemedText>
      </Pressable>
    );
  } else if (doses.length === 0) {
    medContent = (
      <View style={styles.medStateRow}>
        <ThemedText variant="bodySmall" secondary>
          No doses scheduled for today.
        </ThemedText>
      </View>
    );
  } else {
    const firstActionableIdx = doses.findIndex(
      d => d.status === 'UPCOMING' || d.status === 'OVERDUE',
    );
    medContent = doses.map((dose, i) => (
      <React.Fragment key={String(dose.scheduleId)}>
        {i > 0 && <View style={styles.divider} />}
        <MedCard
          dose={dose}
          marking={markingId === String(dose.scheduleId)}
          rowError={rowErrors[String(dose.scheduleId)] ?? null}
          onMark={() => handleMarkTaken(dose)}
          markRef={i === firstActionableIdx ? markBtnRef : undefined}
        />
      </React.Fragment>
    ));
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Spacing.lg },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Greeting */}
      <View style={styles.greetingSection}>
        <ThemedText variant="body" secondary style={styles.dateLabel}>
          {dateLabel}
        </ThemedText>
        <ThemedText variant="heading2" style={styles.greeting}>
          {greeting}
        </ThemedText>
        <ThemedText variant="heading2" style={styles.userName}>
          {user.name}
        </ThemedText>
      </View>

      {/* Today's medications */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText variant="subheading">Today's medications</ThemedText>
          {!dosesLoading && totalCount > 0 && (
            <ThemedText variant="caption">
              {takenCount} of {totalCount} taken
            </ThemedText>
          )}
        </View>
        <View ref={medsCardRef} style={styles.card}>{medContent}</View>
      </View>

      {/* Check-in prompt */}
      <View style={styles.section}>
        <View ref={checkinCardRef} style={styles.checkinCard}>
          <View style={styles.checkinHeader}>
            <Ionicons name="heart-outline" size={20} color={Colors.accentBorder} />
            <ThemedText variant="subheading" style={styles.checkinTitle}>
              How are you feeling today?
            </ThemedText>
          </View>
          <ThemedText variant="bodySmall" secondary style={styles.checkinBody}>
            Take a moment to note your symptoms, energy levels, and how your
            day is going. Your entries help build a clearer health picture over
            time.
          </ThemedText>
          <ThemedButton
            label="Log check-in"
            variant="primary"
            fullWidth
            onPress={() => router.navigate('/(patient)/checkin')}
          />
        </View>
      </View>

      <View style={{ height: Spacing.xl }} />
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.backgroundWarm },
  content: { paddingHorizontal: Spacing.xl, gap: Spacing.xl },

  greetingSection: { gap: 2 },
  dateLabel: {
    marginBottom: Spacing.xs,
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.sm,
    letterSpacing: 0.3,
  },
  greeting: { color: Colors.textSecondary, lineHeight: FontSize['2xl'] * 1.15 },
  userName: { lineHeight: FontSize['2xl'] * 1.15 },

  section: { gap: Spacing.sm },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },

  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },

  medStateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.lg,
  },
  medStateMsg: { flex: 1 },
  retryLink: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.sm,
    color: Colors.buttonPrimary,
  },

  medCard: {},
  medCardMuted: { opacity: 0.65 },

  medRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  medIcon: { width: 24, textAlign: 'center' },
  medInfo: { flex: 1, gap: 2 },
  medName: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
  medMeta: {
    fontFamily: FontFamily.sansRegular,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  medMetaOverdue: { color: COLOR_OVERDUE },
  medMetaMissed:  { color: COLOR_MISSED },

  medActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  medTime: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  markBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  rowError: {
    fontFamily: FontFamily.sansRegular,
    fontSize: FontSize.xs,
    color: Colors.textError,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    lineHeight: FontSize.xs * 1.4,
  },

  checkinCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  checkinHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  checkinTitle: { flex: 1 },
  checkinBody: { lineHeight: FontSize.sm * 1.65 },
});
