import React, { useEffect, useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MotiView } from 'moti';
import { Theme } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';
import { attendanceApi } from '../services/api';

import { Clock, AlertTriangle, Flame } from 'lucide-react-native';

const DAYS_SHORT = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
const DAYS_SINGLE = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

export const HistoryScreen = () => {
  const { theme, isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [historyData, setHistoryData] = useState<any>(null);
  const [hoursStats, setHoursStats] = useState<any>(null);

  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [hData, hsData] = await Promise.all([
        attendanceApi.getHistory().catch(() => null),
        attendanceApi.getMyStats().catch(() => null),
      ]);
      setHistoryData(hData);
      setHoursStats(hsData);
    } catch (e) {
      console.log('Error loading history data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const records = useMemo(() => {
    if (!historyData) return [];
    return Array.isArray(historyData)
      ? historyData
      : historyData.entries || historyData.data || historyData.records || [];
  }, [historyData]);

  // Cálculos para el gráfico de los últimos 7 días idéntico a la web
  const chartBars = useMemo(() => {
    if (!records || records.length === 0) return [];
    const sliceData = records.slice(0, 7).reverse();

    const MIN_H = 6;
    const MAX_H = 22;
    const RANGE = MAX_H - MIN_H;

    return sliceData.map((r: any, idx: number) => {
      let h1 = 0;
      let h2 = 0;
      let expH1 = 0;
      let expH2 = 0;

      if (r.horaEsperadaEntrada) {
        const [h, m] = r.horaEsperadaEntrada.split(':').map(Number);
        expH1 = (h || 0) + (m || 0) / 60;
      }
      if (r.horaEsperadaSalida) {
        const [h, m] = r.horaEsperadaSalida.split(':').map(Number);
        expH2 = (h || 0) + (m || 0) / 60;
      }

      if (r.horaEntrada) {
        const [h, m] = r.horaEntrada.split(':').map(Number);
        h1 = (h || 0) + (m || 0) / 60;
      }
      if (r.horaSalida) {
        const [h, m] = r.horaSalida.split(':').map(Number);
        h2 = (h || 0) + (m || 0) / 60;
      }

      let topPct = 0;
      let heightPct = 0;
      let expTopPct = 0;
      let expHeightPct = 0;

      if (expH1 > 0 && expH2 > 0) {
        const startY = Math.max(0, ((expH1 - MIN_H) / RANGE) * 100);
        const endY = Math.min(100, ((expH2 - MIN_H) / RANGE) * 100);
        expTopPct = startY;
        expHeightPct = Math.max(2, endY - startY);
      }

      if (h1 > 0 && h2 > 0) {
        const startY = Math.max(0, ((h1 - MIN_H) / RANGE) * 100);
        const endY = Math.min(100, ((h2 - MIN_H) / RANGE) * 100);
        topPct = startY;
        heightPct = Math.max(3, endY - startY);
      } else if (h1 > 0) {
        const startY = Math.max(0, ((h1 - MIN_H) / RANGE) * 100);
        topPct = startY;
        heightPct = 12; // Barra pequeña si no hay salida
      }

      let dayLetter = '—';
      if (r.fecha) {
        const [yy, mm, dd] = String(r.fecha).split('-');
        if (yy && mm && dd) {
          const d = new Date(Number(yy), Number(mm) - 1, Number(dd));
          dayLetter = DAYS_SINGLE[d.getDay()] || '—';
        }
      }

      const isLate = r.estado === 'tarde';
      const isAbsent = !r.horaEntrada;

      return {
        id: idx,
        dayLetter,
        expTopPct,
        expHeightPct,
        topPct,
        heightPct,
        isLate,
        isAbsent,
      };
    });
  }, [records]);

  // Cálculos para las barras de progreso del Balance de Horas
  const maxBalance = Math.max(
    Number(hoursStats?.extras || 0),
    Number(hoursStats?.falta || 0),
    Number(hoursStats?.tardanza || 0),
    0.01,
  );
  const extrasPct = Math.min(100, Math.round(((hoursStats?.extras || 0) / maxBalance) * 100));
  const faltaPct = Math.min(100, Math.round(((hoursStats?.falta || 0) / maxBalance) * 100));
  const tardanzaPct = Math.min(100, Math.round(((hoursStats?.tardanza || 0) / maxBalance) * 100));

  const renderHeader = () => (
    <View>
      {/* Title & Subtitle */}
      <MotiView
        from={{ opacity: 0, translateY: -10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400 }}
      >
        <Text style={styles.title}>Mi Historial</Text>
        <Text style={styles.subtitle}>Últimos 30 días</Text>
      </MotiView>

      {/* Top 3 KPI Stats Grid with Icons */}
      <View style={styles.statsRow}>
        <MotiView
          from={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 350, delay: 50 }}
          style={styles.statCard}
        >
          <Clock color={theme.colors.cyan} size={22} style={styles.statIcon} />
          <Text style={[styles.statNumber, { color: theme.colors.cyan }]}>
            {historyData?.onTime ?? '—'}
          </Text>
          <Text style={styles.statLabel}>PUNTUALES</Text>
        </MotiView>

        <MotiView
          from={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 350, delay: 100 }}
          style={styles.statCard}
        >
          <AlertTriangle color={theme.colors.orange} size={22} style={styles.statIcon} />
          <Text style={[styles.statNumber, { color: theme.colors.orange }]}>
            {historyData?.late ?? '—'}
          </Text>
          <Text style={styles.statLabel}>TARDANZAS</Text>
        </MotiView>

        <MotiView
          from={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 350, delay: 150 }}
          style={styles.statCard}
        >
          <Flame color={theme.colors.textMuted} size={22} style={styles.statIcon} />
          <Text style={[styles.statNumber, { color: theme.colors.textMuted }]}>
            {historyData?.missed ?? 0}
          </Text>
          <Text style={styles.statLabel}>FALTAS</Text>
        </MotiView>
      </View>

      {/* Gráfico Semanal "Últimos 7 días" */}
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400, delay: 200 }}
        style={styles.chartCard}
      >
        <Text style={styles.chartTitle}>Últimos 7 días</Text>
        <View style={styles.chartContainer}>
          {chartBars.map((bar: any) => (
            <View key={bar.id} style={styles.chartCol}>
              <View style={styles.barTrack}>
                {/* Expected schedule background bar */}
                {bar.expHeightPct > 0 && (
                  <View
                    style={[
                      styles.barExpected,
                      {
                        top: `${bar.expTopPct}%`,
                        height: `${bar.expHeightPct}%`,
                      },
                    ]}
                  />
                )}
                {/* Actual worked bar */}
                {!bar.isAbsent && bar.heightPct > 0 && (
                  <View
                    style={[
                      styles.barActual,
                      {
                        top: `${bar.topPct}%`,
                        height: `${bar.heightPct}%`,
                        backgroundColor: bar.isLate ? theme.colors.orange : theme.colors.cyan,
                      },
                    ]}
                  />
                )}
              </View>
              <Text style={styles.chartDayLabel}>{bar.dayLetter}</Text>
            </View>
          ))}
        </View>
      </MotiView>

      {/* Balance de Horas del Mes Actual */}
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400, delay: 250 }}
        style={styles.balanceCard}
      >
        <Text style={styles.balanceTitle}>📅 BALANCE DEL MES ACTUAL</Text>

        {/* Horas Extras */}
        <View style={styles.balanceRow}>
          <View style={styles.balanceMeta}>
            <Text style={styles.balanceLabel}>⬆️ Horas Extras</Text>
            <Text style={styles.balanceValue}>{hoursStats?.extras_fmt || '0h 00m'}</Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: theme.colors.emerald,
                  width: `${hoursStats?.extras ? Math.max(6, extrasPct) : 0}%`,
                },
              ]}
            />
          </View>
        </View>

        {/* Horas Falta */}
        <View style={styles.balanceRow}>
          <View style={styles.balanceMeta}>
            <Text style={styles.balanceLabel}>⬇️ Horas Falta</Text>
            <Text style={styles.balanceValue}>{hoursStats?.falta_fmt || '0h 00m'}</Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: theme.colors.rose,
                  width: `${hoursStats?.falta ? Math.max(6, faltaPct) : 0}%`,
                },
              ]}
            />
          </View>
        </View>

        {/* Tardanzas */}
        <View style={[styles.balanceRow, { marginBottom: 0 }]}>
          <View style={styles.balanceMeta}>
            <Text style={styles.balanceLabel}>⏰ Tardanzas</Text>
            <Text style={styles.balanceValue}>{hoursStats?.tardanza_fmt || '0h 00m'}</Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: theme.colors.orange,
                  width: `${hoursStats?.tardanza ? Math.max(6, tardanzaPct) : 0}%`,
                },
              ]}
            />
          </View>
        </View>
      </MotiView>
    </View>
  );

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const checkIn = item.horaEntrada || null;
    const checkOut = item.horaSalida || null;
    const isLate = item.estado === 'tarde';
    const noMark = !checkIn;

    let dayNum = '—';
    let dayName = '—';
    if (item.fecha) {
      const [yy, mm, dd] = String(item.fecha).split('-');
      if (yy && mm && dd) {
        const d = new Date(Number(yy), Number(mm) - 1, Number(dd));
        dayNum = String(d.getDate());
        dayName = DAYS_SHORT[d.getDay()] || '—';
      }
    }

    // Badge styling matching the web app
    let badgeText = '✅ A tiempo';
    let badgeBg = isDark ? 'rgba(16, 185, 129, 0.18)' : '#DCFCE7';
    let badgeTextColor = isDark ? theme.colors.emerald : '#166534';

    if (noMark) {
      badgeText = 'Sin marcar';
      badgeBg = isDark ? 'rgba(255, 255, 255, 0.08)' : '#F3F4F6';
      badgeTextColor = isDark ? theme.colors.textMuted : '#6B7280';
    } else if (isLate) {
      badgeText = '⏰ Tarde';
      badgeBg = isDark ? 'rgba(245, 158, 11, 0.18)' : '#FEF3C7';
      badgeTextColor = isDark ? theme.colors.orange : '#92400E';
    } else if (!checkOut) {
      badgeText = '🟡 Incompleto';
      badgeBg = isDark ? 'rgba(245, 158, 11, 0.18)' : '#FEF3C7';
      badgeTextColor = isDark ? theme.colors.orange : '#92400E';
    }

    return (
      <MotiView
        from={{ opacity: 0, translateY: 8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 300, delay: index * 25 }}
        style={styles.histRow}
      >
        {/* Date Box */}
        <View style={styles.dateBox}>
          <Text style={styles.dayNum}>{dayNum}</Text>
          <Text style={styles.dayName}>{dayName}</Text>
        </View>

        {/* Times Breakdown */}
        <View style={styles.timesCol}>
          <View style={styles.timeLine}>
            <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.timeLabel}>Entrada: </Text>
            <Text style={styles.timeValue}>{checkIn || '—'}</Text>
          </View>

          <View style={styles.timeLine}>
            <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.timeLabel}>Salida: </Text>
            <Text style={styles.timeValue}>{checkOut || '—'}</Text>
          </View>
        </View>

        {/* Status Badge */}
        <View style={[styles.badge, { backgroundColor: badgeBg }]}>
          <Text style={[styles.badgeText, { color: badgeTextColor }]}>{badgeText}</Text>
        </View>
      </MotiView>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.cyan} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.listContent}
      data={records}
      keyExtractor={(item, index) => String(item.id || item.fecha || index)}
      ListHeaderComponent={renderHeader}
      renderItem={renderItem}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Sin registros de marcación en este período.</Text>
        </View>
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadData();
          }}
          tintColor={theme.colors.cyan}
        />
      }
    />
  );
};

