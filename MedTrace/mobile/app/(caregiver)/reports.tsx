import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useCare } from '@/context/CareContext';
import { downloadPatientReport } from '@/api/caregiver';
import ThemedText from '@/components/ThemedText';
import ThemedButton from '@/components/ThemedButton';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/theme';

type Period = 'WEEKLY' | 'MONTHLY' | 'YEARLY';

const PERIODS: { value: Period; label: string; description: string }[] = [
  { value: 'WEEKLY',  label: 'This week',  description: 'Last 7 days' },
  { value: 'MONTHLY', label: 'This month', description: 'Last 30 days' },
  { value: 'YEARLY',  label: 'This year',  description: 'Last 12 months' },
];

function NoLink() {
  return (
    <View style={styles.gateState}>
      <Ionicons name="people-outline" size={36} color={Colors.border} />
      <ThemedText variant="subheading" style={styles.gateTitle}>
        You aren't connected to anyone yet
      </ThemedText>
      <ThemedText variant="bodySmall" secondary style={styles.gateBody}>
        A patient needs to invite you before you can access their reports.
      </ThemedText>
    </View>
  );
}

export default function CaregiverReportsScreen() {
  const { token } = useAuth();
  const { patient, loading: careLoading } = useCare();
  const insets = useSafeAreaInsets();

  const [downloading, setDownloading] = useState<Period | null>(null);
  const [errors,    setErrors]    = useState<Partial<Record<Period, string>>>({});
  const [successes, setSuccesses] = useState<Partial<Record<Period, boolean>>>({});

  async function handleDownload(period: Period) {
    if (Platform.OS !== 'web') {
      setErrors(prev => ({
        ...prev,
        [period]: 'PDF download is available in the web version of MedTrace.',
      }));
      return;
    }
    setDownloading(period);
    setErrors(prev => ({ ...prev, [period]: undefined }));
    setSuccesses(prev => ({ ...prev, [period]: false }));
    try {
      await downloadPatientReport(token!, patient!.patientId, period);
      setSuccesses(prev => ({ ...prev, [period]: true }));
    } catch (err) {
      setErrors(prev => ({
        ...prev,
        [period]: err instanceof Error ? err.message : 'Download failed.',
      }));
    } finally {
      setDownloading(null);
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

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.lg }]}>
      <View style={styles.header}>
        <ThemedText variant="heading3">Reports</ThemedText>
        <ThemedText variant="bodySmall" secondary style={styles.headerSub}>
          Generate a PDF summary of {patient.patientName}'s health data to share
          with their care team.
        </ThemedText>
      </View>

      <View style={styles.cards}>
        {PERIODS.map(({ value, label, description }) => {
          const active = downloading === value;
          const done   = successes[value];
          const err    = errors[value];

          return (
            <View key={value} style={styles.periodCard}>
              <View style={styles.periodInfo}>
                <Ionicons name="document-text-outline" size={22} color={Colors.accentBorder} />
                <View style={styles.periodText}>
                  <ThemedText style={styles.periodLabel}>{label}</ThemedText>
                  <ThemedText style={styles.periodDesc}>{description}</ThemedText>
                </View>
              </View>
              {err && <ThemedText style={styles.errorText}>{err}</ThemedText>}
              <ThemedButton
                label={done ? 'Downloaded ✓' : 'Download PDF'}
                variant={done ? 'secondary' : 'primary'}
                loading={active}
                disabled={downloading !== null && !active}
                onPress={() => handleDownload(value)}
                fullWidth
              />
            </View>
          );
        })}
      </View>

      {Platform.OS !== 'web' && (
        <View style={styles.nativeNote}>
          <Ionicons name="information-circle-outline" size={18} color={Colors.textSecondary} />
          <ThemedText variant="bodySmall" secondary style={styles.nativeNoteText}>
            PDF download is available in the web version of MedTrace.
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundWarm,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.xl,
  },
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

  header: { gap: Spacing.sm },
  headerSub: { lineHeight: FontSize.sm * 1.6 },

  cards: { gap: Spacing.md },
  periodCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  periodInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  periodText: { flex: 1, gap: 2 },
  periodLabel: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
  periodDesc: {
    fontFamily: FontFamily.sansRegular,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  errorText: {
    fontFamily: FontFamily.sansRegular,
    fontSize: FontSize.sm,
    color: Colors.textError,
    lineHeight: FontSize.sm * 1.4,
  },
  nativeNote: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-start',
    backgroundColor: Colors.accentFill,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  nativeNoteText: { flex: 1, lineHeight: FontSize.sm * 1.5 },
});
