import React from 'react';
import { StyleSheet, Text, View, Dimensions } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { theme } from '../theme/theme';
import { HourlyStat } from '../types';

interface HourlyDistributionChartProps {
  data: HourlyStat[];
  height?: number;
}

const { width } = Dimensions.get('window');

export const HourlyDistributionChart: React.FC<HourlyDistributionChartProps> = ({
  data,
  height = 160,
}) => {
  if (!data || data.length === 0 || data.every((d) => !d.count)) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.noDataText}>Aún no hay marcaciones registradas hoy</Text>
      </View>
    );
  }

  const chartWidth = width - 64;
  const barMargin = 2;
  const numBars = data.length;
  const barWidth = Math.max(3, (chartWidth - barMargin * (numBars + 1)) / numBars);
  const chartAreaHeight = height - 34;
  const maxVal = Math.max(...data.map((d) => d.count || 0), 1);

  return (
    <View style={styles.container}>
      <Svg width={chartWidth} height={height}>
        {data.map((d, i) => {
          const barHeight = d.count > 0 ? Math.max(3, (d.count / maxVal) * chartAreaHeight) : 0;
          const x = barMargin + i * (barWidth + barMargin);
          const y = height - 24 - barHeight;
          return (
            <Rect
              key={i}
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={2}
              ry={2}
              fill={theme.colors.cyan}
            />
          );
        })}
      </Svg>
      <View style={styles.labelsRow}>
        {data.map((d, i) => (
          <Text
            key={i}
            style={[styles.hourLabel, { width: barWidth + barMargin }]}
            numberOfLines={1}
          >
            {i % 3 === 0 ? d.hour.replace(':00', 'h') : ''}
          </Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.glassBorder,
    borderWidth: 1,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  noDataText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    alignSelf: 'center',
    marginVertical: 'auto',
  },
  labelsRow: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 4,
  },
  hourLabel: {
    fontSize: 7,
    fontWeight: '700',
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
});