const createStyles = (theme: Theme, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    listContent: {
      padding: theme.spacing.lg,
      paddingTop: theme.spacing.xl,
      paddingBottom: theme.spacing.xxl,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    title: {
      fontSize: 26,
      fontWeight: '900',
      color: theme.colors.textPrimary,
    },
    subtitle: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.lg,
      marginTop: 2,
    },

    // KPI Stats Row
    statsRow: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.lg,
    },
    statCard: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.glassBorder,
      borderWidth: 1,
      borderRadius: theme.borderRadius.xl,
      paddingVertical: 18,
      paddingHorizontal: 8,
      alignItems: 'center',
      justifyContent: 'center',
      ...theme.shadows.card,
    },
    statIcon: {
      marginBottom: 6,
    },
    statNumber: {
      fontSize: 26,
      fontWeight: '900',
    },
    statLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: theme.colors.textMuted,
      marginTop: 4,
      letterSpacing: 0.5,
    },

    // Chart Card
    chartCard: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.glassBorder,
      borderWidth: 1,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
      ...theme.shadows.card,
    },
    chartTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: theme.colors.textPrimary,
      marginBottom: 16,
    },
    chartContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'stretch',
      height: 120,
      gap: 8,
    },
    chartCol: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    barTrack: {
      flex: 1,
      width: '100%',
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9',
      borderRadius: 6,
      position: 'relative',
      overflow: 'hidden',
    },
    barExpected: {
      position: 'absolute',
      width: '100%',
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
      borderRadius: 4,
    },
    barActual: {
      position: 'absolute',
      width: '100%',
      borderRadius: 4,
      opacity: 0.9,
      zIndex: 2,
    },
    chartDayLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.colors.textSecondary,
      marginTop: 8,
      textAlign: 'center',
    },

    // Balance Card
    balanceCard: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.glassBorder,
      borderWidth: 1,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
      ...theme.shadows.card,
    },
    balanceTitle: {
      fontSize: 12,
      fontWeight: '800',
      color: theme.colors.textPrimary,
      letterSpacing: 0.8,
      marginBottom: theme.spacing.md,
    },
    balanceRow: {
      marginBottom: 14,
    },
    balanceMeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    balanceLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    balanceValue: {
      fontSize: 13,
      fontWeight: '900',
      color: theme.colors.textPrimary,
    },
    progressTrack: {
      height: 8,
      borderRadius: 100,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F3F4F6',
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 100,
    },

    // Historial Rows (Matching PWA .hist-row)
    histRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.glassBorder,
      borderWidth: 1,
      borderRadius: theme.borderRadius.lg,
      paddingVertical: 14,
      paddingHorizontal: 16,
      marginBottom: theme.spacing.sm,
      gap: 12,
      ...theme.shadows.card,
    },
    dateBox: {
      alignItems: 'center',
      minWidth: 38,
    },
    dayNum: {
      fontSize: 20,
      fontWeight: '900',
      color: theme.colors.textPrimary,
      lineHeight: 24,
    },
    dayName: {
      fontSize: 10,
      fontWeight: '800',
      color: theme.colors.textMuted,
      textTransform: 'uppercase',
    },
    timesCol: {
      flex: 1,
      gap: 2,
    },
    timeLine: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    dot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      marginRight: 6,
    },
    timeLabel: {
      fontSize: 12.5,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    timeValue: {
      fontSize: 13,
      fontWeight: '800',
      color: theme.colors.textPrimary,
    },
    badge: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: '800',
    },
    emptyContainer: {
      padding: theme.spacing.xl,
      alignItems: 'center',
    },
    emptyText: {
      color: theme.colors.textMuted,
      fontSize: 13,
    },
  });
