import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useCare } from '@/context/CareContext';
import {
  getPatientDoseStatus,
  markDoseForPatient,
  createCheckInForPatient,
} from '@/api/caregiver';
import { DoseStatusEntry } from '@/api/doses';
import { CheckInPayload } from '@/api/checkins';
import ThemedText from '@/components/ThemedText';
import ThemedButton from '@/components/ThemedButton';
import ThemedInput from '@/components/ThemedInput';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/theme';

const COLOR_OVERDUE = '#9a6a00';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function formatTime(t: string): string {
  const [hStr, mStr = '00'] = t.split(':');
  const h = parseInt(hStr, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12  = h % 12 || 12;
  return `${h12}:${mStr} ${ampm}`;
}

// ─── No-link / no-permission states ──────────────────────────────────────────

function NoLink() {
  return (
    <View style={styles.gateState}>
      <Ionicons name="people-outline" size={36} color={Colors.border} />
      <ThemedText variant="subheading" style={styles.gateTitle}>
        You aren't connected to anyone yet
      </ThemedText>
      <ThemedText variant="bodySmall" secondary style={styles.gateBody}>
        A patient needs to invite you before you can log on their behalf.
      </ThemedText>
    </View>
  );
}

function ViewOnlyGate({ patientName }: { patientName: string }) {
  return (
    <View style={styles.gateState}>
      <Ionicons name="eye-outline" size={36} color={Colors.border} />
      <ThemedText variant="subheading" style={styles.gateTitle}>
        View-only access
      </ThemedText>
      <ThemedText variant="bodySmall" secondary style={styles.gateBody}>
        You can view {patientName}'s health data, but your access level doesn't
        include logging on their behalf. If this needs to change, the patient
        can update your permissions.
      </ThemedText>
    </View>
  );
}

// ─── Dose mark row ────────────────────────────────────────────────────────────

function DoseMarkRow({
  dose,
  marking,
  done,
  error,
  onMark,
}: {
  dose: DoseStatusEntry;
  marking: boolean;
  done: boolean;
  error: string | null;
  onMark: () => void;
}) {
  const isOverdue = dose.status === 'OVERDUE';
  const icon: IoniconName = isOverdue ? 'alert-circle-outline' : 'time-outline';
  const iconColor = isOverdue ? COLOR_OVERDUE : Colors.textSecondary;
  const timeLabel = `${isOverdue ? 'Overdue · ' : 'Due '}${formatTime(dose.scheduledTime)}`;

  return (
    <View style={styles.doseMarkRow}>
      <View style={styles.doseMarkBody}>
        <View style={styles.doseMarkTop}>
          <Ionicons name={done ? 'checkmark-circle' : icon} size={20}
            color={done ? Colors.accentBorder : iconColor} />
          <View style={styles.doseMarkInfo}>
            <ThemedText style={[styles.doseMarkName, done && styles.textMuted]}>
              {dose.medicationName}
            </ThemedText>
            <ThemedText style={[styles.doseMarkTime, isOverdue && !done && { color: COLOR_OVERDUE }]}>
              {done ? 'Marked as taken' : timeLabel}
            </ThemedText>
          </View>
          {!done && (
            <Pressable
              onPress={onMark}
              disabled={marking}
              style={styles.doseMarkBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel={`Mark ${dose.medicationName} as taken`}
            >
              {marking ? (
                <ActivityIndicator size="small" color={Colors.accentBorder} />
              ) : (
                <Ionicons name="checkmark-circle-outline" size={28} color={Colors.accentBorder} />
              )}
            </Pressable>
          )}
        </View>
        {error && <ThemedText style={styles.rowError}>{error}</ThemedText>}
      </View>
    </View>
  );
}

// ─── Simple check-in form ─────────────────────────────────────────────────────

function CheckInForm({
  patientName,
  token,
  patientId,
}: {
  patientName: string;
  token: string;
  patientId: string | number;
}) {
  const [mood,   setMood]   = useState('');
  const [pain,   setPain]   = useState('');
  const [notes,  setNotes]  = useState('');
  const [saving, setSaving] = useState(false);
  const [done,   setDone]   = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    const payload: CheckInPayload = {};
    if (mood.trim())  payload.mood = parseInt(mood, 10);
    if (pain.trim())  payload.pain = parseInt(pain, 10);
    if (notes.trim()) payload.notes = notes.trim();

    try {
      await createCheckInForPatient(token, patientId, payload);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save check-in.');
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <View style={styles.ciDone}>
        <Ionicons name="checkmark-circle" size={22} color={Colors.accentBorder} />
        <ThemedText style={styles.ciDoneText}>
          Check-in recorded for {patientName}.
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.ciForm}>
      <ThemedText variant="bodySmall" secondary style={styles.ciFormHint}>
        All fields are optional. Leave blank what you don't know.
      </ThemedText>
      <View style={styles.ciFormRow}>
        <View style={styles.ciFormHalf}>
          <ThemedInput
            label="Mood (1–10)"
            placeholder="e.g. 7"
            value={mood}
            onChangeText={setMood}
            keyboardType="number-pad"
          />
        </View>
        <View style={styles.ciFormHalf}>
          <ThemedInput
            label="Pain (1–10)"
            placeholder="e.g. 3"
            value={pain}
            onChangeText={setPain}
            keyboardType="number-pad"
          />
        </View>
      </View>
      <ThemedInput
        label="Notes"
        placeholder="Anything noteworthy to record…"
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
        style={styles.ciNotesInput}
        returnKeyType="default"
      />
      {error && (
        <View style={styles.errorBox}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        </View>
      )}
      <ThemedButton
        label="Save check-in"
        variant="primary"
        fullWidth
        loading={saving}
        onPress={handleSave}
      />
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CaregiverLogScreen() {
  const { token } = useAuth();
  const { patient, loading: careLoading } = useCare();
  const insets = useSafeAreaInsets();

  const [doses, setDoses]           = useState<DoseStatusEntry[]>([]);
  const [dosesLoading, setDosesLoading] = useState(false);
  const [dosesError, setDosesError]   = useState<string | null>(null);

  // Per-dose mark state: scheduleId → 'idle' | 'marking' | 'done' | 'error'
  const [markStates, setMarkStates] = useState<Record<string, 'idle' | 'marking' | 'done'>>({});
  const [rowErrors, setRowErrors]   = useState<Record<string, string>>({});
  const errorTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const fetchDoses = useCallback(async () => {
    if (!patient || !token) return;
    setDosesLoading(true);
    try {
      const all = await getPatientDoseStatus(token, patient.patientId);
      setDoses(all.filter(d => d.status === 'UPCOMING' || d.status === 'OVERDUE'));
      setDosesError(null);
    } catch (err) {
      setDosesError(err instanceof Error ? err.message : 'Failed to load doses.');
    } finally {
      setDosesLoading(false);
    }
  }, [patient, token]);

  useEffect(() => {
    fetchDoses();
    const timers = errorTimers.current;
    return () => { Object.values(timers).forEach(clearTimeout); };
  }, [fetchDoses]);

  async function handleMarkDose(dose: DoseStatusEntry) {
    const key = String(dose.scheduleId);
    setMarkStates(prev => ({ ...prev, [key]: 'marking' }));

    try {
      await markDoseForPatient(token!, patient!.patientId, {
        medicationId: dose.medicationId,
        scheduleId:   dose.scheduleId,
      });
      setMarkStates(prev => ({ ...prev, [key]: 'done' }));
    } catch (err) {
      setMarkStates(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      const msg = err instanceof Error ? err.message : 'Failed to log dose.';
      setRowErrors(prev => ({ ...prev, [key]: msg }));
      if (errorTimers.current[key]) clearTimeout(errorTimers.current[key]);
      errorTimers.current[key] = setTimeout(() => {
        setRowErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
      }, 3500);
    }
  }

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

  if (patient.permission === 'VIEW_ONLY') {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ViewOnlyGate patientName={patient.patientName} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.lg }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.pageHeader}>
        <ThemedText variant="heading3">Log for {patient.patientName}</ThemedText>
        <ThemedText variant="bodySmall" secondary>
          Entries are recorded as logged by you.
        </ThemedText>
      </View>

      {/* ── Mark a dose ── */}
      <View style={styles.section}>
        <ThemedText variant="subheading">Mark a dose as taken</ThemedText>
        <View style={styles.card}>
          {dosesLoading ? (
            <View style={styles.cardState}>
              <ActivityIndicator color={Colors.textSecondary} size="small" />
            </View>
          ) : dosesError ? (
            <View style={styles.cardState}>
              <ThemedText variant="bodySmall" secondary>{dosesError}</ThemedText>
            </View>
          ) : doses.length === 0 ? (
            <View style={styles.cardState}>
              <ThemedText variant="bodySmall" secondary>
                No upcoming or overdue doses right now.
              </ThemedText>
            </View>
          ) : (
            doses.map((dose, i) => {
              const key = String(dose.scheduleId);
              return (
                <React.Fragment key={key}>
                  {i > 0 && <View style={styles.divider} />}
                  <DoseMarkRow
                    dose={dose}
                    marking={markStates[key] === 'marking'}
                    done={markStates[key] === 'done'}
                    error={rowErrors[key] ?? null}
                    onMark={() => handleMarkDose(dose)}
                  />
                </React.Fragment>
              );
            })
          )}
        </View>
      </View>

      {/* ── Record a check-in ── */}
      <View style={styles.section}>
        <ThemedText variant="subheading">Record a check-in</ThemedText>
        <View style={styles.card}>
          <CheckInForm
            patientName={patient.patientName}
            token={token!}
            patientId={patient.patientId}
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

  centered: {
    flex: 1,
    backgroundColor: Colors.backgroundWarm,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  gateState: { alignItems: 'center', gap: Spacing.md },
  gateTitle: { textAlign: 'center' },
  gateBody:  { textAlign: 'center', lineHeight: FontSize.sm * 1.6 },

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

  doseMarkRow: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2 },
  doseMarkBody: { gap: 4 },
  doseMarkTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  doseMarkInfo: { flex: 1, gap: 2 },
  doseMarkName: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    textTransform: 'capitalize',
  },
  doseMarkTime: {
    fontFamily: FontFamily.sansRegular,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  doseMarkBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textMuted: { color: Colors.textSecondary },
  rowError: {
    fontFamily: FontFamily.sansRegular,
    fontSize: FontSize.xs,
    color: Colors.textError,
    paddingLeft: 28,
  },

  ciDone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.lg,
  },
  ciDoneText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
  ciForm: { padding: Spacing.md, gap: Spacing.md },
  ciFormHint: { lineHeight: FontSize.sm * 1.5 },
  ciFormRow: { flexDirection: 'row', gap: Spacing.sm },
  ciFormHalf: { flex: 1 },
  ciNotesInput: { height: 90, textAlignVertical: 'top', paddingTop: Spacing.sm },
  errorBox: {
    backgroundColor: '#fdf0ee',
    borderWidth: 1.5,
    borderColor: Colors.borderError,
    borderRadius: Radius.md,
    padding: Spacing.sm,
  },
  errorText: {
    fontFamily: FontFamily.sansRegular,
    fontSize: FontSize.sm,
    color: Colors.textError,
  },
});
