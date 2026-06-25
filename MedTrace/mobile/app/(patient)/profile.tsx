import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import type { AgeRange, UserRole } from '@/api/auth';
import ThemedText from '@/components/ThemedText';
import ThemedButton from '@/components/ThemedButton';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/theme';
import { clearTutorialSeen } from '@/api/storage';

const ROLE_LABELS: Record<UserRole, string> = {
  PATIENT: 'Patient',
  CAREGIVER: 'Caregiver',
};

const AGE_LABELS: Record<AgeRange, string> = {
  UNDER_18:   'Under 18',
  AGE_18_29:  '18–29',
  AGE_30_49:  '30–49',
  AGE_50_64:  '50–64',
  AGE_65_PLUS: '65+',
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={row.container}>
      <ThemedText style={row.label}>{label}</ThemedText>
      <ThemedText style={row.value}>{value}</ThemedText>
    </View>
  );
}

const row = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
    gap: Spacing.md,
  },
  label: {
    width: 100,
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  value: {
    flex: 1,
    fontFamily: FontFamily.sansRegular,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
});

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();

  if (!user) return null;

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  async function handleReplayTour() {
    await clearTutorialSeen(String(user!.id));
    router.navigate('/(patient)/');
  }

  const initials = user.name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.lg }]}>
      <View style={styles.top}>
        {/* Avatar */}
        <View style={styles.avatar}>
          <ThemedText style={styles.initials}>{initials}</ThemedText>
        </View>

        <ThemedText variant="heading3" style={styles.name}>
          {user.name}
        </ThemedText>

        {/* Details card */}
        <View style={styles.card}>
          <InfoRow label="Email"     value={user.email} />
          <View style={styles.divider} />
          <InfoRow label="Role"      value={ROLE_LABELS[user.role]} />
          <View style={styles.divider} />
          <InfoRow label="Age range" value={AGE_LABELS[user.ageRange]} />
        </View>
      </View>

      <View style={styles.actions}>
        <ThemedButton
          label="Replay tour"
          variant="secondary"
          fullWidth
          onPress={handleReplayTour}
        />
        <ThemedButton
          label="Log out"
          variant="secondary"
          fullWidth
          onPress={handleLogout}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundWarm,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['2xl'],
    justifyContent: 'space-between',
  },
  actions: { gap: Spacing.sm },
  top: { gap: Spacing.lg, alignItems: 'center' },

  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.accentFill,
    borderWidth: 2,
    borderColor: Colors.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: FontFamily.serifBold,
    fontSize: FontSize.xl,
    color: Colors.buttonPrimary,
  },
  name: { textAlign: 'center' },

  card: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
  },
});
