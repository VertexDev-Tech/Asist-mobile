export const theme = {
  colors: {
    // Official UBIX Web Color System
    primary: '#00D4FF', // Electric Cyan
    primaryDark: '#00A3CC',
    secondary: '#0F172A', // Midnight Slate
    background: '#0B0F19', // Deep Obsidian Dark
    surface: '#131C2E', // Glassmorphic Card Surface
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
    rose: '#EF4444',
    violet: '#8B5CF6',

    gradients: {
      primary: ['#00D4FF', '#0284C7'] as const,
      cyan: ['#00D4FF', '#38BDF8'] as const,
      emerald: ['#10B981', '#059669'] as const,
      amber: ['#F59E0B', '#D97706'] as const,
      rose: ['#EF4444', '#E11D48'] as const,
      darkCard: ['#131C2E', '#0F172A'] as const,
      buttonPrimary: ['#00D4FF', '#0284C7'] as const,
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 6,
    md: 12,
    lg: 18,
    xl: 24,
    full: 9999,
  },
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
  },
};
