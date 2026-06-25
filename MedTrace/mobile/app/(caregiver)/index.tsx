import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useCare } from '@/context/CareContext';
import { getPatientDoseStatus } from '@/api/caregiver';
import { getPatientCheckIns } from '@/api/checkins';
import { DoseStatusEntry } from '@/api/doses';
import { CheckIn } from '@/api/checkins';
import ThemedText from '@/components/ThemedText';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/theme';
import { useTour, TourStep } from '@/context/TourContext';
import { getTutorialSeen } from '@/api/storage';

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

// ─── No-link empty state ──────────────────────────────────────────────────────

function NoLinkState() {
  return (
    <View style={empty.container}>
      <Ionicons name="people-outline" size={40} color={Colors.border} />
      <ThemedText variant="subheading" style={empty.title}>
        You aren't connected to anyone yet
      </ThemedText>
      <ThemedText variant="bodySmall" secondary style={empty.body}>
        A patient needs to invite you before you can view their health data.
      </ThemedText>
    </View>
  );
}

const empty = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  title: { textAlign: 'center' },
  body:  { textAlign: 'center', lineHeight: FontSize.sm * 1.6 },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CaregiverHomeScreen() {
  const { user, token } = useAuth();
  const { patient, loading: careLoading } = useCare();
  const insets = useSafeAreaInsets();
  const { startTour } = useTour();

  const patientCardRef = useRef<View>(null);

  const greeting  = useMemo(getGreeting, []);
  const dateLabel = useMemo(getDateLabel, []);

  const [doses, setDoses]           = useState<DoseStatusEntry[]>([]);
  const [lastCheckIn, setLastCheckIn] = useState<CheckIn | null>(null);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    if (!patient || !token) { setDataLoading(false); return; }
    setDataLoading(true);
    Promise.all([
      getPatientDoseStatus(token, patient.patientId).catch(() => [] as DoseStatusEntry[]),
      getPatientCheckIns(token, patient.patientId).catch(() => [] as CheckIn[]),
    ]).then(([d, ci]) => {
      setDoses(d);
      setLastCheckIn(ci[0] ?? null);
    }).finally(() => setDataLoading(false));
  }, [patient, token]);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      void (async () => {
        const seen = await getTutorialSeen(String(user.id));
        if (seen) return;
        setTimeout(() => {
          const steps: TourStep[] = [
            {
              id: 'patient-card',
              title: 'Your patient\'s summary',
              description: 'See today\'s dose progress and the last check-in date for your linked patient at a glance.',
              ref: patientCardRef,
            },
            {
              id: 'tabs',
              title: 'Caregiver tabs',
              description: 'Use the tabs below to switch between Home, Patient overview, Log entries, Reports, and your Profile.',
            },
          ];
          startTour(steps);
        }, 350);
      })();
    }, [user, startTour]),
  );

  if (!user) return null;

  const takenCount = doses.filter(d => d.status === 'TAKEN').length;
  const totalCount = doses.filter(d => d.status !== 'MISSED').length;

  const lastCheckInLabel = lastCheckIn
    ? new Date(lastCheckIn.checkInDate).toLocaleDateString('en-GB', {
        weekday: 'short', day: 'numeric', month: 'short',
      })
    : 'No check-ins yet';

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
        <ThemedText variant="heading2">{user.name}</ThemedText>
      </View>

      {careLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.textSecondary} />
        </View>
      ) : !patient ? (
        <NoLinkState />
      ) : (
        <>
          {/* Patient overview card */}
          <View style={styles.section}>
            <ThemedText variant="subheading">Your patient</ThemedText>
            <View ref={patientCardRef} style={styles.card}>
              <View style={styles.patientHeader}>
                <View style={styles.avatar}>
                  <ThemedText style={styles.avatarInitial}>
                    {patient.patientName.charAt(0).toUpperCase()}
                  </ThemedText>
                </View>
                <View style={styles.patientMeta}>
                  <ThemedText style={styles.patientName}>
                    {patient.patientName}
                  </ThemedText>
                  <ThemedText variant="caption">
                    {patient.permission === 'VIEW_AND_INPUT'
                      ? 'View & log access'
                      : 'View-only access'}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.divider} />

              {dataLoading ? (
                <View style={styles.statRow}>
                  <ActivityIndicator size="small" color={Colors.textSecondary} />
                </View>
              ) : (
                <>
                  <View style={styles.statRow}>
                    <Ionicons
                      name={takenCount === totalCount && totalCount > 0 ? 'checkmark-circle' : 'time-outline'}
                      size={18}
                      color={takenCount === totalCount && totalCount > 0 ? Colors.accentBorder : Colors.textSecondary}
                    />
                    <ThemedText variant="bodySmall" secondary>
                      {totalCount > 0
                        ? `${takenCount} of ${totalCount} doses taken today`
                        : 'No doses scheduled today'}
                    </ThemedText>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.statRow}>
                    <Ionicons name="calendar-outline" size={18} color={Colors.textSecondary} />
                    <ThemedText variant="bodySmall" secondary>
                      Last check-in · {lastCheckInLabel}
                    </ThemedText>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Prompt to the Patient tab */}
          <View style={styles.section}>
            <View style={styles.promptCard}>
              <Ionicons name="eye-outline" size={20} color={Colors.accentBorder} />
              <View style={styles.promptText}>
                <ThemedText style={styles.promptTitle}>
                  Full health overview
                </ThemedText>
                <ThemedText variant="bodySmall" secondary style={styles.promptBody}>
                  See {patient.patientName}'s medications, dose history, and recent check-ins in the Patient tab.
                </ThemedText>
              </View>
            </View>
          </View>
        </>
      )}

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

  centered: { alignItems: 'center', paddingVertical: Spacing.xl },

  section: { gap: Spacing.sm },

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

  patientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.accentFill,
    borderWidth: 1.5,
    borderColor: Colors.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: FontFamily.serifBold,
    fontSize: FontSize.md,
    color: Colors.buttonPrimary,
  },
  patientMeta: { flex: 1, gap: 2 },
  patientName: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },

  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
  },

  promptCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  promptText: { flex: 1, gap: 4 },
  promptTitle: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
  promptBody: { lineHeight: FontSize.sm * 1.55 },
});
