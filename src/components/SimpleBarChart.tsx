import React from 'react';
import { StyleSheet, Text, View, Dimensions } from 'react-native';
import Svg, { Rect, LinearGradient, Defs, Stop } from 'react-native-svg';
import { theme } from '../theme/theme';

interface SimpleBarChartProps {
  data: any[];
  height?: number;
}

const { width } = Dimensions.get('window');

export const SimpleBarChart: React.FC<SimpleBarChartProps> = ({
  data,
  height = 175,
}) => {
  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.noDataText}>Sin datos suficientes para mostrar gráfico</Text>
      </View>
    );
  }

  const chartWidth = width - 64;
  const numBars = data.length;
  const barMargin = Math.max(6, (chartWidth - numBars * 32) / (numBars + 1));
  const pillarWidth = Math.min(36, Math.max(22, (chartWidth - barMargin * (numBars + 1)) / numBars));
  const pillarHeight = height - 55;
  const pillarY = 10;

  return (
    <View style={styles.container}>
      <Svg width={chartWidth} height={height - 25}>
        <Defs>
          {/* Bright Cyan / Electric Blue Gradient (Web style) */}
          <LinearGradient id="gradientCyan" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#00D2FF" stopOpacity="1" />
            <Stop offset="100%" stopColor="#06B6D4" stopOpacity="0.9" />
          </LinearGradient>

          {/* Warm Amber / Orange Gradient (Web style) */}
          <LinearGradient id="gradientLate" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#FFA726" stopOpacity="1" />
            <Stop offset="100%" stopColor="#F59E0B" stopOpacity="0.9" />
          </LinearGradient>

          {/* Rose Red Gradient */}
          <LinearGradient id="gradientAbsent" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#F87171" stopOpacity="1" />
            <Stop offset="100%" stopColor="#EF4444" stopOpacity="0.9" />
          </LinearGradient>
        </Defs>

        {data.map((d, i) => {
          const x = barMargin + i * (pillarWidth + barMargin);
          const hPercent = d.heightPercent ?? (d.late > 0 ? 0.3 : d.absent > 0 ? 0.15 : 0.55);
          const barHeight = Math.max(14, Math.min(pillarHeight - 6, pillarHeight * hPercent));

          // Position inside the pillar track
          const posOffset = d.positionOffset ?? 0.2;
          const maxTravel = pillarHeight - barHeight - 6;
          const barY = pillarY + 3 + maxTravel * Math.min(1, Math.max(0, posOffset));

          const fillGradient =
            d.absent > 0
              ? 'url(#gradientAbsent)'
              : d.late > 0
              ? 'url(#gradientLate)'
              : 'url(#gradientCyan)';

          return (
            <React.Fragment key={i}>
              {/* Background Pillar Track (Capsule Shape) */}
              <Rect
                x={x}
                y={pillarY}
                width={pillarWidth}
                height={pillarHeight}
                rx={10}
                ry={10}
                fill="rgba(255, 255, 255, 0.07)"
              />

              {/* Inner Colored Active Bar */}
              <Rect
                x={x + 3}
                y={barY}
                width={pillarWidth - 6}
                height={barHeight}
                rx={6}
                ry={6}
                fill={fillGradient}
              />
            </React.Fragment>
          );
        })}
      </Svg>

      {/* Day Labels below pillars */}
      <View style={[styles.labelsRow, { width: chartWidth }]}>
        {data.map((d, i) => {
          const rawLabel = d.day ?? d.dia ?? d.fecha ?? i + 1;
          const labelStr = String(rawLabel);
          const xCenter = barMargin + i * (pillarWidth + barMargin);
          return (
            <Text
              key={i}
              style={[
                styles.dayLabel,
                {
                  position: 'absolute',
                  left: xCenter,
                  width: pillarWidth,
                  textAlign: 'center',
                },
              ]}
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

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.glassBorder,
    borderWidth: 1,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
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
    height: 20,
    marginTop: 4,
    position: 'relative',
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textMuted,
  },
});
