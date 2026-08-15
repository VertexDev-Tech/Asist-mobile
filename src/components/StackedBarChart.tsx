import React from 'react';
import { StyleSheet, Text, View, Dimensions } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { theme } from '../theme/theme';

interface StackedBarChartProps {
  data: { date?: string; day?: string | number; present?: number; late?: number; absent?: number }[];
  height?: number;
}

const { width } = Dimensions.get('window');

// Barras apiladas de 3 series (presentes/tardanzas/ausentes), igual que el gráfico semanal de la web.
export const StackedBarChart: React.FC<StackedBarChartProps> = ({ data, height = 200 }) => {
  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.noDataText}>Sin datos suficientes para mostrar gráfico</Text>
      </View>
    );
  }

  const chartWidth = width - 64;
  const barMargin = 10;
  const numBars = data.length;
  const barWidth = Math.max(10, (chartWidth - barMargin * (numBars + 1)) / numBars);
  const chartAreaHeight = height - 40;

  const maxVal = Math.max(
    ...data.map((d) => (d.present || 0) + (d.late || 0) + (d.absent || 0)),
    1,
  );

  return (
    <View style={styles.container}>
      <Svg width={chartWidth} height={height}>
        {data.map((d, i) => {
          const present = d.present || 0;
          const late = d.late || 0;
          const absent = d.absent || 0;
          const x = barMargin + i * (barWidth + barMargin);

          const presentH = (present / maxVal) * chartAreaHeight;
          const lateH = (late / maxVal) * chartAreaHeight;
          const absentH = (absent / maxVal) * chartAreaHeight;

          let yCursor = height - 30;
          const segments = [
            { h: presentH, color: theme.colors.emerald },
            { h: lateH, color: theme.colors.amber },
            { h: absentH, color: theme.colors.rose },
          ];

          return (
            <React.Fragment key={i}>
              {segments.map((seg, si) => {
                if (seg.h <= 0) return null;
                yCursor -= seg.h;
                return (
                  <Rect
                    key={si}
                    x={x}
                    y={yCursor}
                    width={barWidth}
                    height={seg.h}
                    rx={3}
                    ry={3}
                    fill={seg.color}
                  />
                );
              })}
            </React.Fragment>
          );
        })}
      </Svg>

      <View style={styles.labelsRow}>
        {data.map((d, i) => {
          const rawLabel = d.date ?? d.day ?? i + 1;
          return (
            <Text
              key={i}
              style={[styles.dayLabel, { width: barWidth + barMargin, textAlign: 'center' }]}
              numberOfLines={1}
            >
              {String(rawLabel).slice(0, 3).toUpperCase()}
            </Text>
          );
        })}
      </View>

      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.colors.emerald }]} />
          <Text style={styles.legendText}>Presentes</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.colors.amber }]} />
          <Text style={styles.legendText}>Tardanzas</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.colors.rose }]} />
          <Text style={styles.legendText}>Ausentes</Text>
        </View>
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
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
  },
  dayLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.colors.textMuted,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: theme.spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textMuted,
  },
});
