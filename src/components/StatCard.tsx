import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MotiView } from 'moti';
import { Theme } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  accentColor: string;
  subtitle?: string;
  delay?: number;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  accentColor,
  subtitle,
  delay = 0,
}) => {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  return (
    <MotiView
      from={{ opacity: 0, translateY: 15 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 450, delay }}
      style={styles.card}
    >
      <View style={styles.headerRow}>
        <View style={[styles.iconBox, { backgroundColor: `${accentColor}18` }]}>
          {icon}
        </View>
        <Text style={[styles.titleText, { color: theme.colors.textMuted }]}>
          {title}
        </Text>
      </View>

      <Text style={[styles.valueText, { color: theme.colors.textPrimary }]}>
        {value}
      </Text>

      {subtitle && (
        <Text style={[styles.subtitleText, { color: accentColor }]}>
          {subtitle}
        </Text>
      )}
    </MotiView>
  );
};

const createStyles = (theme: Theme, isDark: boolean) =>
  StyleSheet.create({
    card: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.glassBorder,
      borderWidth: 1,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      ...theme.shadows.card,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: theme.spacing.sm,
    },
    iconBox: {
      width: 32,
      height: 32,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    titleText: {
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    valueText: {
      fontSize: 24,
      fontWeight: '800',
      marginTop: 2,
    },
    subtitleText: {
      fontSize: 11,
      fontWeight: '600',
      marginTop: 4,
    },
  });
