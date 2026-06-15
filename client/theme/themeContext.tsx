import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { colorPalettes, ColorPaletteId } from './colorPalettes';

export type Theme = 'light' | 'dark';

export interface ThemeColors {
  // Primary branding colors
  primary: {
    main: string;
    light: string;
    dark: string;
    foreground: string;
  };
  secondary: {
    main: string;
    light: string;
    dark: string;
    foreground: string;
  };
  // Background colors
  background: {
    main: string;
    secondary: string;
    tertiary: string;
  };
  // Card/Surface colors
  surface: {
    main: string;
    secondary: string;
    hover: string;
    active: string;
  };
  // Text colors
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverse: string;
  };
  // Status colors
  success: string;
  warning: string;
  danger: string;
  info: string;
  // Border colors
  border: {
    main: string;
    light: string;
    dark: string;
  };
  // Semantic JCF colors (now standard neutral)
  jcf: {
    primaryGreen: string;
    secondaryGreen: string;
    softGreen: string;
    bgCream: string;
    cardWhite: string;
  };
}

export interface ThemeContextType {
  theme: Theme;
  palette: ColorPaletteId;
  colors: ThemeColors;
  setTheme: (theme: Theme) => void;
  setPalette: (palette: ColorPaletteId) => void;
}

function getColorsByPaletteAndTheme(palette: ColorPaletteId, theme: Theme): ThemeColors {
  const paletteColors = colorPalettes[palette];
  const mode = paletteColors[theme];

  return {
    primary: {
      main: mode.primary,
      light: mode.accent,
      dark: mode.primary,
      foreground: mode.primaryForeground,
    },
    secondary: {
      main: mode.secondary,
      light: mode.secondary,
      dark: mode.secondary,
      foreground: mode.secondaryForeground,
    },
    background: {
      main: mode.background,
      secondary: mode.muted,
      tertiary: mode.border,
    },
    surface: {
      main: theme === 'light' ? mode.background : mode.muted,
      secondary: mode.muted,
      hover: mode.accent,
      active: mode.border,
    },
    text: {
      primary: mode.foreground,
      secondary: mode.mutedForeground,
      tertiary: mode.mutedForeground,
      inverse: theme === 'light' ? '#000000' : '#FFFFFF',
    },
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: mode.primary,
    border: {
      main: mode.border,
      light: mode.border,
      dark: mode.foreground,
    },
    jcf: {
      primaryGreen: mode.primary,
      secondaryGreen: mode.secondary,
      softGreen: mode.accent,
      bgCream: mode.background,
      cardWhite: theme === 'light' ? mode.background : mode.muted,
    },
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem('jcf_theme');
    return (stored as Theme) || 'light';
  });

  const [palette, setPaletteState] = useState<ColorPaletteId>(() => {
    const stored = localStorage.getItem('jcf_palette');
    return (stored as ColorPaletteId) || 'neutral';
  });

  const colors = getColorsByPaletteAndTheme(palette, theme);

  useEffect(() => {
    localStorage.setItem('jcf_theme', theme);
    localStorage.setItem('jcf_palette', palette);
    document.documentElement.setAttribute('data-theme', theme);

    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Apply CSS variables for all colors
    applyThemeVariables(colors);
  }, [theme, palette, colors]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const setPalette = (newPalette: ColorPaletteId) => {
    setPaletteState(newPalette);
  };

  return (
    <ThemeContext.Provider value={{ theme, palette, colors, setTheme, setPalette }}>
      {children}
    </ThemeContext.Provider>
  );
};

function applyThemeVariables(colors: ThemeColors) {
  const root = document.documentElement;
  
  // Primary colors
  root.style.setProperty('--color-primary-main', colors.primary.main);
  root.style.setProperty('--color-primary-light', colors.primary.light);
  root.style.setProperty('--color-primary-dark', colors.primary.dark);
  root.style.setProperty('--color-primary-foreground', colors.primary.foreground);
  
  // Secondary colors
  root.style.setProperty('--color-secondary-main', colors.secondary.main);
  root.style.setProperty('--color-secondary-light', colors.secondary.light);
  root.style.setProperty('--color-secondary-dark', colors.secondary.dark);
  root.style.setProperty('--color-secondary-foreground', colors.secondary.foreground);
  
  // Background colors
  root.style.setProperty('--color-bg-main', colors.background.main);
  root.style.setProperty('--color-bg-secondary', colors.background.secondary);
  root.style.setProperty('--color-bg-tertiary', colors.background.tertiary);
  
  // Surface colors
  root.style.setProperty('--color-surface-main', colors.surface.main);
  root.style.setProperty('--color-surface-secondary', colors.surface.secondary);
  root.style.setProperty('--color-surface-hover', colors.surface.hover);
  root.style.setProperty('--color-surface-active', colors.surface.active);
  
  // Text colors
  root.style.setProperty('--color-text-primary', colors.text.primary);
  root.style.setProperty('--color-text-secondary', colors.text.secondary);
  root.style.setProperty('--color-text-tertiary', colors.text.tertiary);
  root.style.setProperty('--color-text-inverse', colors.text.inverse);
  
  // Status colors
  root.style.setProperty('--color-success', colors.success);
  root.style.setProperty('--color-warning', colors.warning);
  root.style.setProperty('--color-danger', colors.danger);
  root.style.setProperty('--color-info', colors.info);
  
  // Border colors
  root.style.setProperty('--color-border-main', colors.border.main);
  root.style.setProperty('--color-border-light', colors.border.light);
  root.style.setProperty('--color-border-dark', colors.border.dark);
  
  // JCF semantic colors
  root.style.setProperty('--color-jcf-primary-green', colors.jcf.primaryGreen);
  root.style.setProperty('--color-jcf-secondary-green', colors.jcf.secondaryGreen);
  root.style.setProperty('--color-jcf-soft-green', colors.jcf.softGreen);
  root.style.setProperty('--color-jcf-bg-cream', colors.jcf.bgCream);
  root.style.setProperty('--color-jcf-card-white', colors.jcf.cardWhite);
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
