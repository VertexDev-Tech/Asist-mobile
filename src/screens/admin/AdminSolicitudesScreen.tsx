import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { Theme } from '../../theme/theme';
import { useTheme } from '../../context/ThemeContext';
import { useAlert } from '../../context/AlertContext';
import { exceptionsApi, additionalShiftsApi } from '../../services/api';
import { ExceptionItem, AdditionalShiftItem } from '../../types';
import { CalendarClock, Zap, Check, X, ClipboardCheck } from 'lucide-react-native';

const TYPE_LABELS: Record<string, string> = {
  PERMISSION_PAID: 'Permiso Pagado',
  PERMISSION_UNPAID: 'Permiso No Pagado',
  VACATION: 'Vacaciones',
  COMPENSATED_HE: 'Compensar Horas Extra',
  FERIADO: 'Feriado',
  EXTRA_HOURS: 'Horas Extra',
  WEEKEND_WORK: 'Fin de Semana',
  SPECIAL_MEETING: 'Reunión Especial',
  OTHER: 'Otro',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
};

type MergedRequest = {
  key: string;
  id: number;
  kind: 'exception' | 'shift';
  employeeName: string;
  typeLabel: string;
  date: string;
  extra?: string;
  status: string;
  note?: string | null;
  created_at: string;
};

