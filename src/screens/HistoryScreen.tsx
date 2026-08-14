import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MotiView } from 'moti';
import { theme } from '../theme/theme';
import { attendanceApi } from '../services/api';
import { Clock, AlertTriangle, CheckCircle, Flame, UserX } from 'lucide-react-native';

export const HistoryScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [historyEntries, setHistoryEntries] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const ym = new Date().toISOString().slice(0, 7); // YYYY-MM
      const [sData, hData] = await Promise.all([
        attendanceApi.getMyStats().catch(() => null),
        attendanceApi.getHistory(ym, 1).catch(() => ({ entries: [] })),
      ]);
      setStats(sData);
      setHistoryEntries(hData?.entries || hData || []);
    } catch (e) {
      console.log('Error loading history:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

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

      {/* Stats Grid */}
      <View style={styles.statsRow}>
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 350, delay: 100 }}
          style={styles.statCard}
        >
          <Clock color={theme.colors.emerald} size={22} />
          <Text style={styles.statNumber}>{stats?.onTime || 0}</Text>
          <Text style={styles.statLabel}>Puntuales</Text>
        </MotiView>

        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 350, delay: 200 }}
          style={styles.statCard}
        >
          <AlertTriangle color={theme.colors.amber} size={22} />
          <Text style={styles.statNumber}>{stats?.late || 0}</Text>
          <Text style={styles.statLabel}>Tardanzas</Text>
        </MotiView>

        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 350, delay: 300 }}
          style={styles.statCard}
        >
          <Flame color={theme.colors.cyan} size={22} />
          <Text style={styles.statNumber}>{stats?.missed || 0}</Text>
          <Text style={styles.statLabel}>Faltas</Text>
        </MotiView>
      </View>

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
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
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
