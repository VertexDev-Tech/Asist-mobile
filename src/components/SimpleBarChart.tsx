import React, { useMemo } from 'react';
import { StyleSheet, Text, View, Dimensions } from 'react-native';
import Svg, { Rect, LinearGradient, Defs, Stop } from 'react-native-svg';
import { Theme } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';

interface SimpleBarChartProps {
  data: any[];
  height?: number;
}

const { width } = Dimensions.get('window');

export const SimpleBarChart: React.FC<SimpleBarChartProps> = ({
  data,
  height = 180,
}) => {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.noDataText}>Sin datos suficientes para mostrar gráfico</Text>
      </View>
    );
  }

  const chartWidth = width - 64;
  const barMargin = 8;
  const numBars = data.length;
  const barWidth = Math.max(6, (chartWidth - barMargin * (numBars + 1)) / numBars);

  const maxVal = Math.max(
    ...data.map((d) => {
      if (typeof d.punctuality_percent === 'number') return d.punctuality_percent;
      return (d.onTime || 0) + (d.late || 0) + (d.absent || 0);
    }),
    1,
  );

  return (
    <View style={styles.container}>
      <Svg width={chartWidth} height={height}>
        <Defs>
          <LinearGradient id="gradientOnTime" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={theme.colors.emerald} stopOpacity="1" />
            <Stop offset="1" stopColor="#059669" stopOpacity="0.8" />
          </LinearGradient>
          <LinearGradient id="gradientLate" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={theme.colors.orange} stopOpacity="1" />
            <Stop offset="1" stopColor="#D97706" stopOpacity="0.8" />
          </LinearGradient>
        </Defs>

        {data.map((d, i) => {
          const val =
            typeof d.punctuality_percent === 'number'
              ? d.punctuality_percent
              : (d.onTime || 0) + (d.late || 0);
          const barHeight = Math.max(6, (val / maxVal) * (height - 40));
          const x = barMargin + i * (barWidth + barMargin);
          const y = height - 30 - barHeight;

          return (
            <Rect
              key={i}
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={4}
              ry={4}
              fill={d.late > 0 ? 'url(#gradientLate)' : 'url(#gradientOnTime)'}
            />
          );
        })}
      </Svg>

      {/* Day Labels */}
      <View style={styles.labelsRow}>
        {data.map((d, i) => {
          const rawLabel = d.day ?? d.dia ?? d.fecha ?? i + 1;
          const labelStr = String(rawLabel);
          return (
            <Text
              key={i}
              style={[styles.dayLabel, { width: barWidth + barMargin, textAlign: 'center' }]}
              numberOfLines={1}
            >
              {labelStr.slice(0, 3).toUpperCase()}
            </Text>
          );
        })}
      </View>
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
    labelsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      marginTop: 8,
    },
    dayLabel: {
      fontSize: 9,
      fontWeight: '700',
      color: theme.colors.textMuted,
    },
  });
