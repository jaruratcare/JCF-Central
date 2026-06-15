export type ColorPaletteId = 'neutral' | 'blue' | 'purple' | 'emerald' | 'amber' | 'rose';

export interface PaletteColors {
  light: {
    background: string;
    foreground: string;
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    accent: string;
    accentForeground: string;
    border: string;
    muted: string;
    mutedForeground: string;
  };
  dark: {
    background: string;
    foreground: string;
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    accent: string;
    accentForeground: string;
    border: string;
    muted: string;
    mutedForeground: string;
  };
}

export const colorPalettes: Record<ColorPaletteId, PaletteColors> = {
  neutral: {
    light: {
      background: '#FFFFFF',
      foreground: '#000000',
      primary: '#1F2937',
      primaryForeground: '#FFFFFF',
      secondary: '#6B7280',
      secondaryForeground: '#FFFFFF',
      accent: '#374151',
      accentForeground: '#FFFFFF',
      border: '#E5E7EB',
      muted: '#F3F4F6',
      mutedForeground: '#6B7280',
    },
    dark: {
      background: '#0F172A',
      foreground: '#F9FAFB',
      primary: '#E5E7EB',
      primaryForeground: '#0F172A',
      secondary: '#D1D5DB',
      secondaryForeground: '#0F172A',
      accent: '#F3F4F6',
      accentForeground: '#0F172A',
      border: '#1F2937',
      muted: '#1F2937',
      mutedForeground: '#9CA3AF',
    },
  },
  blue: {
    light: {
      background: '#F0F9FF',
      foreground: '#0C2340',
      primary: '#0B5ED7',
      primaryForeground: '#FFFFFF',
      secondary: '#0D6EFD',
      secondaryForeground: '#FFFFFF',
      accent: '#0056B3',
      accentForeground: '#FFFFFF',
      border: '#BEE5EB',
      muted: '#D9E7F0',
      mutedForeground: '#06357A',
    },
    dark: {
      background: '#001F3F',
      foreground: '#E7F1FF',
      primary: '#4D94FF',
      primaryForeground: '#001F3F',
      secondary: '#66AEFF',
      secondaryForeground: '#001F3F',
      accent: '#80BFFF',
      accentForeground: '#001F3F',
      border: '#0C4C99',
      muted: '#084099',
      mutedForeground: '#99CCFF',
    },
  },
  purple: {
    light: {
      background: '#FAF5FF',
      foreground: '#3F0F5C',
      primary: '#7C3AED',
      primaryForeground: '#FFFFFF',
      secondary: '#A855F7',
      secondaryForeground: '#FFFFFF',
      accent: '#6D28D9',
      accentForeground: '#FFFFFF',
      border: '#E9D5FF',
      muted: '#F3E8FF',
      mutedForeground: '#5B21B6',
    },
    dark: {
      background: '#2D0B4D',
      foreground: '#F3E8FF',
      primary: '#C084FC',
      primaryForeground: '#2D0B4D',
      secondary: '#D8B4FE',
      secondaryForeground: '#2D0B4D',
      accent: '#E9D5FF',
      accentForeground: '#2D0B4D',
      border: '#6B21A8',
      muted: '#5B21B6',
      mutedForeground: '#E5B8FF',
    },
  },
  emerald: {
    light: {
      background: '#F0FDF4',
      foreground: '#064E3B',
      primary: '#059669',
      primaryForeground: '#FFFFFF',
      secondary: '#10B981',
      secondaryForeground: '#FFFFFF',
      accent: '#047857',
      accentForeground: '#FFFFFF',
      border: '#A7F3D0',
      muted: '#D1FAE5',
      mutedForeground: '#065F46',
    },
    dark: {
      background: '#0D3B2D',
      foreground: '#D1FAE5',
      primary: '#6EE7B7',
      primaryForeground: '#0D3B2D',
      secondary: '#A7F3D0',
      secondaryForeground: '#0D3B2D',
      accent: '#6EE7B7',
      accentForeground: '#0D3B2D',
      border: '#047857',
      muted: '#065F46',
      mutedForeground: '#6EE7B7',
    },
  },
  amber: {
    light: {
      background: '#FFFBEB',
      foreground: '#78350F',
      primary: '#D97706',
      primaryForeground: '#FFFFFF',
      secondary: '#F59E0B',
      secondaryForeground: '#FFFFFF',
      accent: '#B45309',
      accentForeground: '#FFFFFF',
      border: '#FED7AA',
      muted: '#FEF3C7',
      mutedForeground: '#92400E',
    },
    dark: {
      background: '#4D2900',
      foreground: '#FEF3C7',
      primary: '#FBBF24',
      primaryForeground: '#4D2900',
      secondary: '#FCD34D',
      secondaryForeground: '#4D2900',
      accent: '#FEF08A',
      accentForeground: '#4D2900',
      border: '#B45309',
      muted: '#92400E',
      mutedForeground: '#FCD34D',
    },
  },
  rose: {
    light: {
      background: '#FFF5F7',
      foreground: '#831843',
      primary: '#E11D48',
      primaryForeground: '#FFFFFF',
      secondary: '#F43F5E',
      secondaryForeground: '#FFFFFF',
      accent: '#BE123C',
      accentForeground: '#FFFFFF',
      border: '#FBCFE8',
      muted: '#FCE7F3',
      mutedForeground: '#A30E49',
    },
    dark: {
      background: '#500724',
      foreground: '#FCE7F3',
      primary: '#FB7185',
      primaryForeground: '#500724',
      secondary: '#FF90A8',
      secondaryForeground: '#500724',
      accent: '#FCA5C0',
      accentForeground: '#500724',
      border: '#BE123C',
      muted: '#831843',
      mutedForeground: '#FCA5C0',
    },
  },
};

export const paletteNames: Record<ColorPaletteId, string> = {
  neutral: 'Neutral (Black & White)',
  blue: 'Blue',
  purple: 'Purple',
  emerald: 'Emerald',
  amber: 'Amber',
  rose: 'Rose',
};
