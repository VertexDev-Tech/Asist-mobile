import React, { useEffect, useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Modal,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Theme } from '../../theme/theme';
import { useTheme } from '../../context/ThemeContext';
import { useAlert } from '../../context/AlertContext';
import { schedulesApi, employeesApi } from '../../services/api';
import { EmployeeItem, UserScheduleDay, ShiftSegment } from '../../types';
import {
  Clock,
  Calendar,
  Users,
  PlusCircle,
  Trash2,
  Save,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Check,
  Building,
  Home,
  Shield,
  Zap,
} from 'lucide-react-native';

const DAYS_OF_WEEK = [
  'LUNES',
  'MARTES',
  'MIÉRCOLES',
  'JUEVES',
  'VIERNES',
  'SÁBADO',
  'DOMINGO',
];

const SHIFT_TYPES: Array<{
  value: 'PRESENTIAL' | 'REMOTE' | 'GUARD' | 'FLEXIBLE';
  label: string;
}> = [
  { value: 'PRESENTIAL', label: 'Presencial' },
  { value: 'REMOTE', label: 'Remoto' },
  { value: 'GUARD', label: 'Guardia' },
  { value: 'FLEXIBLE', label: 'Flexible' },
];

const pad2 = (n: number) => String(n).padStart(2, '0');
const formatHM = (h: number, m: number) => `${pad2(h)}:${pad2(m)}`;

const stepTime = (timeStr: string, deltaMin: number): string => {
  const [hStr, mStr] = (timeStr || '08:00').split(':');
  let total = (parseInt(hStr, 10) || 0) * 60 + (parseInt(mStr, 10) || 0) + deltaMin;
  total = ((total % 1440) + 1440) % 1440;
  const nh = Math.floor(total / 60);
  const nm = total % 60;
  return formatHM(nh, nm);
};

