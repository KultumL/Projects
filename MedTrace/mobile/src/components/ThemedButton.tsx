import React from 'react';
import {
  Pressable,
  PressableProps,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/theme';
import ThemedText from './ThemedText';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ThemedButtonProps extends PressableProps {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
  fullWidth?: boolean;
}

export default function ThemedButton({
  label,
  variant = 'primary',
  loading = false,
  fullWidth = false,
  style,
  disabled,
  ...props
}: ThemedButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && styles[`${variant}Pressed`],
        isDisabled && styles.disabled,
        style as ViewStyle,
      ]}
      disabled={isDisabled}
      accessibilityRole="button"
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? Colors.buttonPrimaryText : Colors.buttonPrimary}
          size="small"
        />
      ) : (
        <ThemedText style={[styles.label, styles[`${variant}Label`]]}>
          {label}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  disabled: {
    opacity: 0.45,
  },

  // Primary
  primary: {
    backgroundColor: Colors.buttonPrimary,
    borderWidth: 0,
  },
  primaryPressed: {
    backgroundColor: Colors.textPrimary,
  },
  primaryLabel: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.base,
    color: Colors.buttonPrimaryText,
  },

  // Secondary (outlined)
  secondary: {
    backgroundColor: Colors.accentFill,
    borderWidth: 1.5,
    borderColor: Colors.accentBorder,
  },
  secondaryPressed: {
    backgroundColor: Colors.border,
  },
  secondaryLabel: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.base,
    color: Colors.buttonPrimary,
  },

  // Ghost (text only)
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  ghostPressed: {
    backgroundColor: Colors.accentFill,
  },
  ghostLabel: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.base,
    color: Colors.buttonPrimary,
  },

  label: {
    color: Colors.textPrimary,
  },
});
