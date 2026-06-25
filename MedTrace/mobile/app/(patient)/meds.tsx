import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import {
  Medication,
  getMedications,
  createMedication,
  logDose,
} from '@/api/medications';
import ThemedText from '@/components/ThemedText';
import ThemedButton from '@/components/ThemedButton';
import ThemedInput from '@/components/ThemedInput';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/theme';

// ─── Medication card ──────────────────────────────────────────────────────────

function MedCard({
  med,
  onLogDose,
  doseState,
}: {
  med: Medication;
  onLogDose: (id: string | number) => void;
  doseState: 'idle' | 'loading' | 'logged' | 'error';
}) {
  return (
    <View style={card.container}>
      <View style={card.body}>
        <ThemedText style={card.name}>{med.name}</ThemedText>
        <ThemedText style={card.meta}>
          {med.dosage} · {med.frequency}
        </ThemedText>
        {med.scheduledTimes && med.scheduledTimes.length > 0 && (
          <View style={card.timesRow}>
            <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
            <ThemedText style={card.times}>
              {med.scheduledTimes.join(' · ')}
            </ThemedText>
          </View>
        )}
        {med.description ? (
          <ThemedText style={card.desc} numberOfLines={2}>
            {med.description}
          </ThemedText>
        ) : null}
      </View>

      <View style={card.divider} />

      <Pressable
        style={[
          card.doseBtn,
          doseState === 'logged' && card.doseBtnLogged,
          doseState === 'error' && card.doseBtnError,
        ]}
        onPress={() => doseState === 'idle' && onLogDose(med.id)}
        disabled={doseState !== 'idle'}
        accessibilityRole="button"
        accessibilityLabel={`Log dose for ${med.name}`}
      >
        {doseState === 'loading' ? (
          <ActivityIndicator color={Colors.buttonPrimary} size="small" />
        ) : (
          <>
            <Ionicons
              name={
                doseState === 'logged'
                  ? 'checkmark-circle'
                  : doseState === 'error'
                  ? 'alert-circle-outline'
                  : 'add-circle-outline'
              }
              size={18}
              color={
                doseState === 'logged'
                  ? Colors.accentBorder
                  : doseState === 'error'
                  ? Colors.textError
                  : Colors.buttonPrimary
              }
            />
            <ThemedText style={[card.doseBtnLabel, doseState !== 'idle' && card.doseBtnLabelDim]}>
              {doseState === 'logged'
                ? 'Logged'
                : doseState === 'error'
                ? 'Failed'
                : 'Log dose'}
            </ThemedText>
          </>
        )}
      </Pressable>
    </View>
  );
}

const card = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  body: { padding: Spacing.md, gap: 4 },
  name: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
  meta: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  timesRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  times: {
    fontFamily: FontFamily.sansRegular,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  desc: {
    fontFamily: FontFamily.sansRegular,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: FontSize.xs * 1.5,
    marginTop: 4,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },
  doseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
  },
  doseBtnLogged: { opacity: 0.7 },
  doseBtnError: { opacity: 0.7 },
  doseBtnLabel: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.sm,
    color: Colors.buttonPrimary,
  },
  doseBtnLabelDim: { color: Colors.textSecondary },
});

// ─── Add medication form ───────────────────────────────────────────────────────

