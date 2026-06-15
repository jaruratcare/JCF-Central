import { useTheme } from './themeContext';
import { CSSProperties } from 'react';

export const useThemedStyles = () => {
  const { colors } = useTheme();

  return {
    colors,
    // Common style objects for reuse
    styles: {
      backgroundMain: { backgroundColor: colors.background.main } as CSSProperties,
      backgroundSecondary: { backgroundColor: colors.background.secondary } as CSSProperties,
      backgroundTertiary: { backgroundColor: colors.background.tertiary } as CSSProperties,
      
      surfaceMain: { backgroundColor: colors.surface.main } as CSSProperties,
      surfaceSecondary: { backgroundColor: colors.surface.secondary } as CSSProperties,
      
      textPrimary: { color: colors.text.primary } as CSSProperties,
      textSecondary: { color: colors.text.secondary } as CSSProperties,
      textTertiary: { color: colors.text.tertiary } as CSSProperties,
      
      primaryButton: {
        backgroundColor: colors.primary.main,
        color: colors.primary.foreground,
      } as CSSProperties,
      
      primaryButtonHover: {
        backgroundColor: colors.primary.light,
        color: colors.primary.foreground,
      } as CSSProperties,
      
      cardStyle: {
        backgroundColor: colors.surface.main,
        borderColor: colors.border.light,
      } as CSSProperties,
      
      borderMain: { borderColor: colors.border.main } as CSSProperties,
      borderLight: { borderColor: colors.border.light } as CSSProperties,
    },
  };
};
