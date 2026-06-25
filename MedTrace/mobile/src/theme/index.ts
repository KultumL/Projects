export const Colors = {
  // Backgrounds
  backgroundWarm: '#efe7da',
  backgroundLight: '#f6efe3',
  // Surfaces
  surface: '#fbf7ef',
  // Borders
  border: '#cdbb9e',
  // Text
  textPrimary: '#4a3a28',
  textSecondary: '#8a7659',
  // Buttons
  buttonPrimary: '#6b5337',
  buttonPrimaryText: '#fbf7ef',
  // Selected / accent state
  accentFill: '#e3d2b6',
  accentBorder: '#a8895f',
  // Validation
  textError: '#b03a2e',
  borderError: '#c0634f',
} as const;

export const FontFamily = {
  // Serif — headings & branding
  serifRegular: 'PlayfairDisplay_400Regular',
  serifMedium: 'PlayfairDisplay_500Medium',
  serifBold: 'PlayfairDisplay_700Bold',
  serifItalic: 'PlayfairDisplay_400Regular_Italic',
  // Sans — body & UI
  sansRegular: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansSemiBold: 'Inter_600SemiBold',
  sansBold: 'Inter_700Bold',
} as const;

// Slightly large scale for accessibility (older users)
export const FontSize = {
  xs: 15,
  sm: 17,
  base: 19,
  md: 22,
  lg: 26,
  xl: 30,
  '2xl': 36,
  '3xl': 44,
} as const;

export const LineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.7,
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
} as const;

export const Radius = {
  sm: 6,
  md: 12,
  lg: 18,
  full: 9999,
} as const;
