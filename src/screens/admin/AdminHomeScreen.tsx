import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { MotiView } from 'moti';
import { theme } from '../../theme/theme';
import { dashboardApi, attendanceApi } from '../../services/api';
import { DashboardKpis, WeeklyStat, AlertItem, HourlyStat } from '../../types';
import { StatCard } from '../../components/StatCard';
import { StackedBarChart } from '../../components/StackedBarChart';
import { HourlyDistributionChart } from '../../components/HourlyDistributionChart';
import {
  CheckCircle2,
  Clock,
  UserX,
  AlertTriangle,
  BarChart3,
  Bell,
  Sparkles,
  Radio,
  Activity,
} from 'lucide-react-native';

export const AdminHomeScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStat[]>([]);
  const [hourlyStats, setHourlyStats] = useState<HourlyStat[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [todayLogs, setTodayLogs] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [kpiData, weeklyData, hourlyData, alertData, liveLogsData] = await Promise.all([
        dashboardApi.getToday().catch(() => null),
        dashboardApi.getWeeklyStats().catch(() => []),
        dashboardApi.getHourlyDistribution().catch(() => []),
        dashboardApi.getAlerts().catch(() => []),
        attendanceApi.getTodayLogs().catch(() => []),
      ]);
      setKpis(kpiData);
      setWeeklyStats(weeklyData);
      setHourlyStats(hourlyData);
      setAlerts(alertData);
      setTodayLogs(liveLogsData);
    } catch (e) {
      console.log('Error loading admin home data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.cyan} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
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
    >
      {/* Header Banner */}
      <MotiView
        from={{ opacity: 0, translateY: -10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400 }}
        style={styles.headerBanner}
      >
        <View>
          <Text style={styles.title}>Panel de Control</Text>
          <Text style={styles.subtitle}>Supervisión en tiempo real UBIX</Text>
        </View>
        <View style={styles.adminBadge}>
          <Sparkles color={theme.colors.cyan} size={14} />
          <Text style={styles.adminBadgeText}>ADMIN</Text>
        </View>
      </MotiView>

      {/* KPI Cards Grid */}
      <View style={styles.kpiGrid}>
        <StatCard
          title="Presentes"
          value={kpis?.present || 0}
          icon={<CheckCircle2 color={theme.colors.emerald} size={18} />}
          accentColor={theme.colors.emerald}
          subtitle={`De ${kpis?.totalEmployees || 0} empleados`}
          delay={100}
        />
        <StatCard
          title="Tardanzas"
          value={kpis?.late || 0}
          icon={<Clock color={theme.colors.amber} size={18} />}
          accentColor={theme.colors.amber}
          delay={200}
        />
        <StatCard
          title="Ausentes"
          value={kpis?.absent || 0}
          icon={<UserX color={theme.colors.rose} size={18} />}
          accentColor={theme.colors.rose}
          delay={300}
        />
        <StatCard
          title="Fuera de Zona"
          value={kpis?.outsideZone || 0}
          icon={<AlertTriangle color={theme.colors.violet} size={18} />}
          accentColor={theme.colors.violet}
          delay={400}
        />
      </View>

      {/* Live Attendance Logs Stream Section */}
      <View style={styles.sectionHeader}>
        <Radio color={theme.colors.cyan} size={18} />
        <Text style={styles.sectionTitle}>ASISTENCIA EN VIVO DEL DÍA</Text>
      </View>

      {todayLogs && todayLogs.length > 0 ? (
        todayLogs.slice(0, 5).map((log, i) => {
          const isLate = log.is_late;
          const isEntrada = log.type === 'ENTRADA';
          const timeStr = log.timestamp
            ? new Date(log.timestamp).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true })
            : '---';

          return (
            <MotiView
              key={log.id || i}
              from={{ opacity: 0, translateX: -10 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: 'timing', duration: 350, delay: i * 50 }}
              style={styles.liveLogCard}
            >
              {log.selfie_url ? (
                <Image source={{ uri: log.selfie_url }} style={styles.selfieThumb} />
              ) : (
                <View style={styles.liveLogAvatar}>
                  <Text style={styles.avatarText}>
                    {log.employee?.full_name ? log.employee.full_name.charAt(0).toUpperCase() : 'E'}
                  </Text>
                </View>
              )}

              <View style={styles.liveLogContent}>
                <Text style={styles.liveLogName}>{log.employee?.full_name || 'Empleado'}</Text>
                <Text style={styles.liveLogMeta}>
                  {log.type} {isLate ? '(Tardanza)' : '(Puntual)'} | {log.employee?.position || 'Colaborador'}
                </Text>
              </View>

              <Text style={styles.liveLogTime}>{timeStr}</Text>
            </MotiView>
          );
        })
      ) : (
        <Text style={styles.emptyText}>Aún no hay marcaciones registradas el día de hoy.</Text>
      )}

      {/* Chart Section */}
      <View style={styles.sectionHeader}>
        <BarChart3 color={theme.colors.cyan} size={18} />
        <Text style={styles.sectionTitle}>ASISTENCIA DE LA SEMANA</Text>
      </View>
      <StackedBarChart data={weeklyStats} />

      {/* Hourly Distribution */}
      <View style={styles.sectionHeader}>
        <Activity color={theme.colors.cyan} size={18} />
        <Text style={styles.sectionTitle}>DISTRIBUCIÓN DE MARCADOS POR HORA (HOY)</Text>
      </View>
      <HourlyDistributionChart data={hourlyStats} />

      {/* Pending Alerts Section */}
      {alerts && alerts.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Bell color={theme.colors.amber} size={18} />
            <Text style={styles.sectionTitle}>ALERTAS PENDIENTES</Text>
          </View>

          {alerts.slice(0, 5).map((alert, i) => (
            <MotiView
              key={alert.id || i}
              from={{ opacity: 0, translateX: -10 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: 'timing', duration: 350, delay: i * 80 }}
              style={styles.alertCard}
            >
              <AlertTriangle color={theme.colors.amber} size={20} />
              <View style={styles.alertContent}>
                <Text style={styles.alertEmployee}>{alert.employee_name || 'Empleado'}</Text>
                <Text style={styles.alertDetail}>{alert.detail || alert.type}</Text>
              </View>
            </MotiView>
          ))}
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  headerBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 212, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
  },
  adminBadgeText: {
    color: theme.colors.cyan,
    fontSize: 12,
    fontWeight: '800',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.textMuted,
    letterSpacing: 1,
  },
  liveLogCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.glassBorder,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  selfieThumb: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: theme.spacing.md,
  },
  liveLogAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.cyan,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  avatarText: {
    color: '#050A14',
    fontWeight: '800',
    fontSize: 16,
  },
  liveLogContent: {
    flex: 1,
  },
  liveLogName: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  liveLogMeta: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  liveLogTime: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.cyan,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  alertContent: {
    flex: 1,
  },
  alertEmployee: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  alertDetail: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginBottom: theme.spacing.md,
  },
});
