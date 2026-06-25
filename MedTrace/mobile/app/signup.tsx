import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { register, AgeRange, UserRole } from '@/api/auth';
import { useAuth } from '@/context/AuthContext';
import ThemedButton from '@/components/ThemedButton';
import ThemedInput from '@/components/ThemedInput';
import ThemedText from '@/components/ThemedText';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/theme';

// ─── Option definitions ───────────────────────────────────────────────────────

const ROLES: { label: string; value: UserRole }[] = [
  { label: 'Patient', value: 'PATIENT' },
  { label: 'Caregiver', value: 'CAREGIVER' },
];

const AGE_RANGES: { label: string; value: AgeRange }[] = [
  { label: 'Under 18', value: 'UNDER_18' },
  { label: '18–29', value: 'AGE_18_29' },
  { label: '30–49', value: 'AGE_30_49' },
  { label: '50–64', value: 'AGE_50_64' },
  { label: '65+', value: 'AGE_65_PLUS' },
];

// ─── Validation ───────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FormFields {
  name: string;
  email: string;
  password: string;
  role: UserRole | null;
  ageRange: AgeRange | null;
}

function validate(f: FormFields): Partial<Record<keyof FormFields, string>> {
  const errs: Partial<Record<keyof FormFields, string>> = {};
  if (!f.name.trim()) errs.name = 'Name is required.';
  if (!EMAIL_RE.test(f.email.trim())) errs.email = 'Enter a valid email address.';
  if (f.password.length < 8) errs.password = 'Password must be at least 8 characters.';
  if (!f.role) errs.role = 'Please select your role.';
  if (!f.ageRange) errs.ageRange = 'Please select your age range.';
  return errs;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SignUpScreen() {
  const { login } = useAuth();

  const [form, setForm] = useState<FormFields>({
    name: '',
    email: '',
    password: '',
    role: null,
    ageRange: null,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormFields, string>>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  function setField<K extends keyof FormFields>(key: K, value: FormFields[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }));
    if (serverError) setServerError(null);
  }

  async function handleSubmit() {
    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    setServerError(null);

    const email = form.email.trim().toLowerCase();

    // Step 1 — register
    try {
      await register({
        name: form.name.trim(),
        email,
        password: form.password,
        role: form.role!,
        ageRange: form.ageRange!,
      });
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setLoading(false);
      return;
    }

    // Step 2 — auto-login with the same credentials so the user lands directly
    // in the app rather than having to sign in manually after registering.
    try {
      await login(email, form.password);
      router.replace('/');
    } catch {
      // Auto-login failed (rare, e.g. transient network issue after registration).
      // Send to login screen so the user can sign in manually.
      router.replace('/login');
    } finally {
      setLoading(false);
    }
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Branding ── */}
        <View style={styles.header}>
          <ThemedText variant="heading2" style={styles.brand}>
            MedTrace
          </ThemedText>
          <ThemedText variant="body" secondary style={styles.tagline}>
            Your personal health journal
          </ThemedText>
        </View>

        {/* ── Fields ── */}
        <View style={styles.form}>
          <ThemedInput
            label="Name"
            placeholder="Your full name"
            value={form.name}
            onChangeText={v => setField('name', v)}
            error={errors.name}
            returnKeyType="next"
            autoCapitalize="words"
            autoCorrect={false}
            onSubmitEditing={() => emailRef.current?.focus()}
          />

          <ThemedInput
            ref={emailRef}
            label="Email"
            placeholder="you@example.com"
            value={form.email}
            onChangeText={v => setField('email', v)}
            error={errors.email}
            keyboardType="email-address"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />

          <ThemedInput
            ref={passwordRef}
            label="Password"
            placeholder="At least 8 characters"
            value={form.password}
            onChangeText={v => setField('password', v)}
            error={errors.password}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
          />

          {/* ── Role selector ── */}
          <View style={styles.selectorGroup}>
            <ThemedText variant="label" style={styles.selectorLabel}>
              I am a
            </ThemedText>
            <View style={styles.roleRow}>
              {ROLES.map(({ label, value }) => {
                const selected = form.role === value;
                return (
                  <Pressable
                    key={value}
                    style={[styles.chip, styles.roleChip, selected && styles.chipSelected]}
                    onPress={() => setField('role', value)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                  >
                    <ThemedText
                      style={[styles.chipLabel, selected && styles.chipLabelSelected]}
                    >
                      {label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
            {errors.role && (
              <ThemedText style={styles.fieldError}>{errors.role}</ThemedText>
            )}
          </View>

          {/* ── Age range selector ── */}
          <View style={styles.selectorGroup}>
            <ThemedText variant="label" style={styles.selectorLabel}>
              Age range
            </ThemedText>
            <View style={styles.ageRow}>
              {AGE_RANGES.map(({ label, value }) => {
                const selected = form.ageRange === value;
                return (
                  <Pressable
                    key={value}
                    style={[styles.chip, styles.ageChip, selected && styles.chipSelected]}
                    onPress={() => setField('ageRange', value)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                  >
                    <ThemedText
                      style={[styles.chipLabel, selected && styles.chipLabelSelected]}
                    >
                      {label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
            {errors.ageRange && (
              <ThemedText style={styles.fieldError}>{errors.ageRange}</ThemedText>
            )}
          </View>

          {/* ── Server / network error ── */}
          {serverError && (
            <View style={styles.serverErrorBox}>
              <ThemedText style={styles.serverErrorText}>{serverError}</ThemedText>
            </View>
          )}

          {/* ── Submit ── */}
          <ThemedButton
            label="Create account"
            variant="primary"
            fullWidth
            loading={loading}
            onPress={handleSubmit}
            style={styles.submitButton}
          />
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <ThemedText variant="bodySmall" secondary>
            Already have an account?{' '}
          </ThemedText>
          <Pressable onPress={() => router.push('/login')} accessibilityRole="link">
            {({ pressed }) => (
              <ThemedText
                variant="bodySmall"
                style={[styles.signInLink, pressed && styles.signInLinkPressed]}
              >
                Sign in
              </ThemedText>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Colors.backgroundWarm,
  },
  scroll: {
    flex: 1,
    backgroundColor: Colors.backgroundWarm,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing['2xl'],
    gap: Spacing.lg,
  },

  // Branding
  header: {
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  brand: {
    letterSpacing: 1,
  },
  tagline: {
    textAlign: 'center',
  },

  // Form
  form: {
    gap: Spacing.lg,
  },

  // Selectors
  selectorGroup: {
    gap: Spacing.sm,
  },
  selectorLabel: {
    color: Colors.textPrimary,
  },
  roleRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  ageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    borderWidth: 1.5,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  roleChip: {
    flex: 1,
    minHeight: 48,
  },
  ageChip: {
    minHeight: 44,
  },
  chipSelected: {
    backgroundColor: Colors.accentFill,
    borderColor: Colors.accentBorder,
  },
  chipLabel: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.base,
    color: Colors.textSecondary,
  },
  chipLabelSelected: {
    color: Colors.textPrimary,
    fontFamily: FontFamily.sansSemiBold,
  },
  fieldError: {
    fontFamily: FontFamily.sansRegular,
    fontSize: FontSize.xs,
    color: Colors.textError,
    lineHeight: FontSize.xs * 1.4,
  },

  // Server error banner
  serverErrorBox: {
    backgroundColor: '#fdf0ee',
    borderWidth: 1.5,
    borderColor: Colors.borderError,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  serverErrorText: {
    fontFamily: FontFamily.sansRegular,
    fontSize: FontSize.sm,
    color: Colors.textError,
    lineHeight: FontSize.sm * 1.5,
  },

  // Submit
  submitButton: {
    marginTop: Spacing.xs,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    flexWrap: 'wrap',
  },
  signInLink: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.sm,
    color: Colors.buttonPrimary,
  },
  signInLinkPressed: {
    color: Colors.textPrimary,
  },

});
