import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { Colors, FontFamily, FontSize } from '@/theme';

type Variant =
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'subheading'
  | 'body'
  | 'bodySmall'
  | 'caption'
  | 'label';

interface ThemedTextProps extends TextProps {
  variant?: Variant;
  secondary?: boolean;
}

export default function ThemedText({
  variant = 'body',
  secondary = false,
  style,
  ...props
}: ThemedTextProps) {
  return (
    <Text
      style={[
        styles.base,
        styles[variant],
        secondary && styles.secondary,
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    color: Colors.textPrimary,
    fontFamily: FontFamily.sansRegular,
    fontSize: FontSize.base,
  },
  secondary: {
    color: Colors.textSecondary,
  },

  heading1: {
    fontFamily: FontFamily.serifBold,
    fontSize: FontSize['3xl'],
    lineHeight: FontSize['3xl'] * 1.2,
    color: Colors.textPrimary,
  },
  heading2: {
    fontFamily: FontFamily.serifBold,
    fontSize: FontSize['2xl'],
    lineHeight: FontSize['2xl'] * 1.25,
    color: Colors.textPrimary,
  },
  heading3: {
    fontFamily: FontFamily.serifMedium,
    fontSize: FontSize.xl,
    lineHeight: FontSize.xl * 1.3,
    color: Colors.textPrimary,
  },
  subheading: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.md,
    lineHeight: FontSize.md * 1.4,
    color: Colors.textPrimary,
  },
  body: {
    fontFamily: FontFamily.sansRegular,
    fontSize: FontSize.base,
    lineHeight: FontSize.base * 1.6,
  },
  bodySmall: {
    fontFamily: FontFamily.sansRegular,
    fontSize: FontSize.sm,
    lineHeight: FontSize.sm * 1.6,
  },
  caption: {
    fontFamily: FontFamily.sansRegular,
    fontSize: FontSize.xs,
    lineHeight: FontSize.xs * 1.5,
    color: Colors.textSecondary,
  },
  label: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.sm,
    lineHeight: FontSize.sm * 1.4,
  },
});
