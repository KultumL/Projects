import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/api/config';
import ThemedText from '@/components/ThemedText';
import ThemedButton from '@/components/ThemedButton';
import { Colors, FontSize, FontFamily, Radius, Spacing } from '@/theme';

type Period = 'WEEKLY' | 'MONTHLY' | 'YEARLY';

const PERIODS: { value: Period; label: string; description: string }[] = [
  { value: 'WEEKLY',  label: 'This week',    description: 'Last 7 days' },
  { value: 'MONTHLY', label: 'This month',   description: 'Last 30 days' },
  { value: 'YEARLY',  label: 'This year',    description: 'Last 12 months' },
];

async function downloadReport(
  token: string,
  period: Period,
): Promise<void> {
  if (Platform.OS !== 'web') {
    throw new Error(
      'PDF export is available in the web version of MedTrace. Native share is coming soon.',
    );
  }

  const response = await fetch(
    `${API_BASE_URL}/api/reports?period=${period}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  if (!response.ok) {
    // Try to extract a JSON error message; fall back to a generic one
    const text = await response.text().catch(() => '');
    let msg = 'Failed to generate report. Please try again.';
    try {
      const json = JSON.parse(text) as { error?: string };
      if (json.error) msg = json.error;
    } catch { /* non-JSON body */ }
    throw new Error(msg);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);

  // Open in a new tab so the browser's built-in PDF viewer handles it.
  // If the server sets Content-Disposition: attachment, the browser will
  // download directly instead.
  const a = document.createElement('a');
  a.href = url;
  a.download = `medtrace-report-${period.toLowerCase()}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsScreen() {
  const { token } = useAuth();
  const insets = useSafeAreaInsets();

  const [downloading, setDownloading] = useState<Period | null>(null);
  const [errors, setErrors] = useState<Partial<Record<Period, string>>>({});
  const [successes, setSuccesses] = useState<Partial<Record<Period, boolean>>>({});

  async function handleDownload(period: Period) {
    setDownloading(period);
    setErrors(prev => ({ ...prev, [period]: undefined }));
    setSuccesses(prev => ({ ...prev, [period]: false }));

    try {
      await downloadReport(token!, period);
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

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.lg }]}>
      <View style={styles.header}>
        <ThemedText variant="heading3">Reports</ThemedText>
        <ThemedText variant="bodySmall" secondary style={styles.headerSub}>
          Generate a PDF summary of your health data to share with your doctor or keep for your records.
        </ThemedText>
      </View>

      <View style={styles.cards}>
        {PERIODS.map(({ value, label, description }) => {
          const active = downloading === value;
          const done = successes[value];
          const err = errors[value];

          return (
            <View key={value} style={styles.periodCard}>
              <View style={styles.periodInfo}>
                <Ionicons
                  name="document-text-outline"
                  size={22}
                  color={Colors.accentBorder}
                />
                <View style={styles.periodText}>
                  <ThemedText style={styles.periodLabel}>{label}</ThemedText>
                  <ThemedText style={styles.periodDesc}>{description}</ThemedText>
                </View>
              </View>

              {err && (
                <ThemedText style={styles.errorText}>{err}</ThemedText>
              )}

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
            PDF download is available in the web version of MedTrace. Native share support is coming soon.
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
  periodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
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
