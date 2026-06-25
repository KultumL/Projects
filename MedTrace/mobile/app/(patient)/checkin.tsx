import React, { useEffect, useState } from 'react';
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
import {
  CheckIn,
  CheckInPayload,
  createCheckIn,
  getTodayCheckIn,
} from '@/api/checkins';
import { getMedications, logDose, Medication } from '@/api/medications';
import ThemedText from '@/components/ThemedText';
import ThemedButton from '@/components/ThemedButton';
import ThemedInput from '@/components/ThemedInput';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/theme';

// ─── Scale selector ───────────────────────────────────────────────────────────

function ScaleSelector({
  value,
  onChange,
  lowLabel,
  highLabel,
}: {
  value: number | null;
  onChange: (n: number) => void;
  lowLabel: string;
  highLabel: string;
}) {
  return (
    <View style={scale.wrapper}>
      <View style={scale.row}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map(n => {
          const sel = value === n;
          return (
            <Pressable
              key={n}
              style={[scale.chip, sel && scale.chipSel]}
              onPress={() => onChange(n)}
              accessibilityRole="radio"
              accessibilityState={{ checked: sel }}
              accessibilityLabel={String(n)}
            >
              <ThemedText style={[scale.label, sel && scale.labelSel]}>
                {n}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
      <View style={scale.hints}>
        <ThemedText style={scale.hint}>{lowLabel}</ThemedText>
        <ThemedText style={scale.hint}>{highLabel}</ThemedText>
      </View>
    </View>
  );
}

const scale = StyleSheet.create({
  wrapper: { gap: 4 },
  row: { flexDirection: 'row', gap: 4 },
  chip: {
    flex: 1,
    height: 40,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSel: { backgroundColor: Colors.accentFill, borderColor: Colors.accentBorder },
  label: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  labelSel: { color: Colors.textPrimary, fontFamily: FontFamily.sansSemiBold },
  hints: { flexDirection: 'row', justifyContent: 'space-between' },
  hint: {
    fontFamily: FontFamily.sansRegular,
    fontSize: FontSize.xs - 1,
    color: Colors.textSecondary,
  },
});

// ─── Yes / No selector ────────────────────────────────────────────────────────

function YesNoSelector({
  value,
  onChange,
}: {
  value: boolean | null;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={yesno.row}>
      {([true, false] as const).map(v => {
        const sel = value === v;
        return (
          <Pressable
            key={String(v)}
            style={[yesno.chip, sel && yesno.chipSel]}
            onPress={() => onChange(v)}
            accessibilityRole="radio"
            accessibilityState={{ checked: sel }}
          >
            <ThemedText style={[yesno.label, sel && yesno.labelSel]}>
              {v ? 'Yes' : 'No'}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const yesno = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.sm },
  chip: {
    flex: 1,
    minHeight: 48,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSel: { backgroundColor: Colors.accentFill, borderColor: Colors.accentBorder },
  label: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.base,
    color: Colors.textSecondary,
  },
  labelSel: { color: Colors.textPrimary, fontFamily: FontFamily.sansSemiBold },
});

// ─── PRN stepper row ──────────────────────────────────────────────────────────

function PrnRow({
  med,
  count,
  onChange,
}: {
  med: Medication;
  count: number;
  onChange: (n: number) => void;
}) {
  const active = count > 0;
  return (
    <View style={prn.row}>
      <View style={prn.info}>
        <ThemedText style={[prn.name, active && prn.nameActive]}>
          {med.name}
        </ThemedText>
        {med.dosage ? (
          <ThemedText style={prn.meta}>{med.dosage}</ThemedText>
        ) : null}
      </View>
      <View style={prn.stepper}>
        <Pressable
          onPress={() => onChange(Math.max(0, count - 1))}
          disabled={count <= 0}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel={`Decrease ${med.name} count`}
        >
          <Ionicons
            name="remove-circle-outline"
            size={28}
            color={count > 0 ? Colors.buttonPrimary : Colors.border}
          />
        </Pressable>
        <ThemedText style={[prn.count, active && prn.countActive]}>
          {count}
        </ThemedText>
        <Pressable
          onPress={() => onChange(Math.min(20, count + 1))}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel={`Increase ${med.name} count`}
        >
          <Ionicons name="add-circle-outline" size={28} color={Colors.buttonPrimary} />
        </Pressable>
      </View>
    </View>
  );
}

const prn = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  info: { flex: 1, gap: 2 },
  name: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.base,
    color: Colors.textSecondary,
  },
  nameActive: { color: Colors.textPrimary },
  meta: {
    fontFamily: FontFamily.sansRegular,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  count: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    minWidth: 24,
    textAlign: 'center',
  },
  countActive: { color: Colors.textPrimary },
});

// ─── Completed entry view ─────────────────────────────────────────────────────

function EntryRow({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
}) {
  return (
    <View style={entry.row}>
      <Ionicons name={icon} size={18} color={Colors.accentBorder} />
      <ThemedText style={entry.rowLabel}>{label}</ThemedText>
      <ThemedText style={entry.rowValue}>{value}</ThemedText>
    </View>
  );
}

function EntryCard({ checkIn }: { checkIn: CheckIn }) {
  const dateStr = new Date(checkIn.createdAt).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <View style={entry.card}>
      <View style={entry.cardHeader}>
        <ThemedText style={entry.cardDate}>{dateStr}</ThemedText>
        <ThemedText variant="subheading">Today's check-in</ThemedText>
      </View>
      <View style={entry.divider} />
      <View style={entry.rows}>
        {checkIn.mood != null && (
          <EntryRow icon="happy-outline" label="Mood" value={`${checkIn.mood} / 10`} />
        )}
        {checkIn.energy != null && (
          <EntryRow icon="flash-outline" label="Energy" value={`${checkIn.energy} / 10`} />
        )}
        {checkIn.painLevel != null && (
          <EntryRow icon="bandage-outline" label="Pain" value={`${checkIn.painLevel} / 10`} />
        )}
        {checkIn.sleepHours != null && (
          <EntryRow icon="moon-outline" label="Sleep" value={`${checkIn.sleepHours} hrs`} />
        )}
        {checkIn.medicationsTaken != null && (
          <EntryRow
            icon={checkIn.medicationsTaken ? 'checkmark-circle-outline' : 'close-circle-outline'}
            label="Medications"
            value={checkIn.medicationsTaken ? 'Taken' : 'Not taken'}
          />
        )}
      </View>
      {checkIn.journalEntry ? (
        <>
          <View style={entry.divider} />
          <ThemedText style={entry.notes}>{checkIn.journalEntry}</ThemedText>
        </>
      ) : null}
    </View>
  );
}

const entry = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  cardHeader: { padding: Spacing.lg, gap: 4 },
  cardDate: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    letterSpacing: 0.3,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },
  rows: { padding: Spacing.md, gap: Spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  rowLabel: {
    flex: 1,
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.base,
    color: Colors.textSecondary,
  },
  rowValue: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
  notes: {
    fontFamily: FontFamily.sansRegular,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    lineHeight: FontSize.base * 1.65,
    fontStyle: 'italic',
    padding: Spacing.lg,
  },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

type PageState = 'loading' | 'form' | 'entry' | 'error';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning,';
  if (h < 17) return 'Good afternoon,';
  return 'Good evening,';
}

export default function CheckInScreen() {
  const { token } = useAuth();
  const insets = useSafeAreaInsets();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [todayEntry, setTodayEntry] = useState<CheckIn | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Wellness form state
  const [mood, setMood]             = useState<number | null>(null);
  const [energy, setEnergy]         = useState<number | null>(null);
  const [pain, setPain]             = useState<number | null>(null);
  const [sleepHours, setSleepHours] = useState('');
  const [medsTaken, setMedsTaken]   = useState<boolean | null>(null);
  const [notes, setNotes]           = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // PRN state — id → how many times taken today (0 = not selected)
  const [medications, setMedications] = useState<Medication[]>([]);
  const [medsLoading, setMedsLoading] = useState(true);
  const [prnCounts, setPrnCounts]     = useState<Record<string, number>>({});

  useEffect(() => {
    loadToday();
    loadMedications();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadToday() {
    setPageState('loading');
    setLoadError(null);
    try {
      const existing = await getTodayCheckIn(token!);
      if (existing) {
        setTodayEntry(existing);
        setPageState('entry');
      } else {
        setPageState('form');
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load.');
      setPageState('error');
    }
  }

  async function loadMedications() {
    try {
      const list = await getMedications(token!);
      setMedications(list);
    } catch {
      // PRN section shows its own gentle empty state
    } finally {
      setMedsLoading(false);
    }
  }

  function setPrnCount(id: string, n: number) {
    setPrnCounts(prev => {
      const next = { ...prev };
      if (n <= 0) delete next[id];
      else next[id] = n;
      return next;
    });
  }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError(null);

    const payload: CheckInPayload = {};
    if (mood !== null)          payload.mood = mood;
    if (energy !== null)        payload.energy = energy;
    if (pain !== null)          payload.pain = pain;
    if (sleepHours.trim())      payload.sleepHours = parseFloat(sleepHours);
    if (medsTaken !== null)     payload.medicationsTaken = medsTaken;
    if (notes.trim())           payload.notes = notes.trim();

    try {
      const result = await createCheckIn(token!, payload);

      // Log PRN doses — fire in parallel, don't let partial failures block the success state.
      const prnEntries = Object.entries(prnCounts).filter(([, count]) => count > 0);
      if (prnEntries.length > 0) {
        await Promise.allSettled(
          prnEntries.flatMap(([id, count]) =>
            Array.from({ length: count }, () => logDose(token!, id)),
          ),
        );
      }

      setTodayEntry(result);
      setPageState('entry');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.';
      setSubmitError(msg);
      if (msg.toLowerCase().includes('already')) {
        loadToday();
      }
    } finally {
      setSubmitting(false);
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (pageState === 'loading') {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator color={Colors.buttonPrimary} size="large" />
      </View>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (pageState === 'error') {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ThemedText variant="body" secondary style={styles.errorMsg}>
          {loadError}
        </ThemedText>
        <ThemedButton label="Try again" variant="secondary" onPress={loadToday} />
      </View>
    );
  }

  // ── Already checked in ───────────────────────────────────────────────────────
  if (pageState === 'entry' && todayEntry) {
    return (
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.entryHeader}>
          <Ionicons name="checkmark-circle" size={24} color={Colors.accentBorder} />
          <ThemedText variant="heading3">You've checked in today.</ThemedText>
        </View>
        <EntryCard checkIn={todayEntry} />
        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────────
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.lg }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.pageHeader}>
        <ThemedText variant="body" secondary style={styles.greeting}>
          {getGreeting()}
        </ThemedText>
        <ThemedText variant="heading2">How are you today?</ThemedText>
      </View>

      {/* Mood */}
      <View style={styles.field}>
        <ThemedText variant="label" style={styles.fieldLabel}>
          How's your mood?
        </ThemedText>
        <ScaleSelector value={mood} onChange={setMood} lowLabel="Very low" highLabel="Great" />
      </View>

      {/* Energy */}
      <View style={styles.field}>
        <ThemedText variant="label" style={styles.fieldLabel}>
          Energy level?
        </ThemedText>
        <ScaleSelector value={energy} onChange={setEnergy} lowLabel="Exhausted" highLabel="Full" />
      </View>

      {/* Pain */}
      <View style={styles.field}>
        <ThemedText variant="label" style={styles.fieldLabel}>
          Any pain or discomfort?
        </ThemedText>
        <ScaleSelector value={pain} onChange={setPain} lowLabel="None" highLabel="Severe" />
      </View>

      {/* Sleep */}
      <View style={styles.field}>
        <ThemedInput
          label="How many hours did you sleep?"
          placeholder="e.g. 7.5"
          value={sleepHours}
          onChangeText={setSleepHours}
          keyboardType="decimal-pad"
          returnKeyType="done"
        />
      </View>

      {/* Scheduled medications */}
      <View style={styles.field}>
        <ThemedText variant="label" style={styles.fieldLabel}>
          Did you take your medications?
        </ThemedText>
        <YesNoSelector value={medsTaken} onChange={setMedsTaken} />
      </View>

      {/* As-needed (PRN) medications */}
      <View style={styles.field}>
        <ThemedText variant="label" style={styles.fieldLabel}>
          Did you take any as-needed medications today?
        </ThemedText>
        <ThemedText variant="bodySmall" secondary style={styles.prnHint}>
          Tap + for each time you took a medication outside your regular schedule.
        </ThemedText>

        {medsLoading ? (
          <View style={styles.prnLoading}>
            <ActivityIndicator color={Colors.textSecondary} size="small" />
          </View>
        ) : medications.length === 0 ? (
          <ThemedText variant="bodySmall" secondary style={styles.prnEmpty}>
            No medications added yet.
          </ThemedText>
        ) : (
          <View style={styles.prnCard}>
            {medications.map((med, i) => (
              <React.Fragment key={String(med.id)}>
                {i > 0 && <View style={styles.prnDivider} />}
                <PrnRow
                  med={med}
                  count={prnCounts[String(med.id)] ?? 0}
                  onChange={n => setPrnCount(String(med.id), n)}
                />
              </React.Fragment>
            ))}
          </View>
        )}
      </View>

      {/* Notes */}
      <View style={styles.field}>
        <ThemedInput
          label="Anything on your mind?"
          placeholder="Write your thoughts here — how your day is going, symptoms, anything at all…"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={5}
          style={styles.notesInput}
          returnKeyType="default"
        />
      </View>

      {submitError && (
        <View style={styles.errorBox}>
          <ThemedText style={styles.errorText}>{submitError}</ThemedText>
        </View>
      )}

      <ThemedButton
        label="Save check-in"
        variant="primary"
        fullWidth
        loading={submitting}
        onPress={handleSubmit}
      />

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
    gap: Spacing.md,
    padding: Spacing.xl,
  },
  errorMsg: { textAlign: 'center' },

  pageHeader: { gap: 4 },
  greeting: { fontFamily: FontFamily.sansMedium, letterSpacing: 0.3 },

  field: { gap: Spacing.sm },
  fieldLabel: { color: Colors.textPrimary },

  notesInput: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: Spacing.md,
  },

  prnHint: { lineHeight: FontSize.sm * 1.5 },
  prnLoading: { alignItems: 'center', paddingVertical: Spacing.md },
  prnEmpty:   { fontStyle: 'italic' },
  prnCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  prnDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },

  errorBox: {
    backgroundColor: '#fdf0ee',
    borderWidth: 1.5,
    borderColor: Colors.borderError,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  errorText: {
    fontFamily: FontFamily.sansRegular,
    fontSize: FontSize.sm,
    color: Colors.textError,
    lineHeight: FontSize.sm * 1.5,
  },

  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
});
