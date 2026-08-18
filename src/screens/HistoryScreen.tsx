import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { MotiView } from 'moti';
import { theme } from '../theme/theme';
import { attendanceApi } from '../services/api';
import { SimpleBarChart } from '../components/SimpleBarChart';
import { Clock, AlertTriangle, CheckCircle, Flame, UserX, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Timer } from 'lucide-react-native';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const getYearMonth = (offset: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  return { ym: d.toISOString().slice(0, 7), year: d.getFullYear(), month: d.getMonth() };
};

export const HistoryScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [historyEntries, setHistoryEntries] = useState<any[]>([]);
  const [monthOffset, setMonthOffset] = useState(0);

  useEffect(() => {
    loadData();
  }, [monthOffset]);

  const loadData = async () => {
    try {
      setLoading(true);
      const { ym } = getYearMonth(monthOffset);
      const [sData, hData] = await Promise.all([
        attendanceApi.getMyStats(ym).catch(() => null),
        attendanceApi.getHistory(ym, 1).catch(() => ({ entries: [] })),
      ]);
      setStats(sData);
      setHistoryEntries(hData?.entries || (Array.isArray(hData) ? hData : []));
    } catch (e) {
      console.log('Error loading history:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const { year, month } = getYearMonth(monthOffset);
  const monthLabel = `${MESES[month]} ${year}`;

  const derivedStats = React.useMemo(() => {
    if (Array.isArray(historyEntries) && historyEntries.length > 0) {
      let onTime = 0;
      let late = 0;
      let missed = 0;

      historyEntries.forEach((e) => {
        const estado = (e.estado || '').toLowerCase();
        if (estado === 'tarde' || e.is_late) {
          late++;
        } else if (estado === 'ausente') {
          missed++;
        } else {
          onTime++;
        }
      });

      return {
        onTime,
        late,
        missed,
        extras_fmt: stats?.extras_fmt || '0h 00m',
        falta_fmt: stats?.falta_fmt || '0h 00m',
        tardanza_fmt: stats?.tardanza_fmt || '0h 00m',
        hasBalance: Boolean(stats && (stats.extras > 0 || stats.falta > 0 || stats.tardanza > 0)),
      };
    }

    return {
      onTime: stats?.onTime || 0,
      late: stats?.late || 0,
      missed: stats?.missed || 0,
      extras_fmt: stats?.extras_fmt || '0h 00m',
      falta_fmt: stats?.falta_fmt || '0h 00m',
      tardanza_fmt: stats?.tardanza_fmt || '0h 00m',
      hasBalance: Boolean(stats && (stats.extras > 0 || stats.falta > 0 || stats.tardanza > 0)),
    };
  }, [historyEntries, stats]);

  // historyEntries viene ordenado del más reciente al más antiguo (ver backend);
  // tomamos los 7 más recientes y los invertimos para mostrar la tendencia en orden cronológico.
  const last7Chart = historyEntries
    .slice(0, 7)
    .reverse()
    .map((e) => {
      const estado = (e.estado || '').toLowerCase();
      const isLate = estado === 'tarde' || e.is_late;
      const isAbsent = estado === 'ausente';
      const isOnTime = !isLate && !isAbsent;

      let dayLabel = e.fecha ? String(e.fecha).slice(-2) : '';
      if (e.fecha) {
        const parts = String(e.fecha).split('-');
        if (parts.length === 3) {
          const dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
          const days = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
          dayLabel = days[dateObj.getDay()];
        }
      }

      let heightPercent = 0.55;
      let positionOffset = 0.2;

      if (e.horaEntrada && e.horaSalida) {
        const [h1, m1] = e.horaEntrada.split(':').map(Number);
        const [h2, m2] = e.horaSalida.split(':').map(Number);
        if (!isNaN(h1) && !isNaN(h2)) {
          const mins = (h2 * 60 + m2) - (h1 * 60 + m1);
          const hours = Math.max(1, mins / 60);
          heightPercent = Math.min(0.9, Math.max(0.35, hours / 12));
          positionOffset = 0.75;
        }
      } else if (isLate) {
        heightPercent = 0.28;
        positionOffset = 0.25;
      } else if (isAbsent) {
        heightPercent = 0.15;
        positionOffset = 0.5;
      } else if (e.horaEntrada) {
        heightPercent = 0.45;
        positionOffset = 0.15;
      }

      return {
        day: dayLabel,
        onTime: isOnTime ? 1 : 0,
        late: isLate ? 1 : 0,
        absent: isAbsent ? 1 : 0,
        heightPercent,
        positionOffset,
      };
    });

  const renderHeader = () => (
    <View>
      <MotiView
        from={{ opacity: 0, translateY: -15 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400 }}
      >
        <Text style={styles.title}>Mis Marcaciones</Text>
        <Text style={styles.subtitle}>Resumen mensual y registro de asistencia UBIX</Text>
      </MotiView>

      {/* Month Navigator */}
      <View style={styles.monthNav}>
        <TouchableOpacity
          style={styles.monthNavBtn}
          onPress={() => setMonthOffset((o) => o - 1)}
        >
          <ChevronLeft color={theme.colors.textSecondary} size={20} />
        </TouchableOpacity>
        <Text style={styles.monthNavLabel}>{monthLabel}</Text>
        <TouchableOpacity
          style={[styles.monthNavBtn, monthOffset >= 0 && styles.monthNavBtnDisabled]}
          onPress={() => monthOffset < 0 && setMonthOffset((o) => o + 1)}
          disabled={monthOffset >= 0}
        >
          <ChevronRight color={theme.colors.textSecondary} size={20} />
        </TouchableOpacity>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsRow}>
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 350, delay: 100 }}
          style={styles.statCard}
        >
          <Clock color={theme.colors.emerald} size={22} />
          <Text style={styles.statNumber}>{derivedStats.onTime}</Text>
          <Text style={styles.statLabel}>Puntuales</Text>
        </MotiView>

        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 350, delay: 200 }}
          style={styles.statCard}
        >
          <AlertTriangle color={theme.colors.amber} size={22} />
          <Text style={styles.statNumber}>{derivedStats.late}</Text>
          <Text style={styles.statLabel}>Tardanzas</Text>
        </MotiView>

        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 350, delay: 300 }}
          style={styles.statCard}
        >
          <Flame color={theme.colors.cyan} size={22} />
          <Text style={styles.statNumber}>{derivedStats.missed}</Text>
          <Text style={styles.statLabel}>Faltas</Text>
        </MotiView>
      </View>

      {/* Hours Balance Card (extras / falta / tardanza) */}
      {derivedStats.hasBalance && (
        <View style={styles.balanceCard}>
          <Text style={styles.sectionHeader}>BALANCE DE HORAS DEL MES</Text>
          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <TrendingUp color={theme.colors.emerald} size={18} />
              <Text style={styles.balanceValue}>{derivedStats.extras_fmt}</Text>
              <Text style={styles.balanceLabel}>Extras</Text>
            </View>
            <View style={styles.balanceItem}>
              <TrendingDown color={theme.colors.rose} size={18} />
              <Text style={styles.balanceValue}>{derivedStats.falta_fmt}</Text>
              <Text style={styles.balanceLabel}>Falta</Text>
            </View>
            <View style={styles.balanceItem}>
              <Timer color={theme.colors.amber} size={18} />
              <Text style={styles.balanceValue}>{derivedStats.tardanza_fmt}</Text>
              <Text style={styles.balanceLabel}>Tardanza</Text>
            </View>
          </View>
        </View>
      )}

      {/* Últimos 7 días */}
      {last7Chart.length > 0 && (
        <>
          <Text style={styles.sectionHeader}>ÚLTIMOS 7 DÍAS</Text>
          <SimpleBarChart data={last7Chart} height={140} />
        </>
      )}

      <Text style={styles.sectionHeader}>HISTORIAL RECIENTE</Text>
    </View>
  );

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    // Determine format: Formatted entry { fecha, horaEntrada, horaSalida, estado } vs Raw log { timestamp, type, is_late }
    let dateStr = '---';
    let timeStr = '---';
    let estado = item.estado || 'puntual';
    let isLate = estado === 'tarde' || item.is_late;
    let isAusente = estado === 'ausente';

    if (item.fecha) {
      // Formatted Entry
      dateStr = item.fecha;
      timeStr = item.horaEntrada
        ? `Entrada: ${item.horaEntrada}${item.horaSalida ? ' | Salida: ' + item.horaSalida : ''}`
        : 'Sin marcado';
    } else if (item.timestamp) {
      // Raw log
      const dateObj = new Date(item.timestamp);
      if (!isNaN(dateObj.getTime())) {
        dateStr = dateObj.toLocaleDateString('es-PE', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        });
        timeStr = dateObj.toLocaleTimeString('es-PE', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });
      }
    }

    return (
      <MotiView
        from={{ opacity: 0, translateX: -15 }}
        animate={{ opacity: 1, translateX: 0 }}
        transition={{ type: 'timing', duration: 350, delay: index * 40 }}
        style={styles.logCard}
      >
        <View
          style={[
            styles.typeBadge,
            {
              backgroundColor: isAusente
                ? 'rgba(239, 68, 68, 0.15)'
                : isLate
                ? 'rgba(245, 158, 11, 0.15)'
                : 'rgba(16, 185, 129, 0.15)',
            },
          ]}
        >
          {isAusente ? (
            <UserX color={theme.colors.rose} size={20} />
          ) : isLate ? (
            <AlertTriangle color={theme.colors.amber} size={20} />
          ) : (
            <CheckCircle color={theme.colors.emerald} size={20} />
          )}
        </View>

        <View style={styles.logContent}>
          <Text style={styles.logType}>
            {isAusente ? 'AUSENCIA' : isLate ? 'TARDANZA' : 'PUNTUAL'}
          </Text>
          <Text style={styles.logDate}>{dateStr}</Text>
        </View>

        <Text style={styles.logTime}>{timeStr}</Text>
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
      data={historyEntries}
      keyExtractor={(item, index) => String(item.id || item.fecha || index)}
      ListHeaderComponent={renderHeader}
      renderItem={renderItem}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listContent: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: 110,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
    marginTop: 2,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.glassBorder,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.sm,
    height: 44,
    marginBottom: theme.spacing.lg,
  },
  monthNavBtn: {
    padding: 8,
  },
  monthNavBtnDisabled: {
    opacity: 0.3,
  },
  monthNavLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    textTransform: 'capitalize',
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  balanceCard: {
    marginBottom: theme.spacing.lg,
  },
  balanceRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.glassBorder,
    borderWidth: 1,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    ...theme.shadows.card,
  },
  balanceItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  balanceValue: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginTop: 2,
  },
  balanceLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textMuted,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.glassBorder,
    borderWidth: 1,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    ...theme.shadows.card,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginTop: 6,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.textMuted,
    letterSpacing: 1,
    marginBottom: theme.spacing.md,
  },
  logCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.glassBorder,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  typeBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  logContent: {
    flex: 1,
  },
  logType: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  logDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  logTime: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.cyan,
  },
});
