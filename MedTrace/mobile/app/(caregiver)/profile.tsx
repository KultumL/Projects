import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useCare } from '@/context/CareContext';
import type { AgeRange, UserRole } from '@/api/auth';
import type { CareLink, CarePermission } from '@/api/careLinks';
import ThemedText from '@/components/ThemedText';
import ThemedButton from '@/components/ThemedButton';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/theme';
import { clearTutorialSeen } from '@/api/storage';

const ROLE_LABELS: Record<UserRole, string> = {
  PATIENT:   'Patient',
  CAREGIVER: 'Caregiver',
};

const AGE_LABELS: Record<AgeRange, string> = {
  UNDER_18:    'Under 18',
  AGE_18_29:   '18–29',
  AGE_30_49:   '30–49',
  AGE_50_64:   '50–64',
  AGE_65_PLUS: '65+',
};

const PERM_LABELS: Record<CarePermission, string> = {
  VIEW_ONLY:       'View only',
  VIEW_AND_INPUT:  'View & log',
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

function CareRow({ link }: { link: CareLink }) {
  const initial = link.patientName.charAt(0).toUpperCase();
  return (
    <View style={styles.careRow}>
      <View style={styles.careAvatar}>
        <ThemedText style={styles.careInitial}>{initial}</ThemedText>
      </View>
      <View style={styles.careMeta}>
        <ThemedText style={styles.carePatient}>{link.patientName}</ThemedText>
        <ThemedText style={styles.carePerm}>{PERM_LABELS[link.permission]}</ThemedText>
      </View>
      <View style={[
        styles.careBadge,
        link.status !== 'ACTIVE' && styles.careBadgeInactive,
      ]}>
        <ThemedText style={[
          styles.careBadgeText,
          link.status !== 'ACTIVE' && styles.careBadgeTextInactive,
        ]}>
          {link.status}
        </ThemedText>
      </View>
    </View>
  );
}

export default function CaregiverProfileScreen() {
  const { user, logout } = useAuth();
  const { links } = useCare();
  const insets = useSafeAreaInsets();

  if (!user) return null;

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  async function handleReplayTour() {
    await clearTutorialSeen(String(user!.id));
    router.navigate('/(caregiver)/');
  }

  const initials = user.name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Spacing.lg, paddingBottom: Spacing['2xl'] },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Avatar + name */}
      <View style={styles.top}>
        <View style={styles.avatar}>
          <ThemedText style={styles.initials}>{initials}</ThemedText>
        </View>
        <ThemedText variant="heading3" style={styles.name}>{user.name}</ThemedText>
      </View>

      {/* Account details */}
      <View style={styles.card}>
        <InfoRow label="Email"     value={user.email} />
        <View style={styles.divider} />
        <InfoRow label="Role"      value={ROLE_LABELS[user.role]} />
        <View style={styles.divider} />
        <InfoRow label="Age range" value={AGE_LABELS[user.ageRange]} />
      </View>

      {/* Care links */}
      <View style={styles.section}>
        <ThemedText variant="subheading">Caring for</ThemedText>
        <View style={styles.card}>
          {links.length === 0 ? (
            <View style={styles.emptyRow}>
              <ThemedText variant="bodySmall" secondary>
                No care links yet. A patient needs to invite you.
              </ThemedText>
            </View>
          ) : (
            links.map((link, i) => (
              <View key={String(link.id)}>
                {i > 0 && <View style={styles.divider} />}
                <CareRow link={link} />
              </View>
            ))
          )}
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.backgroundWarm },
  content: { paddingHorizontal: Spacing.xl, gap: Spacing.lg },

  top: { alignItems: 'center', gap: Spacing.sm },
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

  section: { gap: Spacing.sm },
  actions: { gap: Spacing.sm },

  emptyRow: { padding: Spacing.lg },

  careRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
    gap: Spacing.md,
  },
  careAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.accentFill,
    borderWidth: 1.5,
    borderColor: Colors.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  careInitial: {
    fontFamily: FontFamily.serifBold,
    fontSize: FontSize.base,
    color: Colors.buttonPrimary,
  },
  careMeta: { flex: 1, gap: 2 },
  carePatient: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
  carePerm: {
    fontFamily: FontFamily.sansRegular,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  careBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    backgroundColor: Colors.accentFill,
    borderWidth: 1,
    borderColor: Colors.accentBorder,
  },
  careBadgeInactive: {
    backgroundColor: Colors.backgroundLight,
    borderColor: Colors.border,
  },
  careBadgeText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.xs - 1,
    color: Colors.buttonPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  careBadgeTextInactive: { color: Colors.textSecondary },
});
