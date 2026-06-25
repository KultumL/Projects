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
import { useAuth } from '@/context/AuthContext';
import ThemedButton from '@/components/ThemedButton';
import ThemedInput from '@/components/ThemedInput';
import ThemedText from '@/components/ThemedText';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FormErrors {
  email?: string;
  password?: string;
}

export default function LoginScreen() {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const passwordRef = useRef<TextInput>(null);

  function clearFieldError(field: keyof FormErrors) {
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
    if (serverError) setServerError(null);
  }

  async function handleSubmit() {
    const errs: FormErrors = {};
    if (!EMAIL_RE.test(email.trim())) errs.email = 'Enter a valid email address.';
    if (!password) errs.password = 'Password is required.';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    setServerError(null);

    try {
      await login(email.trim().toLowerCase(), password);
      router.replace('/');
    } catch (err) {
      setServerError(
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }

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

        {/* ── Form ── */}
        <View style={styles.form}>
          <ThemedInput
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={v => { setEmail(v); clearFieldError('email'); }}
            error={errors.email}
            keyboardType="email-address"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            autoCapitalize="none"
          />

          <ThemedInput
            ref={passwordRef}
            label="Password"
            placeholder="Your password"
            value={password}
            onChangeText={v => { setPassword(v); clearFieldError('password'); }}
            error={errors.password}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
          />

          {serverError && (
            <View style={styles.serverErrorBox}>
              <ThemedText style={styles.serverErrorText}>{serverError}</ThemedText>
            </View>
          )}

          <ThemedButton
            label="Sign in"
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
            New here?{' '}
          </ThemedText>
          <Pressable onPress={() => router.push('/signup')} accessibilityRole="link">
            {({ pressed }) => (
              <ThemedText
                variant="bodySmall"
                style={[styles.createLink, pressed && styles.createLinkPressed]}
              >
                Create an account
              </ThemedText>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

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
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  brand: {
    letterSpacing: 1,
  },
  tagline: {
    textAlign: 'center',
  },
  form: {
    gap: Spacing.lg,
  },
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
  submitButton: {
    marginTop: Spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    flexWrap: 'wrap',
  },
  createLink: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.sm,
    color: Colors.buttonPrimary,
  },
  createLinkPressed: {
    color: Colors.textPrimary,
  },
});
