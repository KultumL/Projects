import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useCare } from '@/context/CareContext';
import {
  getPatientMedications,
  getPatientDoseStatus,
} from '@/api/caregiver';
import { getPatientCheckIns } from '@/api/checkins';
import { Medication } from '@/api/medications';
import { DoseStatusEntry } from '@/api/doses';
import { CheckIn } from '@/api/checkins';
import ThemedText from '@/components/ThemedText';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/theme';

// ─── Colour constants (same as patient home) ──────────────────────────────────

const COLOR_OVERDUE = '#9a6a00';
const COLOR_MISSED  = '#9e4444';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function formatTime(t: string): string {
  const [hStr, mStr = '00'] = t.split(':');
  const h = parseInt(hStr, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12  = h % 12 || 12;
  return `${h12}:${mStr} ${ampm}`;
}

// ─── No-link empty state ──────────────────────────────────────────────────────

function NoLink() {
  return (
    <View style={styles.noLink}>
      <Ionicons name="people-outline" size={36} color={Colors.border} />
      <ThemedText variant="subheading" style={styles.noLinkTitle}>
        You aren't connected to anyone yet
      </ThemedText>
      <ThemedText variant="bodySmall" secondary style={styles.noLinkBody}>
        A patient needs to invite you before you can view their health data.
      </ThemedText>
    </View>
  );
}

// ─── Dose row (read-only — no action buttons) ─────────────────────────────────

function DoseRow({ dose }: { dose: DoseStatusEntry }) {
  const isTaken   = dose.status === 'TAKEN';
  const isOverdue = dose.status === 'OVERDUE';
  const isMissed  = dose.status === 'MISSED';
  const isMuted   = isTaken || isMissed;

  const icon: IoniconName = isTaken
    ? 'checkmark-circle'
    : isOverdue
    ? 'alert-circle-outline'
    : isMissed
    ? 'close-circle-outline'
    : 'time-outline';

  const iconColor = isTaken
    ? Colors.accentBorder
    : isOverdue
    ? COLOR_OVERDUE
    : isMissed
    ? COLOR_MISSED
    : Colors.textSecondary;

  const meta = isTaken
    ? 'Taken'
    : isOverdue
    ? `Overdue · ${formatTime(dose.scheduledTime)}`
    : isMissed
    ? 'Missed'
    : `Due ${formatTime(dose.scheduledTime)}`;

  return (
    <View style={[styles.doseRow, isMuted && styles.rowMuted]}>
      <Ionicons name={icon} size={20} color={iconColor} />
      <View style={styles.doseInfo}>
        <ThemedText style={styles.doseName}>{dose.medicationName}</ThemedText>
        <ThemedText
          style={[
            styles.doseMeta,
            isOverdue && { color: COLOR_OVERDUE },
            isMissed  && { color: COLOR_MISSED },
          ]}
        >
          {dose.dosage ? `${dose.dosage} · ` : ''}
          {meta}
        </ThemedText>
      </View>
    </View>
  );
}

// ─── Check-in row ─────────────────────────────────────────────────────────────

function CheckInRow({ ci }: { ci: CheckIn }) {
  const dateStr = new Date(ci.checkInDate).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
  const byLine = ci.enteredByName
    ? `Logged by ${ci.enteredByName}`
    : 'Self-reported';

  return (
    <View style={styles.ciRow}>
      <View style={styles.ciLeft}>
        <ThemedText style={styles.ciDate}>{dateStr}</ThemedText>
        <ThemedText style={styles.ciBy}>{byLine}</ThemedText>
      </View>
      <View style={styles.ciStats}>
        {ci.mood != null && (
          <View style={styles.ciStat}>
            <Ionicons name="happy-outline" size={14} color={Colors.textSecondary} />
            <ThemedText style={styles.ciStatVal}>{ci.mood}</ThemedText>
          </View>
        )}
        {ci.painLevel != null && (
          <View style={styles.ciStat}>
            <Ionicons name="bandage-outline" size={14} color={Colors.textSecondary} />
            <ThemedText style={styles.ciStatVal}>{ci.painLevel}</ThemedText>
          </View>
        )}
        {ci.medicationsTaken != null && (
          <Ionicons
            name={ci.medicationsTaken ? 'checkmark-circle' : 'close-circle-outline'}
            size={16}
            color={ci.medicationsTaken ? Colors.accentBorder : COLOR_MISSED}
          />
        )}
      </View>
    </View>
  );
}

// ─── Section shell ────────────────────────────────────────────────────────────

function SectionCard({
  title,
  loading,
  error,
  empty,
  children,
}: {
  title: string;
  loading: boolean;
  error: string | null;
  empty: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <ThemedText variant="subheading">{title}</ThemedText>
      <View style={styles.card}>
        {loading ? (
          <View style={styles.cardState}>
            <ActivityIndicator color={Colors.textSecondary} size="small" />
          </View>
        ) : error ? (
          <View style={styles.cardState}>
            <ThemedText variant="bodySmall" secondary style={{ textAlign: 'center' }}>
              {error}
            </ThemedText>
          </View>
        ) : React.Children.count(children) === 0 ? (
          <View style={styles.cardState}>
            <ThemedText variant="bodySmall" secondary>{empty}</ThemedText>
          </View>
        ) : (
          children
        )}
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CaregiverPatientScreen() {
  const { token } = useAuth();
  const { patient, loading: careLoading } = useCare();
  const insets = useSafeAreaInsets();

  const [medications, setMedications] = useState<Medication[]>([]);
  const [medsLoading, setMedsLoading]   = useState(false);
  const [medsError, setMedsError]       = useState<string | null>(null);

  const [doses, setDoses]             = useState<DoseStatusEntry[]>([]);
  const [dosesLoading, setDosesLoading] = useState(false);
  const [dosesError, setDosesError]     = useState<string | null>(null);

  const [checkIns, setCheckIns]       = useState<CheckIn[]>([]);
  const [ciLoading, setCiLoading]     = useState(false);
  const [ciError, setCiError]         = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!patient || !token) return;
    const pid = patient.patientId;

    setMedsLoading(true); setDosesLoading(true); setCiLoading(true);

    const [medsResult, dosesResult, ciResult] = await Promise.allSettled([
      getPatientMedications(token, pid),
      getPatientDoseStatus(token, pid),
      getPatientCheckIns(token, pid),
    ]);

    if (medsResult.status === 'fulfilled') {
      setMedications(medsResult.value);
      setMedsError(null);
    } else {
      setMedsError(medsResult.reason instanceof Error ? medsResult.reason.message : 'Failed to load.');
    }
    setMedsLoading(false);

    if (dosesResult.status === 'fulfilled') {
      setDoses(dosesResult.value);
      setDosesError(null);
    } else {
      setDosesError(dosesResult.reason instanceof Error ? dosesResult.reason.message : 'Failed to load.');
    }
    setDosesLoading(false);

    if (ciResult.status === 'fulfilled') {
      setCheckIns(ciResult.value.slice(0, 5));
      setCiError(null);
    } else {
      setCiError(ciResult.reason instanceof Error ? ciResult.reason.message : 'Failed to load.');
    }
    setCiLoading(false);
  }, [patient, token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (careLoading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator color={Colors.buttonPrimary} size="large" />
      </View>
    );
  }

  if (!patient) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <NoLink />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.lg }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.pageHeader}>
        <ThemedText variant="heading3">{patient.patientName}</ThemedText>
        <ThemedText variant="bodySmall" secondary>Health overview · today</ThemedText>
      </View>

      {/* Medications */}
      <SectionCard
        title="Medications"
        loading={medsLoading}
        error={medsError}
        empty="No medications on record."
      >
        {medications.map((med, i) => (
          <React.Fragment key={String(med.id)}>
            {i > 0 && <View style={styles.divider} />}
            <View style={styles.medRow}>
              <ThemedText style={styles.medName}>{med.name}</ThemedText>
              <ThemedText style={styles.medMeta}>
                {med.dosage} · {med.frequency}
              </ThemedText>
            </View>
          </React.Fragment>
        ))}
      </SectionCard>

      {/* Today's doses */}
      <SectionCard
        title="Today's doses"
        loading={dosesLoading}
        error={dosesError}
        empty="No doses scheduled today."
      >
        {doses.map((dose, i) => (
          <React.Fragment key={String(dose.scheduleId)}>
            {i > 0 && <View style={styles.divider} />}
            <DoseRow dose={dose} />
          </React.Fragment>
        ))}
      </SectionCard>

      {/* Recent check-ins */}
      <SectionCard
        title="Recent check-ins"
        loading={ciLoading}
        error={ciError}
        empty="No check-ins on record."
      >
        {checkIns.map((ci, i) => (
          <React.Fragment key={String(ci.id)}>
            {i > 0 && <View style={styles.divider} />}
            <CheckInRow ci={ci} />
          </React.Fragment>
        ))}
      </SectionCard>

      <View style={{ height: Spacing.xl }} />
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.backgroundWarm },
  content: { paddingHorizontal: Spacing.xl, gap: Spacing.xl },

  centered: {
    flex: 1,
    backgroundColor: Colors.backgroundWarm,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  noLink: { alignItems: 'center', gap: Spacing.md },
  noLinkTitle: { textAlign: 'center' },
  noLinkBody:  { textAlign: 'center', lineHeight: FontSize.sm * 1.6 },

  pageHeader: { gap: 4 },

  section: { gap: Spacing.sm },

  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  cardState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },

  // Medication rows
  medRow: {
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    gap: 2,
  },
  medName: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    textTransform: 'capitalize',
  },
  medMeta: {
    fontFamily: FontFamily.sansRegular,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },

  // Dose rows
  doseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
  },
  rowMuted: { opacity: 0.65 },
  doseInfo: { flex: 1, gap: 2 },
  doseName: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    textTransform: 'capitalize',
  },
  doseMeta: {
    fontFamily: FontFamily.sansRegular,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },

  // Check-in rows
  ciRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  ciLeft: { flex: 1, gap: 2 },
  ciDate: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },
  ciBy: {
    fontFamily: FontFamily.sansRegular,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  ciStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  ciStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ciStatVal: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
});