function AddMedForm({
  onSave,
  onCancel,
}: {
  onSave: (name: string, dosage: string, frequency: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const dosageRef = useRef<TextInput>(null);
  const freqRef = useRef<TextInput>(null);

  async function handleSave() {
    if (!name.trim() || !dosage.trim() || !frequency.trim()) {
      setErr('All three fields are required.');
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      await onSave(name.trim(), dosage.trim(), frequency.trim());
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to add medication.');
      setSaving(false);
    }
  }

  return (
    <View style={addForm.container}>
      <ThemedText variant="subheading" style={addForm.title}>
        Add medication
      </ThemedText>
      <ThemedText variant="bodySmall" secondary>
        The backend will enrich details from OpenFDA automatically.
      </ThemedText>

      <View style={addForm.fields}>
        <ThemedInput
          label="Medication name"
          placeholder="e.g. Metformin"
          value={name}
          onChangeText={setName}
          returnKeyType="next"
          autoCapitalize="words"
          onSubmitEditing={() => dosageRef.current?.focus()}
        />
        <ThemedInput
          ref={dosageRef}
          label="Dosage"
          placeholder="e.g. 500mg"
          value={dosage}
          onChangeText={setDosage}
          returnKeyType="next"
          onSubmitEditing={() => freqRef.current?.focus()}
        />
        <ThemedInput
          ref={freqRef}
          label="Frequency"
          placeholder="e.g. Twice daily"
          value={frequency}
          onChangeText={setFrequency}
          returnKeyType="done"
          onSubmitEditing={handleSave}
        />
      </View>

      {err && (
        <View style={addForm.errorBox}>
          <ThemedText style={addForm.errorText}>{err}</ThemedText>
        </View>
      )}

      <View style={addForm.actions}>
        <ThemedButton
          label="Cancel"
          variant="ghost"
          onPress={onCancel}
          style={addForm.btnHalf}
        />
        <ThemedButton
          label="Save"
          variant="primary"
          loading={saving}
          onPress={handleSave}
          style={addForm.btnHalf}
        />
      </View>
    </View>
  );
}

const addForm = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.accentBorder,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  title: { color: Colors.textPrimary },
  fields: { gap: Spacing.md },
  actions: { flexDirection: 'row', gap: Spacing.sm },
  btnHalf: { flex: 1 },
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

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function MedsScreen() {
  const { token } = useAuth();
  const insets = useSafeAreaInsets();

  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Per-medication dose state: medicationId → 'idle' | 'loading' | 'logged' | 'error'
  const [doseStates, setDoseStates] = useState<
    Record<string, 'idle' | 'loading' | 'logged' | 'error'>
  >({});

  useEffect(() => {
    fetchMeds();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchMeds() {
    setLoading(true);
    setLoadError(null);
    try {
      const list = await getMedications(token!);
      setMedications(list);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load.');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddMed(name: string, dosage: string, frequency: string) {
    const med = await createMedication(token!, { name, dosage, frequency });
    setMedications(prev => [med, ...prev]);
    setShowAddForm(false);
  }

  async function handleLogDose(id: string | number) {
    const key = String(id);
    setDoseStates(prev => ({ ...prev, [key]: 'loading' }));
    try {
      await logDose(token!, id);
      setDoseStates(prev => ({ ...prev, [key]: 'logged' }));
      // Reset after 3 s so the button is usable again
      setTimeout(() => {
        setDoseStates(prev => ({ ...prev, [key]: 'idle' }));
      }, 3000);
    } catch {
      setDoseStates(prev => ({ ...prev, [key]: 'error' }));
      setTimeout(() => {
        setDoseStates(prev => ({ ...prev, [key]: 'idle' }));
      }, 3000);
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator color={Colors.buttonPrimary} size="large" />
      </View>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (loadError) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ThemedText variant="body" secondary style={styles.msgCenter}>{loadError}</ThemedText>
        <ThemedButton label="Try again" variant="secondary" onPress={fetchMeds} />
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
      {/* ── Header row ── */}
      <View style={styles.headerRow}>
        <ThemedText variant="heading3">Medications</ThemedText>
        <Pressable
          style={[styles.addBtn, showAddForm && styles.addBtnActive]}
          onPress={() => setShowAddForm(v => !v)}
          accessibilityRole="button"
          accessibilityLabel={showAddForm ? 'Cancel' : 'Add medication'}
        >
          <Ionicons
            name={showAddForm ? 'close' : 'add'}
            size={22}
            color={showAddForm ? Colors.textSecondary : Colors.buttonPrimary}
          />
        </Pressable>
      </View>

      {/* ── Add form (inline, collapsible) ── */}
      {showAddForm && (
        <AddMedForm
          onSave={handleAddMed}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* ── Medication list ── */}
      {medications.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="medkit-outline" size={40} color={Colors.border} />
          <ThemedText variant="subheading" secondary style={styles.msgCenter}>
            No medications yet
          </ThemedText>
          <ThemedText variant="bodySmall" secondary style={styles.msgCenter}>
            Tap the + button above to add your first medication.
          </ThemedText>
        </View>
      ) : (
        <View style={styles.list}>
          {medications.map(med => (
            <MedCard
              key={med.id}
              med={med}
              onLogDose={handleLogDose}
              doseState={doseStates[String(med.id)] ?? 'idle'}
            />
          ))}
        </View>
      )}

      <View style={{ height: Spacing.xl }} />
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.backgroundWarm },
  content: { paddingHorizontal: Spacing.xl, gap: Spacing.lg },

  centered: {
    flex: 1,
    backgroundColor: Colors.backgroundWarm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    padding: Spacing.xl,
  },
  msgCenter: { textAlign: 'center' },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnActive: {
    borderColor: Colors.accentBorder,
    backgroundColor: Colors.accentFill,
  },
  list: { gap: Spacing.md },
  empty: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing['2xl'],
  },
});
