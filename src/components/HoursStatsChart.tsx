import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme/theme';
import { HoursStatItem } from '../types';

interface HoursStatsChartProps {
  data: HoursStatItem[];
}

// Barras horizontales agrupadas (extras vs falta) por empleado, igual que el chart de la web.
export const HoursStatsChart: React.FC<HoursStatsChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.noDataText}>Sin horas extra ni faltas registradas este mes</Text>
      </View>
    );
  }

  const maxVal = Math.max(...data.map((d) => Math.max(d.extras || 0, d.falta || 0)), 1);

  return (
    <View style={styles.container}>
      {data.map((item, i) => (
        <View key={i} style={styles.row}>
          <Text style={styles.employeeName} numberOfLines={1}>
            {item.employee_name}
          </Text>
          <View style={styles.barsCol}>
            <View style={styles.barLine}>
              <View
                style={[
                  styles.bar,
                  { width: `${Math.max(4, (item.extras / maxVal) * 100)}%`, backgroundColor: theme.colors.emerald },
                ]}
              />
              <Text style={styles.barValue}>{item.extras.toFixed(1)}h</Text>
            </View>
            <View style={styles.barLine}>
              <View
                style={[
                  styles.bar,
                  { width: `${Math.max(4, (item.falta / maxVal) * 100)}%`, backgroundColor: theme.colors.rose },
                ]}
              />
              <Text style={styles.barValue}>{item.falta.toFixed(1)}h</Text>
            </View>
          </View>
        </View>
      ))}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.colors.emerald }]} />
          <Text style={styles.legendText}>Horas Extra</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.colors.rose }]} />
          <Text style={styles.legendText}>Horas Falta</Text>
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
    marginBottom: theme.spacing.lg,
  },
  noDataText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
  row: {
    marginBottom: theme.spacing.md,
  },
  employeeName: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  barsCol: {
    gap: 4,
  },
  barLine: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 14,
  },
  bar: {
    height: 8,
    borderRadius: 4,
    minWidth: 4,
  },
  barValue: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textMuted,
    marginLeft: 6,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: theme.spacing.sm,
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
