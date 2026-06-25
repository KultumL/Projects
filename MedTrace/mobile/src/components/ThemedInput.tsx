import React, { forwardRef } from 'react';
import {
  View,
  TextInput,
  TextInputProps,
  StyleSheet,
  Platform,
} from 'react-native';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/theme';
import ThemedText from './ThemedText';

interface ThemedInputProps extends TextInputProps {
  label: string;
  error?: string;
}

const ThemedInput = forwardRef<TextInput, ThemedInputProps>(
  ({ label, error, style, ...props }, ref) => {
    const hasError = Boolean(error);

    return (
      <View style={styles.wrapper}>
        <ThemedText variant="label" style={styles.label}>
          {label}
        </ThemedText>
        <TextInput
          ref={ref}
          style={[
            styles.input,
            hasError && styles.inputError,
            style,
          ]}
          placeholderTextColor={Colors.textSecondary}
          selectionColor={Colors.buttonPrimary}
          autoCapitalize="none"
          autoCorrect={false}
          {...props}
        />
        {hasError && (
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        )}
      </View>
    );
  },
);

ThemedInput.displayName = 'ThemedInput';

export default ThemedInput;

const INPUT_HEIGHT = Platform.OS === 'web' ? 52 : 54;

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.xs,
  },
  label: {
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  input: {
    height: INPUT_HEIGHT,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    fontFamily: FontFamily.sansRegular,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
  inputError: {
    borderColor: Colors.borderError,
  },
  errorText: {
    fontFamily: FontFamily.sansRegular,
    fontSize: FontSize.xs,
    color: Colors.textError,
    lineHeight: FontSize.xs * 1.4,
  },
});