export const AdminSolicitudesScreen = () => {
  const { theme, isDark } = useTheme();
  const { showConfirm, showPrompt, showSuccess, showError } = useAlert();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [exceptions, setExceptions] = useState<ExceptionItem[]>([]);
  const [shifts, setShifts] = useState<AdditionalShiftItem[]>([]);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [excData, shiftData] = await Promise.all([
        exceptionsApi.listPending(showAll).catch(() => []),
        additionalShiftsApi.listPending(showAll).catch(() => []),
      ]);
      setExceptions(excData || []);
      setShifts(shiftData || []);
    } catch (e) {
      console.log('Error loading admin solicitudes:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showAll]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const mergedList = useMemo<MergedRequest[]>(() => {
    const excList: MergedRequest[] = exceptions.map((e) => ({
      key: `exc-${e.id}`,
      id: e.id,
      kind: 'exception',
      employeeName: e.employee?.full_name || 'Empleado',
      typeLabel: TYPE_LABELS[e.type] || e.type,
      date: e.date,
      extra:
        e.type === 'COMPENSATED_HE' && (e.hours || e.minutes)
          ? `${e.hours || 0}h ${e.minutes || 0}m`
          : undefined,
      status: e.status,
      note: e.note,
      created_at: e.created_at,
    }));
    const shiftList: MergedRequest[] = shifts.map((s) => ({
      key: `shift-${s.id}`,
      id: s.id,
      kind: 'shift',
      employeeName: s.employee?.full_name || 'Empleado',
      typeLabel: TYPE_LABELS[s.type] || s.type,
      date: s.date,
      extra: `${s.start_time?.slice(0, 5)} - ${s.end_time?.slice(0, 5)}`,
      status: s.status,
      note: s.note,
      created_at: s.created_at,
    }));
    return [...excList, ...shiftList].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }, [exceptions, shifts]);

  const handleApprove = (item: MergedRequest) => {
    showConfirm(
      'Aprobar Solicitud',
      `¿Aprobar la solicitud de "${item.employeeName}" (${item.typeLabel})?`,
      async () => {
        try {
          setBusyKey(item.key);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          if (item.kind === 'exception') {
            await exceptionsApi.approve(item.id);
          } else {
            await additionalShiftsApi.approve(item.id);
          }
          showSuccess('¡Solicitud Aprobada!', `Se aprobó la solicitud de ${item.employeeName}.`);
          loadData();
        } catch (e) {
          showError('Error', 'No se pudo aprobar la solicitud.');
        } finally {
          setBusyKey(null);
        }
      },
      'Aprobar',
      false,
    );
  };

  const handleReject = (item: MergedRequest) => {
    showPrompt(
      'Rechazar Solicitud',
      `Ingresa un motivo de rechazo para "${item.employeeName}" (opcional):`,
      async (note) => {
        try {
          setBusyKey(item.key);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          if (item.kind === 'exception') {
            await exceptionsApi.reject(item.id, note || undefined);
          } else {
            await additionalShiftsApi.reject(item.id, note || undefined);
          }
          showSuccess('Solicitud Rechazada', `Se rechazó la solicitud de ${item.employeeName}.`);
          loadData();
        } catch (e) {
          showError('Error', 'No se pudo rechazar la solicitud.');
        } finally {
          setBusyKey(null);
        }
      },
      'Motivo (opcional)',
    );
  };

  const statusStyle = (status: string) => {
    if (status === 'APPROVED') {
      return {
        bg: isDark ? 'rgba(16, 185, 129, 0.18)' : '#DCFCE7',
        color: isDark ? theme.colors.emerald : '#166534',
      };
    }
    if (status === 'REJECTED') {
      return {
        bg: isDark ? 'rgba(239, 68, 68, 0.18)' : '#FEE2E2',
        color: isDark ? theme.colors.rose : '#991B1B',
      };
    }
    return {
      bg: isDark ? 'rgba(245, 158, 11, 0.18)' : '#FEF3C7',
      color: isDark ? theme.colors.amber : '#92400E',
    };
  };

  const renderHeader = () => (
    <View>
      <Text style={styles.title}>Excepciones & Turnos</Text>
      <Text style={styles.subtitle}>Aprobación de permisos y turnos adicionales</Text>

      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, !showAll && styles.toggleBtnActive]}
          onPress={() => setShowAll(false)}
          activeOpacity={0.8}
        >
          <Text style={[styles.toggleText, !showAll && styles.toggleTextActive]}>Pendientes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, showAll && styles.toggleBtnActive]}
          onPress={() => setShowAll(true)}
          activeOpacity={0.8}
        >
          <Text style={[styles.toggleText, showAll && styles.toggleTextActive]}>Todas</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderItem = ({ item, index }: { item: MergedRequest; index: number }) => {
    const st = statusStyle(item.status);
    const [yy, mm, dd] = item.date.split('T')[0].split('-');
    const dateLabel = yy ? `${dd}/${mm}/${yy}` : item.date;
    const isBusy = busyKey === item.key;

    return (
      <MotiView
        from={{ opacity: 0, translateY: 8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 300, delay: index * 25 }}
        style={styles.reqCard}
      >
        <View style={styles.reqTopRow}>
          <View
            style={[
              styles.reqIconCircle,
              {
                backgroundColor:
                  item.kind === 'exception'
                    ? isDark
                      ? 'rgba(0, 212, 255, 0.15)'
                      : 'rgba(2, 132, 199, 0.12)'
                    : isDark
                    ? 'rgba(255, 107, 0, 0.15)'
                    : 'rgba(234, 88, 12, 0.12)',
              },
            ]}
          >
            {item.kind === 'exception' ? (
              <CalendarClock color={theme.colors.cyan} size={18} />
            ) : (
              <Zap color={theme.colors.orange} size={18} />
            )}
          </View>

          <View style={styles.reqInfo}>
            <Text style={styles.reqEmployee}>{item.employeeName}</Text>
            <Text style={styles.reqType}>{item.typeLabel}</Text>
            <Text style={styles.reqDate}>
              {dateLabel}
              {item.extra ? ` · ${item.extra}` : ''}
            </Text>
            {!!item.note && (
              <Text style={styles.reqNote} numberOfLines={2}>
                {item.note}
              </Text>
            )}
          </View>

          <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
            <Text style={[styles.statusBadgeText, { color: st.color }]}>
              {STATUS_LABELS[item.status] || item.status}
            </Text>
          </View>
        </View>

        {item.status === 'PENDING' && (
          <View style={styles.reqActionsRow}>
            <TouchableOpacity
              style={[styles.reqActionBtn, styles.rejectBtn]}
              onPress={() => handleReject(item)}
              disabled={isBusy}
              activeOpacity={0.8}
            >
              <X color={theme.colors.rose} size={16} />
              <Text style={styles.rejectBtnText}>Rechazar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.reqActionBtn, styles.approveBtn]}
              onPress={() => handleApprove(item)}
              disabled={isBusy}
              activeOpacity={0.8}
            >
              {isBusy ? (
                <ActivityIndicator size="small" color="#050A14" />
              ) : (
                <>
                  <Check color="#050A14" size={16} />
                  <Text style={styles.approveBtnText}>Aprobar</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
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
      data={mergedList}
      keyExtractor={(item) => item.key}
      ListHeaderComponent={renderHeader}
      renderItem={renderItem}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <ClipboardCheck color={theme.colors.emerald} size={32} />
          <Text style={styles.emptyText}>
            {showAll ? 'No hay solicitudes registradas.' : '¡Todo al día! No hay solicitudes pendientes.'}
          </Text>
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
      color: theme.colors.textSecondary,
      marginTop: 2,
      marginBottom: theme.spacing.md,
    },
    toggleRow: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.glassBorder,
      borderWidth: 1,
      borderRadius: theme.borderRadius.lg,
      padding: 4,
      gap: 6,
      marginBottom: theme.spacing.lg,
      ...theme.shadows.card,
    },
    toggleBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
    },
    toggleBtnActive: {
      backgroundColor: theme.colors.cyan,
    },
    toggleText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.textMuted,
    },
    toggleTextActive: {
      color: '#FFF',
      fontWeight: '800',
    },
    reqCard: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.glassBorder,
      borderWidth: 1,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      ...theme.shadows.card,
    },
    reqTopRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    reqIconCircle: {
      width: 38,
      height: 38,
      borderRadius: 19,
      justifyContent: 'center',
      alignItems: 'center',
    },
    reqInfo: {
      flex: 1,
    },
    reqEmployee: {
      fontSize: 14,
      fontWeight: '800',
      color: theme.colors.textPrimary,
    },
    reqType: {
      fontSize: 12.5,
      fontWeight: '700',
      color: theme.colors.textSecondary,
      marginTop: 1,
    },
    reqDate: {
      fontSize: 11.5,
      color: theme.colors.textMuted,
      marginTop: 2,
    },
    reqNote: {
      fontSize: 11,
      color: theme.colors.textMuted,
      marginTop: 3,
      fontStyle: 'italic',
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
    },
    statusBadgeText: {
      fontSize: 10.5,
      fontWeight: '800',
    },
    reqActionsRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 12,
    },
    reqActionBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: theme.borderRadius.md,
    },
    rejectBtn: {
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)',
      borderWidth: 1.5,
      borderColor: theme.colors.rose,
    },
    rejectBtnText: {
      color: theme.colors.rose,
      fontSize: 12,
      fontWeight: '800',
    },
    approveBtn: {
      backgroundColor: theme.colors.emerald,
    },
    approveBtnText: {
      color: '#050A14',
      fontSize: 12,
      fontWeight: '800',
    },
    emptyContainer: {
      padding: theme.spacing.xxl,
      alignItems: 'center',
      gap: 12,
    },
    emptyText: {
      color: theme.colors.textMuted,
      fontSize: 13,
      textAlign: 'center',
    },
  });