export const AdminSchedulesScreen = () => {
  const { theme, isDark } = useTheme();
  const { showConfirm, showSuccess, showError } = useAlert();

  const [activeTab, setActiveTab] = useState<'editor' | 'global'>('editor');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Employees & Global Templates
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);

  // ── Tab 1: Editor State ───────────────────────────────────────────────────
  const [selectedEmpId, setSelectedEmpId] = useState<number | null>(null);
  const [scheduleTolerance, setScheduleTolerance] = useState('15');
  const [scheduleDays, setScheduleDays] = useState<UserScheduleDay[]>([]);
  const [editorLoading, setEditorLoading] = useState(false);

  // ── Tab 2: Global Template Modal State ────────────────────────────────────
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateTolerance, setTemplateTolerance] = useState('15');
  const [templateStart, setTemplateStart] = useState('08:00');
  const [templateEnd, setTemplateEnd] = useState('17:00');
  const [isSubmittingTemplate, setIsSubmittingTemplate] = useState(false);

  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [empList, schedList] = await Promise.all([
        employeesApi.list().catch(() => []),
        schedulesApi.list().catch(() => []),
      ]);
      setEmployees(empList || []);
      setSchedules(schedList || []);

      if (empList && empList.length > 0) {
        const firstId = empList[0].id;
        setSelectedEmpId(firstId);
        loadEmployeeSchedule(firstId);
      }
    } catch (e) {
      console.log('Error loading schedules data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadEmployeeSchedule = async (empId: number) => {
    try {
      setEditorLoading(true);
      const data = await schedulesApi.getUserSchedule(empId).catch(() => null);

      if (data && data.days && data.days.length > 0) {
        setScheduleTolerance(String(data.tolerance_min || 15));
        setScheduleDays(data.days);
      } else {
        // Default Lunes a Viernes 08:00 - 17:00
        const defaultDays: UserScheduleDay[] = DAYS_OF_WEEK.map((day, idx) => ({
          day_of_week: day,
          is_workday: idx < 5, // Lunes a Viernes activo
          shift_type: 'PRESENTIAL',
          segments: [{ start_time: '08:00', end_time: '17:00' }],
        }));
        setScheduleDays(defaultDays);
        setScheduleTolerance('15');
      }
    } catch (e) {
      console.log('Error loading user schedule:', e);
    } finally {
      setEditorLoading(false);
    }
  };

  const handleSelectEmployee = (empId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedEmpId(empId);
    loadEmployeeSchedule(empId);
  };

  const handleToggleDay = (dayIdx: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setScheduleDays((prev) => {
      const updated = [...prev];
      updated[dayIdx] = {
        ...updated[dayIdx],
        is_workday: !updated[dayIdx].is_workday,
      };
      return updated;
    });
  };

  const handleChangeShiftType = (
    dayIdx: number,
    type: 'PRESENTIAL' | 'REMOTE' | 'GUARD' | 'FLEXIBLE',
  ) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setScheduleDays((prev) => {
      const updated = [...prev];
      updated[dayIdx] = { ...updated[dayIdx], shift_type: type };
      return updated;
    });
  };

  const handleStepSegmentTime = (
    dayIdx: number,
    segIdx: number,
    field: 'start_time' | 'end_time',
    deltaMin: number,
  ) => {
    setScheduleDays((prev) => {
      const updated = [...prev];
      const day = { ...updated[dayIdx] };
      const segments = [...day.segments];
      const seg = { ...segments[segIdx] };
      seg[field] = stepTime(seg[field], deltaMin);
      segments[segIdx] = seg;
      day.segments = segments;
      updated[dayIdx] = day;
      return updated;
    });
  };

  const handleAddSegment = (dayIdx: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setScheduleDays((prev) => {
      const updated = [...prev];
      const day = { ...updated[dayIdx] };
      day.segments = [
        ...day.segments,
        { start_time: '14:00', end_time: '18:00' },
      ];
      updated[dayIdx] = day;
      return updated;
    });
  };

  const handleRemoveSegment = (dayIdx: number, segIdx: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setScheduleDays((prev) => {
      const updated = [...prev];
      const day = { ...updated[dayIdx] };
      day.segments = day.segments.filter((_, i) => i !== segIdx);
      updated[dayIdx] = day;
      return updated;
    });
  };

  const handleSaveUserSchedule = async () => {
    if (!selectedEmpId) return;
    try {
      setIsSaving(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await schedulesApi.upsertUserSchedule(selectedEmpId, {
        tolerance_min: parseInt(scheduleTolerance, 10) || 15,
        days: scheduleDays,
      });
      showSuccess('Horario Guardado', 'El horario personalizado del colaborador fue actualizado.');
    } catch (e) {
      showError('Error', 'No se pudo guardar el horario.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Tab 2: Global Template Handlers ───────────────────────────────────────
  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      showError('Campo Requerido', 'Ingresa un nombre para la plantilla.');
      return;
    }
    try {
      setIsSubmittingTemplate(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const shifts = DAYS_OF_WEEK.slice(0, 5).map((d) => ({
        day_of_week: d,
        start_time: templateStart,
        end_time: templateEnd,
        type: 'PRESENTIAL',
      }));

      await schedulesApi.create({
        name: templateName.trim(),
        tolerance_min: parseInt(templateTolerance, 10) || 15,
        shifts,
      });

      showSuccess('Plantilla Creada', `Plantilla "${templateName}" creada.`);
      setTemplateModalVisible(false);
      setTemplateName('');
      loadInitialData();
    } catch (e) {
      showError('Error', 'No se pudo crear la plantilla.');
    } finally {
      setIsSubmittingTemplate(false);
    }
  };

  const handleDeleteTemplate = (id: number, name: string) => {
    showConfirm(
      'Eliminar Plantilla',
      `¿Deseas eliminar la plantilla "${name}"?`,
      async () => {
        try {
          await schedulesApi.delete(id);
          showSuccess('Plantilla Eliminada', `"${name}" fue eliminada.`);
          loadInitialData();
        } catch (e) {
          showError('Error', 'No se pudo eliminar la plantilla.');
        }
      },
      'Eliminar',
      true,
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.cyan} />
      </View>
    );
  }

  const selectedEmpName =
    employees.find((e) => e.id === selectedEmpId)?.full_name || 'Colaborador';

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadInitialData();
            }}
            tintColor={theme.colors.cyan}
          />
        }
      >
        <Text style={styles.title}>Gestión de Horarios</Text>
        <Text style={styles.subtitle}>Editor semanal, turnos partidos y plantillas</Text>

        {/* Top Sub Tabs */}
        <View style={styles.navTabsWrapper}>
          <TouchableOpacity
            style={[styles.navTabBtn, activeTab === 'editor' && styles.navTabBtnActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab('editor');
            }}
          >
            <Users color={activeTab === 'editor' ? '#FFF' : theme.colors.textMuted} size={15} />
            <Text
              style={[
                styles.navTabBtnText,
                activeTab === 'editor' && styles.navTabBtnTextActive,
              ]}
            >
              Por Colaborador
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navTabBtn, activeTab === 'global' && styles.navTabBtnActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab('global');
            }}
          >
            <Calendar color={activeTab === 'global' ? '#FFF' : theme.colors.textMuted} size={15} />
            <Text
              style={[
                styles.navTabBtnText,
                activeTab === 'global' && styles.navTabBtnTextActive,
              ]}
            >
              Plantillas Globales
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── SUB TAB 1: Editor de Horarios por Colaborador ──────────────────── */}
        {activeTab === 'editor' && (
          <View>
            <Text style={styles.sectionLabel}>SELECCIONAR COLABORADOR</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 14 }}
            >
              {employees.map((e) => {
                const isSelected = e.id === selectedEmpId;
                return (
                  <TouchableOpacity
                    key={e.id}
                    style={[styles.empPill, isSelected && styles.empPillActive]}
                    onPress={() => handleSelectEmployee(e.id)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[styles.empPillText, isSelected && styles.empPillTextActive]}
                    >
                      {e.full_name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Tolerance Input Row */}
            <View style={styles.toleranceRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toleranceTitle}>Tolerancia de Tardanza</Text>
                <Text style={styles.toleranceSubtitle}>Minutos de gracia para {selectedEmpName}</Text>
              </View>
              <View style={styles.toleranceInputWrap}>
                <TextInput
                  style={styles.toleranceInput}
                  value={scheduleTolerance}
                  onChangeText={setScheduleTolerance}
                  keyboardType="number-pad"
                  maxLength={3}
                />
                <Text style={styles.toleranceUnit}>min</Text>
              </View>
            </View>

            {/* Days List */}
            {editorLoading ? (
              <ActivityIndicator color={theme.colors.cyan} style={{ marginVertical: 30 }} />
            ) : (
              scheduleDays.map((day, dayIdx) => (
                <MotiView
                  key={day.day_of_week}
                  from={{ opacity: 0, translateY: 10 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: 'timing', duration: 250, delay: dayIdx * 30 }}
                  style={[styles.dayCard, !day.is_workday && styles.dayCardInactive]}
                >
                  <View style={styles.dayCardHeader}>
                    <View style={styles.dayTitleRow}>
                      <Switch
                        value={day.is_workday}
                        onValueChange={() => handleToggleDay(dayIdx)}
                        trackColor={{
                          false: isDark ? '#334155' : '#CBD5E1',
                          true: theme.colors.cyan,
                        }}
                        thumbColor="#FFFFFF"
                      />
                      <Text style={[styles.dayName, !day.is_workday && { opacity: 0.6 }]}>
                        {day.day_of_week}
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.dayWorkdayBadge,
                        { color: day.is_workday ? theme.colors.emerald : theme.colors.textMuted },
                      ]}
                    >
                      {day.is_workday ? 'Laborable' : 'Descanso'}
                    </Text>
                  </View>

                  {day.is_workday && (
                    <View style={styles.dayConfigBody}>
                      {/* Shift Type Chips */}
                      <Text style={styles.smallFieldLabel}>MODALIDAD DE TRABAJO</Text>
                      <View style={styles.shiftTypesRow}>
                        {SHIFT_TYPES.map((st) => {
                          const isActive = day.shift_type === st.value;
                          const iconColor = isActive ? '#FFFFFF' : theme.colors.textMuted;
                          return (
                            <TouchableOpacity
                              key={st.value}
                              style={[
                                styles.shiftTypeChip,
                                isActive && styles.shiftTypeChipActive,
                              ]}
                              onPress={() => handleChangeShiftType(dayIdx, st.value)}
                            >
                              {st.value === 'PRESENTIAL' && <Building size={13} color={iconColor} />}
                              {st.value === 'REMOTE' && <Home size={13} color={iconColor} />}
                              {st.value === 'GUARD' && <Shield size={13} color={iconColor} />}
                              {st.value === 'FLEXIBLE' && <Zap size={13} color={iconColor} />}
                              <Text
                                style={[
                                  styles.shiftTypeChipText,
                                  isActive && styles.shiftTypeChipTextActive,
                                ]}
                              >
                                {st.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      {/* Segments / Tramos */}
                      <Text style={styles.smallFieldLabel}>HORARIOS & TRAMOS</Text>
                      {day.segments.map((seg, segIdx) => (
                        <View key={segIdx} style={styles.segmentRow}>
                          <Text style={styles.segmentIndexText}>Tramo {segIdx + 1}:</Text>

                          {/* Start Time Stepper */}
                          <View style={styles.miniStepper}>
                            <TouchableOpacity
                              onPress={() =>
                                handleStepSegmentTime(dayIdx, segIdx, 'start_time', -30)
                              }
                            >
                              <ChevronLeft color={theme.colors.textMuted} size={14} />
                            </TouchableOpacity>
                            <Text style={styles.miniStepperText}>{seg.start_time || '08:00'}</Text>
                            <TouchableOpacity
                              onPress={() =>
                                handleStepSegmentTime(dayIdx, segIdx, 'start_time', 30)
                              }
                            >
                              <ChevronRight color={theme.colors.textMuted} size={14} />
                            </TouchableOpacity>
                          </View>

                          <Text style={{ color: theme.colors.textMuted }}>a</Text>

                          {/* End Time Stepper */}
                          <View style={styles.miniStepper}>
                            <TouchableOpacity
                              onPress={() =>
                                handleStepSegmentTime(dayIdx, segIdx, 'end_time', -30)
                              }
                            >
                              <ChevronLeft color={theme.colors.textMuted} size={14} />
                            </TouchableOpacity>
                            <Text style={styles.miniStepperText}>{seg.end_time || '17:00'}</Text>
                            <TouchableOpacity
                              onPress={() =>
                                handleStepSegmentTime(dayIdx, segIdx, 'end_time', 30)
                              }
                            >
                              <ChevronRight color={theme.colors.textMuted} size={14} />
                            </TouchableOpacity>
                          </View>

                          {segIdx > 0 && (
                            <TouchableOpacity
                              onPress={() => handleRemoveSegment(dayIdx, segIdx)}
                              style={styles.removeSegBtn}
                            >
                              <Trash2 color={theme.colors.rose} size={15} />
                            </TouchableOpacity>
                          )}
                        </View>
                      ))}

                      {day.segments.length < 2 && (
                        <TouchableOpacity
                          style={styles.addSegmentBtn}
                          onPress={() => handleAddSegment(dayIdx)}
                        >
                          <PlusCircle color={theme.colors.cyan} size={14} />
                          <Text style={styles.addSegmentBtnText}>
                            + Agregar segundo tramo (Turno partido / Almuerzo)
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </MotiView>
              ))
            )}

            {/* Save Button */}
            <TouchableOpacity
              style={styles.saveScheduleCta}
              onPress={handleSaveUserSchedule}
              disabled={isSaving}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={theme.colors.gradients.cyan}
                style={styles.saveScheduleCtaInner}
              >
                {isSaving ? (
                  <ActivityIndicator color="#050A14" />
                ) : (
                  <>
                    <Save color="#FFF" size={18} />
                    <Text style={styles.saveScheduleCtaText}>
                      GUARDAR HORARIO DE {selectedEmpName.toUpperCase()}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* ── SUB TAB 2: Plantillas Globales ────────────────────────────────── */}
        {activeTab === 'global' && (
          <View>
            <TouchableOpacity
              style={styles.newTemplateBtn}
              onPress={() => setTemplateModalVisible(true)}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={theme.colors.gradients.cyan}
                style={styles.newTemplateBtnInner}
              >
                <PlusCircle color="#FFF" size={18} />
                <Text style={styles.newTemplateBtnText}>+ NUEVA PLANTILLA GLOBAL</Text>
              </LinearGradient>
            </TouchableOpacity>

            {schedules.map((sched, index) => (
              <MotiView
                key={sched.id || index}
                from={{ opacity: 0, translateY: 15 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 350, delay: index * 50 }}
                style={styles.scheduleCard}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.iconCircle}>
                    <Clock color={theme.colors.cyan} size={20} />
                  </View>
                  <View style={styles.headerInfo}>
                    <Text style={styles.scheduleName}>{sched.name || 'Horario General'}</Text>
                    <Text style={styles.scheduleType}>
                      Tolerancia: {sched.tolerance_min || 15} min
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDeleteTemplate(sched.id, sched.name)}
                    style={styles.deleteTemplateBtn}
                  >
                    <Trash2 color={theme.colors.rose} size={18} />
                  </TouchableOpacity>
                </View>

                {sched.shifts && sched.shifts.length > 0 && (
                  <View style={styles.shiftsContainer}>
                    <Text style={styles.shiftsLabel}>TURNOS CONFIGURADOS:</Text>
                    {sched.shifts.map((shift: any, sIdx: number) => (
                      <View key={shift.id || sIdx} style={styles.shiftRow}>
                        <Text style={styles.shiftDay}>{shift.day_of_week}</Text>
                        <Text style={styles.shiftTime}>
                          {shift.start_time?.slice(0, 5)} - {shift.end_time?.slice(0, 5)}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </MotiView>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ── Modal: Nueva Plantilla Global ──────────────────────────────────── */}
      <Modal visible={templateModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nueva Plantilla de Horario</Text>
              <TouchableOpacity onPress={() => setTemplateModalVisible(false)}>
                <X color={theme.colors.textMuted} size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>NOMBRE DE LA PLANTILLA *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. Administrativo Turno Mañana"
                placeholderTextColor={theme.colors.textMuted}
                value={templateName}
                onChangeText={setTemplateName}
              />

              <Text style={styles.fieldLabel}>TOLERANCIA (MINUTOS)</Text>
              <TextInput
                style={styles.input}
                placeholder="15"
                placeholderTextColor={theme.colors.textMuted}
                value={templateTolerance}
                onChangeText={setTemplateTolerance}
                keyboardType="number-pad"
              />

              <View style={styles.formRow}>
                <View style={styles.formCol}>
                  <Text style={styles.fieldLabel}>HORA ENTRADA</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="08:00"
                    placeholderTextColor={theme.colors.textMuted}
                    value={templateStart}
                    onChangeText={setTemplateStart}
                  />
                </View>

                <View style={styles.formCol}>
                  <Text style={styles.fieldLabel}>HORA SALIDA</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="17:00"
                    placeholderTextColor={theme.colors.textMuted}
                    value={templateEnd}
                    onChangeText={setTemplateEnd}
                  />
                </View>
              </View>

              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setTemplateModalVisible(false)}
                >
                  <Text style={styles.modalCancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalSaveBtn}
                  onPress={handleSaveTemplate}
                  disabled={isSubmittingTemplate}
                >
                  {isSubmittingTemplate ? (
                    <ActivityIndicator color="#050A14" />
                  ) : (
                    <Text style={styles.modalSaveBtnText}>Crear Plantilla</Text>
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
    title: {
      fontSize: 26,
      fontWeight: '900',
      color: theme.colors.textPrimary,
    },
    subtitle: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.lg,
      marginTop: 2,
    },

    // Sub Tabs
    navTabsWrapper: {
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
    navTabBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: theme.borderRadius.md,
    },
    navTabBtnActive: {
      backgroundColor: theme.colors.cyan,
    },
    navTabBtnText: {
      fontSize: 12,
      fontWeight: '800',
      color: theme.colors.textMuted,
    },
    navTabBtnTextActive: {
      color: '#FFFFFF',
    },

    sectionLabel: {
      fontSize: 11,
      fontWeight: '800',
      color: theme.colors.textMuted,
      letterSpacing: 1,
      marginBottom: 8,
    },
    empPill: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.glassBorder,
      borderWidth: 1,
      marginRight: 8,
    },
    empPillActive: {
      backgroundColor: theme.colors.cyan,
      borderColor: theme.colors.cyan,
    },
    empPillText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    empPillTextActive: {
      color: '#050A14',
      fontWeight: '900',
    },

    // Tolerance Row
    toleranceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.glassBorder,
      borderWidth: 1,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      ...theme.shadows.card,
    },
    toleranceTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: theme.colors.textPrimary,
    },
    toleranceSubtitle: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    toleranceInputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: theme.borderRadius.md,
      gap: 4,
    },
    toleranceInput: {
      fontSize: 14,
      fontWeight: '900',
      color: theme.colors.cyan,
      minWidth: 28,
      textAlign: 'center',
    },
    toleranceUnit: {
      fontSize: 11,
      color: theme.colors.textMuted,
      fontWeight: '700',
    },

    // Day Card
    dayCard: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.glassBorder,
      borderWidth: 1,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      ...theme.shadows.card,
    },
    dayCardInactive: {
      opacity: 0.65,
    },
    dayCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    dayTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    dayName: {
      fontSize: 14,
      fontWeight: '800',
      color: theme.colors.textPrimary,
    },
    dayWorkdayBadge: {
      fontSize: 11,
      fontWeight: '800',
    },
    dayConfigBody: {
      marginTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.colors.glassBorder,
      paddingTop: 12,
    },
    smallFieldLabel: {
      fontSize: 9.5,
      fontWeight: '800',
      color: theme.colors.textMuted,
      letterSpacing: 0.8,
      marginBottom: 6,
      marginTop: 6,
    },
    shiftTypesRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 10,
    },
    shiftTypeChip: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6',
    },
    shiftTypeChipActive: {
      backgroundColor: theme.colors.cyan,
    },
    shiftTypeChipText: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.textMuted,
    },
    shiftTypeChipTextActive: {
      color: '#FFFFFF',
      fontWeight: '900',
    },
    segmentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    segmentIndexText: {
      fontSize: 11.5,
      fontWeight: '700',
      color: theme.colors.textSecondary,
      width: 60,
    },
    miniStepper: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 6,
    },
    miniStepperText: {
      fontSize: 12,
      fontWeight: '800',
      color: theme.colors.textPrimary,
    },
    removeSegBtn: {
      padding: 6,
    },
    addSegmentBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 4,
      paddingVertical: 6,
    },
    addSegmentBtnText: {
      fontSize: 11.5,
      fontWeight: '700',
      color: theme.colors.cyan,
    },
    saveScheduleCta: {
      borderRadius: theme.borderRadius.xl,
      overflow: 'hidden',
      marginTop: 10,
      marginBottom: 30,
      ...theme.shadows.glowPrimary,
    },
    saveScheduleCtaInner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
    },
    saveScheduleCtaText: {
      color: '#FFFFFF',
      fontSize: 12.5,
      fontWeight: '900',
      letterSpacing: 0.5,
    },

    // Global Templates View
    newTemplateBtn: {
      borderRadius: theme.borderRadius.md,
      overflow: 'hidden',
      marginBottom: theme.spacing.lg,
      ...theme.shadows.glowPrimary,
    },
    newTemplateBtnInner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
    },
    newTemplateBtnText: {
      color: '#FFF',
      fontSize: 12,
      fontWeight: '900',
      letterSpacing: 0.5,
    },
    scheduleCard: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.glassBorder,
      borderWidth: 1,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      ...theme.shadows.card,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDark ? 'rgba(0, 212, 255, 0.15)' : 'rgba(2, 132, 199, 0.12)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing.md,
    },
    headerInfo: {
      flex: 1,
    },
    scheduleName: {
      fontSize: 15,
      fontWeight: '800',
      color: theme.colors.textPrimary,
    },
    scheduleType: {
      fontSize: 11.5,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    deleteTemplateBtn: {
      padding: 8,
    },
    shiftsContainer: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.glassBorder,
      paddingTop: theme.spacing.sm,
      marginTop: theme.spacing.sm,
    },
    shiftsLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: theme.colors.textMuted,
      letterSpacing: 1,
      marginBottom: 6,
    },
    shiftRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 3,
    },
    shiftDay: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.textSecondary,
    },
    shiftTime: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.cyan,
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
    formRow: {
      flexDirection: 'row',
      gap: 10,
    },
    formCol: {
      flex: 1,
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
