import React, { useMemo } from 'react';
import { StyleSheet, Text, View, Dimensions } from 'react-native';
import Svg, { Rect, LinearGradient, Defs, Stop } from 'react-native-svg';
import { Theme } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';
import { HourlyCount } from '../types';

interface HourlyBarChartProps {
  data: HourlyCount[];
  height?: number;
}

const { width } = Dimensions.get('window');

export const HourlyBarChart: React.FC<HourlyBarChartProps> = ({ data, height = 160 }) => {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const total = data.reduce((acc, d) => acc + (d.count || 0), 0);
  if (!data || data.length === 0 || total === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.noDataText}>Aún no hay marcaciones registradas hoy</Text>
      </View>
    );
  }

  const chartWidth = width - 64;
  const gap = 3;
  const barWidth = (chartWidth - gap * (data.length + 1)) / data.length;
  const maxVal = Math.max(...data.map((d) => d.count || 0), 1);
  const plotHeight = height - 20;

  return (
    <View style={styles.container}>
      <Svg width={chartWidth} height={height}>
        <Defs>
          <LinearGradient id="gradientHourly" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={theme.colors.cyan} stopOpacity="1" />
            <Stop offset="1" stopColor={theme.colors.cyan} stopOpacity="0.25" />
          </LinearGradient>
        </Defs>
        {data.map((d, i) => {
          const count = d.count || 0;
          const barHeight = count > 0 ? Math.max(4, (count / maxVal) * plotHeight) : 2;
          return (
            <Rect
              key={i}
              x={gap + i * (barWidth + gap)}
              y={plotHeight - barHeight + 10}
              width={barWidth}
              height={barHeight}
              rx={2}
              ry={2}
              fill={count > 0 ? 'url(#gradientHourly)' : theme.colors.glassBorder}
            />
          );
        })}
      </Svg>
      <View style={styles.labelsRow}>
        {data.map((d, i) => (
          <Text key={i} style={[styles.hourLabel, { width: barWidth + gap }]} numberOfLines={1}>
            {i % 3 === 0 ? String(parseInt(d.hour, 10)) : ''}
          </Text>
        ))}
      </View>
      <Text style={styles.caption}>
        {total} marcaciones hoy · pico a las {data.reduce((a, b) => (b.count > a.count ? b : a)).hour}
      </Text>
    </View>
  );
};

const createStyles = (theme: Theme, isDark: boolean) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.glassBorder,
      borderWidth: 1,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
      ...theme.shadows.card,
    },
    noDataText: {
      color: theme.colors.textMuted,
      fontSize: 13,
      alignSelf: 'center',
      marginVertical: 'auto',
    },
    labelsRow: { flexDirection: 'row', width: '100%', marginTop: 4 },
    hourLabel: { fontSize: 9, fontWeight: '700', color: theme.colors.textMuted, textAlign: 'center' },
    caption: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 8 },
  });
