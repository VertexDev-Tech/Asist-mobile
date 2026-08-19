export interface ThemeColors {
  primary: string;
  primaryDark: string;
  secondary: string;
  background: string;
  surface: string;
  surfaceHover: string;
  glass: string;
  glassBorder: string;

  textPrimary: string;
  textSecondary: string;
  textMuted: string;

  cyan: string;
  emerald: string;
  emeraldGlow: string;
  amber: string;
  orange: string;
  rose: string;
  violet: string;

  gradients: {
    primary: readonly [string, string, ...string[]];
    cyan: readonly [string, string, ...string[]];
    emerald: readonly [string, string, ...string[]];
    amber: readonly [string, string, ...string[]];
    orange: readonly [string, string, ...string[]];
    rose: readonly [string, string, ...string[]];
    darkCard: readonly [string, string, ...string[]];
    buttonPrimary: readonly [string, string, ...string[]];
    buttonOrange: readonly [string, string, ...string[]];
  };
}

export interface ThemeShadows {
  card: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  glowPrimary: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  glowEmerald: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  glowAmber: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
}

export interface Theme {
  isDark: boolean;
  colors: ThemeColors;
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    full: number;
  };
  shadows: ThemeShadows;
}

const sharedSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

const sharedBorderRadius = {
  sm: 6,
  md: 12,
  lg: 18,
  xl: 24,
  full: 9999,
};

export const darkTheme: Theme = {
  isDark: true,
  colors: {
    primary: '#00D4FF',
    primaryDark: '#00A3CC',
    secondary: '#0F172A',
    background: '#0B0F19',
    surface: '#131C2E',
    surfaceHover: '#1E293B',
    glass: 'rgba(19, 28, 46, 0.85)',
    glassBorder: 'rgba(0, 212, 255, 0.15)',

    textPrimary: '#FFFFFF',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',

    cyan: '#00D4FF',
    emerald: '#10B981',
    emeraldGlow: '#86EFAC',
    amber: '#F59E0B',
    orange: '#FF6B00',
    rose: '#EF4444',
    violet: '#8B5CF6',

    gradients: {
      primary: ['#00D4FF', '#0284C7'] as const,
      cyan: ['#00D4FF', '#38BDF8'] as const,
      emerald: ['#10B981', '#059669'] as const,
      amber: ['#FF6B00', '#F97316', '#EA580C'] as const,
      orange: ['#FF6B00', '#FF8E53', '#EA580C'] as const,
      rose: ['#EF4444', '#E11D48'] as const,
      darkCard: ['#131C2E', '#0F172A'] as const,
      buttonPrimary: ['#00D4FF', '#0284C7'] as const,
      buttonOrange: ['#FF6B00', '#EA580C'] as const,
    },
  },
  spacing: sharedSpacing,
  borderRadius: sharedBorderRadius,
  shadows: {
    card: {
      shadowColor: '#00D4FF',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 6,
    },
    glowPrimary: {
      shadowColor: '#00D4FF',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.45,
      shadowRadius: 18,
      elevation: 8,
    },
    glowEmerald: {
      shadowColor: '#10B981',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.45,
      shadowRadius: 18,
      elevation: 8,
    },
    glowAmber: {
      shadowColor: '#FF6B00',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.55,
      shadowRadius: 20,
      elevation: 10,
    },
  },
};

export const lightTheme: Theme = {
  isDark: false,
  colors: {
    primary: '#0284C7',
    primaryDark: '#0369A1',
    secondary: '#F1F5F9',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceHover: '#F1F5F9',
    glass: 'rgba(255, 255, 255, 0.95)',
    glassBorder: 'rgba(226, 232, 240, 0.95)',

    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',

    cyan: '#0284C7',
    emerald: '#059669',
    emeraldGlow: '#34D399',
    amber: '#EA580C',
    orange: '#FF6B00',
    rose: '#DC2626',
    violet: '#7C3AED',

    gradients: {
      primary: ['#0284C7', '#0369A1'] as const,
      cyan: ['#38BDF8', '#0284C7'] as const,
      emerald: ['#10B981', '#059669'] as const,
      amber: ['#FF6B00', '#F97316', '#EA580C'] as const,
      orange: ['#FF6B00', '#FF8E53', '#EA580C'] as const,
      rose: ['#EF4444', '#DC2626'] as const,
      darkCard: ['#FFFFFF', '#F8FAFC'] as const,
      buttonPrimary: ['#0284C7', '#0369A1'] as const,
      buttonOrange: ['#FF6B00', '#EA580C'] as const,
    },
  },
  spacing: sharedSpacing,
  borderRadius: sharedBorderRadius,
  shadows: {
    card: {
      shadowColor: '#64748B',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 3,
    },
    glowPrimary: {
      shadowColor: '#0284C7',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 14,
      elevation: 6,
    },
    glowEmerald: {
      shadowColor: '#059669',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 14,
      elevation: 6,
    },
    glowAmber: {
      shadowColor: '#EA580C',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 16,
      elevation: 8,
    },
  },
};

// Default export for backward compatibility
export const theme = darkTheme;
