import React, { useEffect, useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Theme } from '../../theme/theme';
import { useTheme } from '../../context/ThemeContext';
import { useAlert } from '../../context/AlertContext';
import { attendanceApi, alertsApi, notificationsApi } from '../../services/api';
import { NotificationStatus } from '../../types';
import { AlertTriangle, CheckCircle, Send, Users } from 'lucide-react-native';

export const AdminAlertsScreen = () => {
  const { theme, isDark } = useTheme();
  const { showSuccess, showError } = useAlert();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alertsList, setAlertsList] = useState<any[]>([]);
  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const [notifStatus, setNotifStatus] = useState<NotificationStatus | null>(null);
  const [broadcastTitle, setBroadcastTitle] = useState('UBIX CONTROL');
  const [broadcastMessage, setBroadcastMessage] = useState('Recuerda marcar tu asistencia hoy.');
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);

  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const [alertData, statusData] = await Promise.all([
        attendanceApi.getAlerts(),
        notificationsApi.getStatus().catch(() => null),
      ]);
      setAlertsList(alertData || []);
      setNotifStatus(statusData);
    } catch (e) {
      console.log('Error loading alerts:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleReview = async (alertId: number) => {
    try {
      setReviewingId(alertId);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await alertsApi.review(alertId);
      setAlertsList((prev) => prev.filter((a) => a.id !== alertId));
      showSuccess('Alerta Revisada', 'La alerta fue marcada como revisada.');
    } catch (e) {
      showError('Error', 'No se pudo marcar la alerta como revisada.');
    } finally {
      setReviewingId(null);
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastMessage.trim()) {
      showError('Mensaje requerido', 'Escribe el mensaje a enviar.');
      return;
    }
    try {
      setIsSendingBroadcast(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const res = await notificationsApi.broadcast(broadcastTitle.trim(), broadcastMessage.trim());
      showSuccess(
        '¡Notificación Enviada!',
        `Se envió a ${res.sent} de ${res.withToken} colaboradores con notificaciones activas.`,
      );
    } catch (e) {
      showError('Error', 'No se pudo enviar la notificación.');
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadAlerts();
          }}
          tintColor={theme.colors.cyan}
        />
      }
    >
      <Text style={styles.title}>Alertas & Incidencias</Text>
      <Text style={styles.subtitle}>Supervisión de anomalías de geocerca y asistencia</Text>

      {/* Broadcast Notification Card */}
      <MotiView
        from={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'timing', duration: 400 }}
        style={styles.broadcastCard}
      >
        <View style={styles.broadcastHeaderRow}>
          <Send color={theme.colors.cyan} size={18} />
          <Text style={styles.broadcastTitle}>NOTIFICACIONES PUSH</Text>
        </View>

        {notifStatus && (
          <View style={styles.notifStatusRow}>
            <Users color={theme.colors.textMuted} size={14} />
            <Text style={styles.notifStatusText}>
              {notifStatus.withToken} de {notifStatus.total} colaboradores con notificaciones activas
            </Text>
          </View>
        )}

        <TextInput
          style={styles.broadcastInput}
          placeholder="Título"
          placeholderTextColor={theme.colors.textMuted}
          value={broadcastTitle}
          onChangeText={setBroadcastTitle}
        />
        <TextInput
          style={[styles.broadcastInput, styles.broadcastTextArea]}
          placeholder="Mensaje a enviar..."
          placeholderTextColor={theme.colors.textMuted}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          value={broadcastMessage}
          onChangeText={setBroadcastMessage}
        />

        <TouchableOpacity
          style={styles.broadcastBtnWrapper}
          onPress={handleBroadcast}
          disabled={isSendingBroadcast}
          activeOpacity={0.85}
        >
          <LinearGradient colors={theme.colors.gradients.cyan} style={styles.broadcastBtn}>
            {isSendingBroadcast ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Send color="#FFF" size={16} />
                <Text style={styles.broadcastBtnText}>ENVIAR A TODOS</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </MotiView>

      <View style={styles.sectionDivider}>
        <AlertTriangle color={theme.colors.amber} size={16} />
        <Text style={styles.sectionDividerText}>ALERTAS PENDIENTES</Text>
      </View>

      {alertsList && alertsList.length > 0 ? (
        alertsList.map((alertItem, index) => (
          <MotiView
            key={alertItem.id || index}
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 350, delay: index * 50 }}
            style={styles.alertCard}
          >
            <View style={styles.alertIconCircle}>
              <AlertTriangle color={theme.colors.orange} size={22} />
            </View>

            <View style={styles.alertInfo}>
              <Text style={styles.employeeName}>
                {alertItem.employee?.full_name || alertItem.employee_name || 'Empleado'}
              </Text>
              <Text style={styles.alertDetail}>
                {alertItem.detail || alertItem.type || 'Alerta de geocerca fuera de zona'}
              </Text>
              <Text style={styles.alertDate}>
                {alertItem.created_at
                  ? new Date(alertItem.created_at).toLocaleString('es-PE')
                  : 'Reciente'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.reviewBtn}
              onPress={() => handleReview(alertItem.id)}
              disabled={reviewingId === alertItem.id}
              activeOpacity={0.8}
            >
              {reviewingId === alertItem.id ? (
                <ActivityIndicator size="small" color={theme.colors.emerald} />
              ) : (
                <CheckCircle color={theme.colors.emerald} size={20} />
              )}
            </TouchableOpacity>
          </MotiView>
        ))
      ) : (
        <View style={styles.emptyContainer}>
          <CheckCircle color={theme.colors.emerald} size={36} />
          <Text style={styles.emptyText}>¡Todo en orden! No hay alertas pendientes por revisar.</Text>
        </View>
      )}
    </ScrollView>
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
    broadcastCard: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.glassBorder,
      borderWidth: 1,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
      ...theme.shadows.card,
    },
    broadcastHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 10,
    },
    broadcastTitle: {
      fontSize: 12,
      fontWeight: '800',
      color: theme.colors.textPrimary,
      letterSpacing: 0.8,
    },
    notifStatusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 12,
    },
    notifStatusText: {
      fontSize: 11.5,
      color: theme.colors.textMuted,
    },
    broadcastInput: {
      backgroundColor: isDark ? theme.colors.surfaceHover : '#F8FAFC',
      borderColor: theme.colors.glassBorder,
      borderWidth: 1,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: theme.spacing.md,
      height: 44,
      color: theme.colors.textPrimary,
      fontSize: 13,
      marginBottom: 10,
    },
    broadcastTextArea: {
      height: 80,
      paddingTop: 10,
    },
    broadcastBtnWrapper: {
      borderRadius: theme.borderRadius.md,
      overflow: 'hidden',
      ...theme.shadows.glowPrimary,
    },
    broadcastBtn: {
      flexDirection: 'row',
      height: 46,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
    },
    broadcastBtnText: {
      color: '#FFF',
      fontSize: 13,
      fontWeight: '800',
      letterSpacing: 0.8,
    },
    sectionDivider: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: theme.spacing.md,
    },
    sectionDividerText: {
      fontSize: 11,
      fontWeight: '800',
      color: theme.colors.textMuted,
      letterSpacing: 1,
    },
    reviewBtn: {
      padding: 8,
    },
    alertCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderColor: 'rgba(249, 115, 22, 0.3)',
      borderWidth: 1,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      ...theme.shadows.card,
    },
    alertIconCircle: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: isDark ? 'rgba(249, 115, 22, 0.15)' : 'rgba(249, 115, 22, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing.md,
    },
    alertInfo: {
      flex: 1,
    },
    employeeName: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    alertDetail: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    alertDate: {
      fontSize: 11,
      color: theme.colors.textMuted,
      marginTop: 4,
    },
    emptyContainer: {
      padding: theme.spacing.xxl,
      alignItems: 'center',
      gap: 12,
    },
    emptyText: {
      color: theme.colors.textMuted,
      fontSize: 14,
      textAlign: 'center',
    },
  });
