import React, { useEffect, useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Theme } from '../../theme/theme';
import { useTheme } from '../../context/ThemeContext';
import { useAlert } from '../../context/AlertContext';
import { dashboardApi, attendanceApi, notificationsApi } from '../../services/api';
import { DashboardKpis, WeeklyStat, AlertItem } from '../../types';
import { StatCard } from '../../components/StatCard';
import { SimpleBarChart } from '../../components/SimpleBarChart';
import {
  CheckCircle2,
  Clock,
  UserX,
  AlertTriangle,
  BarChart3,
  Bell,
  Sparkles,
  Radio,
  Send,
  X,
  Megaphone,
} from 'lucide-react-native';

export const AdminHomeScreen = () => {
  const { theme, isDark } = useTheme();
  const { showSuccess, showError } = useAlert();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStat[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [todayLogs, setTodayLogs] = useState<any[]>([]);

  // Broadcast Modal State
  const [broadcastModalVisible, setBroadcastModalVisible] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);

  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [kpiData, weeklyData, alertData, liveLogsData] = await Promise.all([
        dashboardApi.getToday().catch(() => null),
        dashboardApi.getWeeklyStats().catch(() => []),
        dashboardApi.getAlerts().catch(() => []),
        attendanceApi.getTodayLogs().catch(() => []),
      ]);
      setKpis(kpiData);
      setWeeklyStats(weeklyData);
      setAlerts(alertData);
      setTodayLogs(liveLogsData || []);
    } catch (e) {
      console.log('Error loading admin home data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      showError('Campos Requeridos', 'Ingresa el título y el mensaje del comunicado.');
      return;
    }
    try {
      setIsSendingBroadcast(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await notificationsApi.broadcast(broadcastTitle.trim(), broadcastMessage.trim());
      showSuccess('Comunicado Enviado', 'La notificación fue transmitida a todos los colaboradores.');
      setBroadcastModalVisible(false);
      setBroadcastTitle('');
      setBroadcastMessage('');
    } catch (e) {
      showError('Error', 'No se pudo enviar el comunicado masivo.');
    } finally {
      setIsSendingBroadcast(false);
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
    <View style={styles.container}>
      <ScrollView
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

        {/* Broadcast Action Button */}
        <TouchableOpacity
          style={styles.broadcastCtaBtn}
          onPress={() => setBroadcastModalVisible(true)}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={theme.colors.gradients.cyan}
            style={styles.broadcastCtaInner}
          >
            <Megaphone color="#FFF" size={18} />
            <Text style={styles.broadcastCtaText}>EMITIR COMUNICADO MASIVO A COLABORADORES</Text>
          </LinearGradient>
        </TouchableOpacity>

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
            const isManual = log.is_manual;
            const timeStr = log.timestamp
              ? new Date(log.timestamp).toLocaleTimeString('es-PE', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                })
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
                      {log.employee?.full_name
                        ? log.employee.full_name.charAt(0).toUpperCase()
                        : 'E'}
                    </Text>
                  </View>
                )}

                <View style={styles.liveLogContent}>
                  <Text style={styles.liveLogName}>{log.employee?.full_name || 'Empleado'}</Text>
                  <Text style={styles.liveLogMeta}>
                    {log.type} {isManual ? '(Manual)' : isLate ? '(Tardanza)' : '(Puntual)'} ·{' '}
                    {log.employee?.position || 'Colaborador'}
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
        <SimpleBarChart data={weeklyStats} />

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

      {/* ── Modal: Comunicado Masivo (Broadcast) ───────────────────────────── */}
      <Modal visible={broadcastModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Megaphone color={theme.colors.cyan} size={22} />
                <Text style={styles.modalTitle}>Comunicado Masivo</Text>
              </View>
              <TouchableOpacity onPress={() => setBroadcastModalVisible(false)}>
                <X color={theme.colors.textMuted} size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>TÍTULO DEL AVISO *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. Reunión General / Cambio de Horario"
                placeholderTextColor={theme.colors.textMuted}
                value={broadcastTitle}
                onChangeText={setBroadcastTitle}
              />

              <Text style={styles.fieldLabel}>MENSAJE *</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Escribe el mensaje que recibirán todos los colaboradores en sus teléfonos..."
                placeholderTextColor={theme.colors.textMuted}
                multiline
                numberOfLines={4}
                value={broadcastMessage}
                onChangeText={setBroadcastMessage}
              />

              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setBroadcastModalVisible(false)}
                >
                  <Text style={styles.modalCancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalSaveBtn}
                  onPress={handleSendBroadcast}
                  disabled={isSendingBroadcast}
                >
                  {isSendingBroadcast ? (
                    <ActivityIndicator color="#050A14" />
                  ) : (
                    <>
                      <Send color="#FFF" size={16} />
                      <Text style={styles.modalSaveBtnText}>Enviar a Todos</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const createStyles = (theme: Theme, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
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
    headerBanner: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
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
      backgroundColor: isDark ? 'rgba(0, 212, 255, 0.15)' : 'rgba(2, 132, 199, 0.12)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: theme.borderRadius.full,
    },
    adminBadgeText: {
      color: theme.colors.cyan,
      fontSize: 12,
      fontWeight: '800',
    },

    broadcastCtaBtn: {
      borderRadius: theme.borderRadius.xl,
      overflow: 'hidden',
      marginBottom: theme.spacing.md,
      ...theme.shadows.glowPrimary,
    },
    broadcastCtaInner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 12,
    },
    broadcastCtaText: {
      color: '#FFF',
      fontSize: 11,
      fontWeight: '900',
      letterSpacing: 0.5,
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
      ...theme.shadows.card,
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
      color: '#FFFFFF',
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
      ...theme.shadows.card,
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

    // Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.7)',
      justifyContent: 'flex-end',
    },
    modalCard: {
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: theme.borderRadius.xl,
      borderTopRightRadius: theme.borderRadius.xl,
      padding: theme.spacing.xl,
      maxHeight: '85%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '900',
      color: theme.colors.textPrimary,
    },
    fieldLabel: {
      fontSize: 10.5,
      fontWeight: '800',
      color: theme.colors.textMuted,
      letterSpacing: 0.8,
      marginBottom: 6,
    },
    input: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F8FAFC',
      borderColor: theme.colors.glassBorder,
      borderWidth: 1,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: theme.colors.textPrimary,
      fontSize: 14,
      marginBottom: 12,
    },
    textArea: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F8FAFC',
      borderColor: theme.colors.glassBorder,
      borderWidth: 1,
      borderRadius: theme.borderRadius.md,
      padding: 10,
      color: theme.colors.textPrimary,
      fontSize: 13,
      marginBottom: 14,
    },
    modalActionsRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 8,
    },
    modalCancelBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
    },
    modalCancelBtnText: {
      color: theme.colors.textPrimary,
      fontWeight: '800',
      fontSize: 13,
    },
    modalSaveBtn: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 12,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      backgroundColor: theme.colors.cyan,
    },
    modalSaveBtnText: {
      color: '#FFF',
      fontWeight: '800',
      fontSize: 13,
    },
  });
