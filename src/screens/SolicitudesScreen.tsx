import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Theme } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';
import { useAlert } from '../context/AlertContext';
import { exceptionsApi, additionalShiftsApi, overtimeBankApi } from '../services/api';
import { ExceptionItem, AdditionalShiftItem, OvertimeBankSummary } from '../types';
import {
  ClipboardList,
  CalendarClock,
  Zap,
  Wallet,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';

// ─── Constantes / Etiquetas (paridad con app.html) ────────────────────────

const EXCEPTION_TYPES: { value: string; label: string }[] = [
  { value: 'PERMISSION_PAID', label: 'Permiso Pagado' },
  { value: 'PERMISSION_UNPAID', label: 'Permiso No Pagado' },
  { value: 'VACATION', label: 'Vacaciones' },
  { value: 'COMPENSATED_HE', label: 'Compensar Horas Extra' },
];

const SHIFT_TYPES: { value: string; label: string }[] = [
  { value: 'EXTRA_HOURS', label: 'Horas Extra' },
  { value: 'WEEKEND_WORK', label: 'Fin de Semana' },
  { value: 'SPECIAL_MEETING', label: 'Reunión Especial' },
  { value: 'OTHER', label: 'Otro' },
];

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

// ─── Helpers de fecha/hora (sin dependencias nativas extra) ───────────────

const pad2 = (n: number) => String(n).padStart(2, '0');
const toISODate = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const addDays = (d: Date, n: number) => {
  const nd = new Date(d);
  nd.setDate(nd.getDate() + n);
  return nd;
};
const displayDate = (d: Date) =>
  d.toLocaleDateString('es-PE', { weekday: 'short', day: '2-digit', month: 'short' });

const stepTime = (h: number, m: number, deltaMin: number) => {
  let total = h * 60 + m + deltaMin;
  total = ((total % 1440) + 1440) % 1440;
  return { h: Math.floor(total / 60), m: total % 60 };
};

type MergedRequest = {
  key: string;
  kind: 'exception' | 'shift';
  typeLabel: string;
  date: string;
  dateEnd?: string | null;
  extra?: string;
  status: string;
  note?: string | null;
  created_at: string;
};

export const SolicitudesScreen = () => {
  const { theme, isDark } = useTheme();
  const { showSuccess, showError } = useAlert();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exceptions, setExceptions] = useState<ExceptionItem[]>([]);
  const [shifts, setShifts] = useState<AdditionalShiftItem[]>([]);
  const [bank, setBank] = useState<OvertimeBankSummary | null>(null);

  // Modales
  const [exceptionModalVisible, setExceptionModalVisible] = useState(false);
  const [shiftModalVisible, setShiftModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form: Excepción / Permiso
  const [excType, setExcType] = useState('PERMISSION_PAID');
  const [excDate, setExcDate] = useState(new Date());
  const [excDateEnd, setExcDateEnd] = useState<Date | null>(null);
  const [excHours, setExcHours] = useState('0');
  const [excMinutes, setExcMinutes] = useState('0');
  const [excNote, setExcNote] = useState('');

  // Form: Turno Adicional
  const [shiftType, setShiftType] = useState('EXTRA_HOURS');
  const [shiftDate, setShiftDate] = useState(new Date());
  const [shiftStart, setShiftStart] = useState({ h: 18, m: 0 });
  const [shiftEnd, setShiftEnd] = useState({ h: 20, m: 0 });
  const [shiftNote, setShiftNote] = useState('');

  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [excData, shiftData, bankData] = await Promise.all([
        exceptionsApi.list().catch(() => []),
        additionalShiftsApi.list().catch(() => []),
        overtimeBankApi.getMine().catch(() => null),
      ]);
      setExceptions(excData || []);
      setShifts(shiftData || []);
      setBank(bankData);
    } catch (e) {
      console.log('Error loading solicitudes:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const mergedList = useMemo<MergedRequest[]>(() => {
    const excList: MergedRequest[] = exceptions.map((e) => ({
      key: `exc-${e.id}`,
      kind: 'exception',
      typeLabel: TYPE_LABELS[e.type] || e.type,
      date: e.date,
      dateEnd: e.date_end,
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
      kind: 'shift',
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

  const resetExceptionForm = () => {
    setExcType('PERMISSION_PAID');
    setExcDate(new Date());
    setExcDateEnd(null);
    setExcHours('0');
    setExcMinutes('0');
    setExcNote('');
  };

  const resetShiftForm = () => {
    setShiftType('EXTRA_HOURS');
    setShiftDate(new Date());
    setShiftStart({ h: 18, m: 0 });
    setShiftEnd({ h: 20, m: 0 });
    setShiftNote('');
  };

  const handleOpenExceptionModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    resetExceptionForm();
    setExceptionModalVisible(true);
  };

  const handleOpenShiftModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    resetShiftForm();
    setShiftModalVisible(true);
  };

  const handleSubmitException = async () => {
    try {
      setIsSubmitting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await exceptionsApi.create({
        date: toISODate(excDate),
        date_end: excDateEnd ? toISODate(excDateEnd) : undefined,
        type: excType,
        hours: excType === 'COMPENSATED_HE' ? Number(excHours) || 0 : undefined,
        minutes: excType === 'COMPENSATED_HE' ? Number(excMinutes) || 0 : undefined,
        note: excNote.trim() || undefined,
      });
      setExceptionModalVisible(false);
      showSuccess('Solicitud Enviada', 'Tu solicitud fue registrada y quedará pendiente de aprobación.');
      loadData();
    } catch (e: any) {
      const msg = e.response?.data?.message || 'No se pudo enviar la solicitud.';
      showError('Error', Array.isArray(msg) ? msg.join('\n') : String(msg));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitShift = async () => {
    try {
      setIsSubmitting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await additionalShiftsApi.create({
        date: toISODate(shiftDate),
        start_time: formatHM(shiftStart.h, shiftStart.m),
        end_time: formatHM(shiftEnd.h, shiftEnd.m),
        type: shiftType,
        note: shiftNote.trim() || undefined,
      });
      setShiftModalVisible(false);
      showSuccess('Turno Registrado', 'Tu turno adicional quedó pendiente de aprobación.');
      loadData();
    } catch (e: any) {
      const msg = e.response?.data?.message || 'No se pudo registrar el turno adicional.';
      showError('Error', Array.isArray(msg) ? msg.join('\n') : String(msg));
    } finally {
      setIsSubmitting(false);
    }
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
      <MotiView
        from={{ opacity: 0, translateY: -10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400 }}
      >
        <Text style={styles.title}>Mis Solicitudes</Text>
        <Text style={styles.subtitle}>Permisos, vacaciones y turnos adicionales</Text>
      </MotiView>

      {/* Banco de Horas */}
      <MotiView
        from={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'timing', duration: 400, delay: 100 }}
        style={styles.bankCard}
      >
        <View style={styles.bankHeaderRow}>
          <Wallet color={theme.colors.cyan} size={20} />
          <Text style={styles.bankTitle}>BANCO DE HORAS</Text>
        </View>
        <Text style={styles.bankTotal}>{bank?.total?.formatted ?? '—'}</Text>
        <Text style={styles.bankTotalLabel}>Saldo disponible para compensar</Text>

        <View style={styles.bankBreakdownRow}>
          <View style={styles.bankBreakdownCol}>
            <Text style={styles.bankBreakdownLabel}>Mes anterior</Text>
            <Text style={styles.bankBreakdownValue}>{bank?.prevMonth?.formatted ?? '—'}</Text>
          </View>
          <View style={styles.bankBreakdownCol}>
            <Text style={styles.bankBreakdownLabel}>Mes actual</Text>
            <Text style={styles.bankBreakdownValue}>{bank?.currentMonth?.formatted ?? '—'}</Text>
          </View>
          <View style={styles.bankBreakdownCol}>
            <Text style={styles.bankBreakdownLabel}>Compensado</Text>
            <Text style={styles.bankBreakdownValue}>{bank?.compensated?.formatted ?? '—'}</Text>
          </View>
        </View>
      </MotiView>

      {/* Botones de acción */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionBtnWrapper}
          onPress={handleOpenExceptionModal}
          activeOpacity={0.85}
        >
          <LinearGradient colors={theme.colors.gradients.cyan} style={styles.actionBtn}>
            <CalendarClock color="#FFF" size={17} />
            <Text style={styles.actionBtnText}>PERMISO / EXCEPCIÓN</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtnWrapper}
          onPress={handleOpenShiftModal}
          activeOpacity={0.85}
        >
          <LinearGradient colors={theme.colors.gradients.orange} style={styles.actionBtn}>
            <Zap color="#FFF" size={17} />
            <Text style={styles.actionBtnText}>TURNO ADICIONAL</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeaderRow}>
        <ClipboardList color={theme.colors.textMuted} size={16} />
        <Text style={styles.sectionHeaderText}>HISTORIAL DE SOLICITUDES</Text>
      </View>
    </View>
  );

  const renderItem = ({ item, index }: { item: MergedRequest; index: number }) => {
    const st = statusStyle(item.status);
    const [yy, mm, dd] = item.date.split('T')[0].split('-');
    const dateLabel = yy ? `${dd}/${mm}/${yy}` : item.date;
    const dateEndLabel = item.dateEnd
      ? (() => {
          const [ey, em, ed] = item.dateEnd!.split('T')[0].split('-');
          return ` — ${ed}/${em}/${ey}`;
        })()
      : '';

    return (
      <MotiView
        from={{ opacity: 0, translateY: 8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 300, delay: index * 25 }}
        style={styles.reqCard}
      >
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
          <Text style={styles.reqType}>{item.typeLabel}</Text>
          <Text style={styles.reqDate}>
            {dateLabel}
            {dateEndLabel}
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
    <View style={styles.container}>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={mergedList}
        keyExtractor={(item) => item.key}
        ListHeaderComponent={renderHeader}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aún no tienes solicitudes registradas.</Text>
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

      {/* Modal: Permiso / Excepción */}
      <Modal visible={exceptionModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nueva Solicitud</Text>
              <TouchableOpacity onPress={() => setExceptionModalVisible(false)}>
                <X color={theme.colors.textMuted} size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>TIPO DE SOLICITUD</Text>
              <View style={styles.chipsWrap}>
                {EXCEPTION_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t.value}
                    style={[styles.chip, excType === t.value && styles.chipActive]}
                    onPress={() => setExcType(t.value)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipText, excType === t.value && styles.chipTextActive]}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.formRow}>
                <View style={styles.formCol}>
                  <Text style={styles.fieldLabel}>FECHA</Text>
                  <View style={styles.dateStepper}>
                    <TouchableOpacity onPress={() => setExcDate(addDays(excDate, -1))}>
                      <ChevronLeft color={theme.colors.textMuted} size={18} />
                    </TouchableOpacity>
                    <Text style={styles.dateStepperText}>{displayDate(excDate)}</Text>
                    <TouchableOpacity onPress={() => setExcDate(addDays(excDate, 1))}>
                      <ChevronRight color={theme.colors.textMuted} size={18} />
                    </TouchableOpacity>
                  </View>
                </View>

                {excType === 'VACATION' && (
                  <View style={styles.formCol}>
                    <Text style={styles.fieldLabel}>HASTA (OPCIONAL)</Text>
                    <View style={styles.dateStepper}>
                      <TouchableOpacity
                        onPress={() => setExcDateEnd(addDays(excDateEnd || excDate, -1))}
                      >
                        <ChevronLeft color={theme.colors.textMuted} size={18} />
                      </TouchableOpacity>
                      <Text style={styles.dateStepperText}>
                        {excDateEnd ? displayDate(excDateEnd) : '—'}
                      </Text>
                      <TouchableOpacity
                        onPress={() => setExcDateEnd(addDays(excDateEnd || excDate, 1))}
                      >
                        <ChevronRight color={theme.colors.textMuted} size={18} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>

              {excType === 'COMPENSATED_HE' && (
                <View style={styles.formRow}>
                  <View style={styles.formCol}>
                    <Text style={styles.fieldLabel}>HORAS</Text>
                    <TextInput
                      style={styles.modalInput}
                      keyboardType="number-pad"
                      value={excHours}
                      onChangeText={setExcHours}
                    />
                  </View>
                  <View style={styles.formCol}>
                    <Text style={styles.fieldLabel}>MINUTOS</Text>
                    <TextInput
                      style={styles.modalInput}
                      keyboardType="number-pad"
                      value={excMinutes}
                      onChangeText={setExcMinutes}
                    />
                  </View>
                </View>
              )}

              <Text style={styles.fieldLabel}>NOTA (OPCIONAL)</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Motivo de la solicitud..."
                placeholderTextColor={theme.colors.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={excNote}
                onChangeText={setExcNote}
              />

              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setExceptionModalVisible(false)}
                >
                  <Text style={styles.modalCancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalSaveBtn}
                  onPress={handleSubmitException}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#050A14" />
                  ) : (
                    <Text style={styles.modalSaveBtnText}>Enviar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal: Turno Adicional */}
      <Modal visible={shiftModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Turno Adicional</Text>
              <TouchableOpacity onPress={() => setShiftModalVisible(false)}>
                <X color={theme.colors.textMuted} size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>TIPO DE TURNO</Text>
              <View style={styles.chipsWrap}>
                {SHIFT_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t.value}
                    style={[styles.chip, shiftType === t.value && styles.chipActive]}
                    onPress={() => setShiftType(t.value)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[styles.chipText, shiftType === t.value && styles.chipTextActive]}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>FECHA</Text>
              <View style={styles.dateStepper}>
                <TouchableOpacity onPress={() => setShiftDate(addDays(shiftDate, -1))}>
                  <ChevronLeft color={theme.colors.textMuted} size={18} />
                </TouchableOpacity>
                <Text style={styles.dateStepperText}>{displayDate(shiftDate)}</Text>
                <TouchableOpacity onPress={() => setShiftDate(addDays(shiftDate, 1))}>
                  <ChevronRight color={theme.colors.textMuted} size={18} />
                </TouchableOpacity>
              </View>

              <View style={styles.formRow}>
                <View style={styles.formCol}>
                  <Text style={styles.fieldLabel}>HORA INICIO</Text>
                  <View style={styles.dateStepper}>
                    <TouchableOpacity
                      onPress={() => setShiftStart(stepTime(shiftStart.h, shiftStart.m, -30))}
                    >
                      <ChevronLeft color={theme.colors.textMuted} size={18} />
                    </TouchableOpacity>
                    <Text style={styles.dateStepperText}>{formatHM(shiftStart.h, shiftStart.m)}</Text>
                    <TouchableOpacity
                      onPress={() => setShiftStart(stepTime(shiftStart.h, shiftStart.m, 30))}
                    >
                      <ChevronRight color={theme.colors.textMuted} size={18} />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.formCol}>
                  <Text style={styles.fieldLabel}>HORA FIN</Text>
                  <View style={styles.dateStepper}>
                    <TouchableOpacity
                      onPress={() => setShiftEnd(stepTime(shiftEnd.h, shiftEnd.m, -30))}
                    >
                      <ChevronLeft color={theme.colors.textMuted} size={18} />
                    </TouchableOpacity>
                    <Text style={styles.dateStepperText}>{formatHM(shiftEnd.h, shiftEnd.m)}</Text>
                    <TouchableOpacity
                      onPress={() => setShiftEnd(stepTime(shiftEnd.h, shiftEnd.m, 30))}
                    >
                      <ChevronRight color={theme.colors.textMuted} size={18} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <Text style={styles.fieldLabel}>NOTA (OPCIONAL)</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Detalle del turno adicional..."
                placeholderTextColor={theme.colors.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={shiftNote}
                onChangeText={setShiftNote}
              />

              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setShiftModalVisible(false)}
                >
                  <Text style={styles.modalCancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalSaveBtn}
                  onPress={handleSubmitShift}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#050A14" />
                  ) : (
                    <Text style={styles.modalSaveBtnText}>Enviar</Text>
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

const formatHM = (h: number, m: number) => `${pad2(h)}:${pad2(m)}`;

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

    // Banco de horas
    bankCard: {
      backgroundColor: isDark ? '#0C1A30' : '#0B192C',
      borderColor: 'rgba(0, 212, 255, 0.3)',
      borderWidth: 1.5,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
      ...theme.shadows.glowPrimary,
    },
    bankHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 10,
    },
    bankTitle: {
      fontSize: 11,
      fontWeight: '800',
      color: 'rgba(255,255,255,0.75)',
      letterSpacing: 1,
    },
    bankTotal: {
      fontSize: 32,
      fontWeight: '900',
      color: '#FFFFFF',
    },
    bankTotalLabel: {
      fontSize: 11,
      color: 'rgba(255,255,255,0.6)',
      marginTop: 2,
      marginBottom: 14,
    },
    bankBreakdownRow: {
      flexDirection: 'row',
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,255,255,0.15)',
      paddingTop: 12,
    },
    bankBreakdownCol: {
      flex: 1,
    },
    bankBreakdownLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: 'rgba(255,255,255,0.6)',
    },
    bankBreakdownValue: {
      fontSize: 13,
      fontWeight: '800',
      color: '#FFFFFF',
      marginTop: 3,
    },

    // Botones de acción
    actionsRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.lg,
    },
    actionBtnWrapper: {
      flex: 1,
      borderRadius: theme.borderRadius.md,
      overflow: 'hidden',
      ...theme.shadows.card,
    },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 12,
      paddingHorizontal: 6,
    },
    actionBtnText: {
      color: '#FFF',
      fontSize: 10.5,
      fontWeight: '800',
      letterSpacing: 0.3,
      textAlign: 'center',
    },

    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: theme.spacing.md,
    },
    sectionHeaderText: {
      fontSize: 11,
      fontWeight: '800',
      color: theme.colors.textMuted,
      letterSpacing: 1,
    },

    // Request card
    reqCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.glassBorder,
      borderWidth: 1,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
      gap: 12,
      ...theme.shadows.card,
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
    reqType: {
      fontSize: 13.5,
      fontWeight: '800',
      color: theme.colors.textPrimary,
    },
    reqDate: {
      fontSize: 11.5,
      color: theme.colors.textSecondary,
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
    emptyContainer: {
      padding: theme.spacing.xl,
      alignItems: 'center',
    },
    emptyText: {
      color: theme.colors.textMuted,
      fontSize: 13,
    },

    // Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.75)',
      justifyContent: 'center',
      padding: theme.spacing.md,
    },
    modalCard: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.glassBorder,
      borderWidth: 1.5,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.lg,
      maxHeight: '90%',
      ...theme.shadows.card,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '900',
      color: theme.colors.textPrimary,
    },
    fieldLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: theme.colors.textSecondary,
      marginBottom: 6,
      marginTop: 6,
      letterSpacing: 0.5,
    },
    chipsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 6,
    },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: theme.borderRadius.md,
      backgroundColor: isDark ? '#1A2538' : '#F8FAFC',
      borderWidth: 1.5,
      borderColor: theme.colors.glassBorder,
    },
    chipActive: {
      backgroundColor: isDark ? 'rgba(0,212,255,0.15)' : 'rgba(2,132,199,0.12)',
      borderColor: theme.colors.cyan,
    },
    chipText: {
      fontSize: 11.5,
      fontWeight: '700',
      color: theme.colors.textSecondary,
    },
    chipTextActive: {
      color: theme.colors.cyan,
      fontWeight: '800',
    },
    formRow: {
      flexDirection: 'row',
      gap: 10,
    },
    formCol: {
      flex: 1,
    },
    dateStepper: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: isDark ? '#1A2538' : '#F8FAFC',
      borderColor: theme.colors.glassBorder,
      borderWidth: 1.5,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: 10,
      height: 44,
      marginBottom: 10,
    },
    dateStepperText: {
      fontSize: 12.5,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      textTransform: 'capitalize',
    },
    modalInput: {
      backgroundColor: isDark ? '#1A2538' : '#F8FAFC',
      borderColor: theme.colors.glassBorder,
      borderWidth: 1.5,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: 12,
      height: 44,
      color: theme.colors.textPrimary,
      fontSize: 13,
      marginBottom: 10,
    },
    textArea: {
      backgroundColor: isDark ? '#1A2538' : '#F8FAFC',
      borderColor: theme.colors.glassBorder,
      borderWidth: 1.5,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      color: theme.colors.textPrimary,
      fontSize: 13,
      minHeight: 90,
      marginBottom: 12,
    },
    modalActionsRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 12,
      marginTop: 6,
      marginBottom: 6,
    },
    modalCancelBtn: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: theme.borderRadius.md,
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
      borderWidth: 1.5,
      borderColor: theme.colors.glassBorder,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalCancelBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    modalSaveBtn: {
      paddingHorizontal: 24,
      paddingVertical: 10,
      borderRadius: theme.borderRadius.md,
      backgroundColor: '#00D4FF',
      justifyContent: 'center',
      alignItems: 'center',
      ...theme.shadows.glowPrimary,
    },
    modalSaveBtnText: {
      fontSize: 13,
      fontWeight: '900',
      color: '#050A14',
      letterSpacing: 0.5,
    },
  });
