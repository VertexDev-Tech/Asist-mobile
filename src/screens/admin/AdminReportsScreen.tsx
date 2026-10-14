import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Modal,
  Image,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { Theme } from '../../theme/theme';
import { useTheme } from '../../context/ThemeContext';
import { useAlert } from '../../context/AlertContext';
import { useAuth } from '../../context/AuthContext';
import {
  dashboardApi,
  attendanceApi,
  employeesApi,
  API_BASE_URL,
} from '../../services/api';
import {
  RankingItem,
  TopLateItem,
  WeeklyStat,
  HourlyCount,
  AttendanceLogItem,
  EmployeeItem,
} from '../../types';
import { SimpleBarChart } from '../../components/SimpleBarChart';
import { HourlyBarChart } from '../../components/HourlyBarChart';
import {
  Award,
  Clock,
  TrendingUp,
  AlertTriangle,
  FileSpreadsheet,
  Calendar,
  Filter,
  User,
  PlusCircle,
  Pencil,
  Trash2,
  Camera,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Image as ImageIcon,
  Layers,
  MapPin,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

const pad2 = (n: number) => String(n).padStart(2, '0');
const toISODate = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const addDays = (d: Date, n: number) => {
  const nd = new Date(d);
  nd.setDate(nd.getDate() + n);
  return nd;
};
const displayDate = (d: Date) =>
  d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });

type ReportTab = 'logs' | 'metrics' | 'gallery';

export const AdminReportsScreen = () => {
  const { token } = useAuth();
  const { theme, isDark } = useTheme();
  const { showConfirm, showSuccess, showError } = useAlert();

  // Active Top Tab
  const [activeTab, setActiveTab] = useState<ReportTab>('logs');

  // Loading States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Common Data
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);

  // ── Tab 1: Logs / Auditoría State ──────────────────────────────────────────
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d;
  });
  const [dateTo, setDateTo] = useState(() => new Date());
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [logs, setLogs] = useState<AttendanceLogItem[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // ── Tab 2: Métricas & Ranking State ────────────────────────────────────────
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [topLate, setTopLate] = useState<TopLateItem[]>([]);
  const [monthlyChart, setMonthlyChart] = useState<WeeklyStat[]>([]);
  const [hourly, setHourly] = useState<HourlyCount[]>([]);
  const [metricsLoading, setMetricsLoading] = useState(false);

  // ── Tab 3: Galería State ───────────────────────────────────────────────────
  const [galleryMonth, setGalleryMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [galleryEmpId, setGalleryEmpId] = useState<string>('');
  const [photos, setPhotos] = useState<any[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);

  // ── Modals State ───────────────────────────────────────────────────────────
  // Photo Preview Modal
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<any | null>(null);

  // Manual Mark Modal
  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [manualEmpId, setManualEmpId] = useState<number | null>(null);
  const [manualType, setManualType] = useState<'ENTRADA' | 'SALIDA'>('ENTRADA');
  const [manualDate, setManualDate] = useState(() => new Date());
  const [manualTime, setManualTime] = useState({ h: 8, m: 0 });
  const [manualNote, setManualNote] = useState('');
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  // Edit Log Modal
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingLog, setEditingLog] = useState<AttendanceLogItem | null>(null);
  const [editDate, setEditDate] = useState(() => new Date());
  const [editTime, setEditTime] = useState({ h: 8, m: 0 });
  const [editNote, setEditNote] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [empList] = await Promise.all([
        employeesApi.list().catch(() => []),
        loadLogs(),
      ]);
      setEmployees(empList || []);
    } catch (e) {
      console.log('Error initializing reports:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadLogs = async () => {
    try {
      setLogsLoading(true);
      const from = toISODate(dateFrom);
      const to = toISODate(dateTo);
      const data = await attendanceApi.getLogs({
        from,
        to,
        employeeId: selectedEmpId || undefined,
        type: selectedType || undefined,
      });
      setLogs(Array.isArray(data) ? data : []);
    } catch (e) {
      console.log('Error loading logs:', e);
    } finally {
      setLogsLoading(false);
    }
  };

  const loadMetrics = async () => {
    try {
      setMetricsLoading(true);
      const [rData, tData, mData, hData] = await Promise.all([
        dashboardApi.getRanking().catch(() => []),
        dashboardApi.getTopLate().catch(() => []),
        dashboardApi.getMonthlyPunctuality().catch(() => []),
        dashboardApi.getHourlyDistribution().catch(() => []),
      ]);
      setHourly(Array.isArray(hData) ? hData : []);
      setRanking(Array.isArray(rData) ? rData : []);
      setTopLate(Array.isArray(tData) ? tData : []);
      setMonthlyChart(Array.isArray(mData) ? mData : []);
    } catch (e) {
      console.log('Error loading metrics:', e);
    } finally {
      setMetricsLoading(false);
    }
  };

  const loadGallery = async () => {
    try {
      setGalleryLoading(true);
      const data = await attendanceApi.getPhotos({
        month: galleryMonth,
        employee_id: galleryEmpId || undefined,
      });
      setPhotos(Array.isArray(data) ? data : []);
    } catch (e) {
      console.log('Error loading gallery photos:', e);
    } finally {
      setGalleryLoading(false);
    }
  };

  // Lazy load metrics when navigating to metrics tab
  useEffect(() => {
    if (activeTab === 'metrics') {
      loadMetrics();
    }
  }, [activeTab]);

  // Lazy load gallery when navigating to gallery tab or changing month/emp
  useEffect(() => {
    if (activeTab === 'gallery') {
      loadGallery();
    }
  }, [activeTab, galleryMonth, galleryEmpId]);

  const handleExportReport = async () => {
    if (exporting) return;
    try {
      setExporting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const from = toISODate(dateFrom);
      const to = toISODate(dateTo);

      const fileUri = `${FileSystem.documentDirectory}reporte-asistencia-${to}.xlsx`;
      const result = await FileSystem.downloadAsync(
        `${API_BASE_URL}/dashboard/report/export?from=${from}&to=${to}`,
        fileUri,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
      );

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(result.uri, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: 'Reporte de Asistencia',
        });
      } else {
        showSuccess('Reporte Descargado', `Guardado en: ${result.uri}`);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showError('Error', 'No se pudo generar el reporte en Excel.');
    } finally {
      setExporting(false);
    }
  };

  // ── Manual Mark Handlers ──────────────────────────────────────────────────
  const handleOpenManualModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setManualEmpId(employees.length > 0 ? employees[0].id : null);
    setManualType('ENTRADA');
    setManualDate(new Date());
    const now = new Date();
    setManualTime({ h: now.getHours(), m: now.getMinutes() });
    setManualNote('');
    setManualModalVisible(true);
  };

  const handleSaveManualMark = async () => {
    if (!manualEmpId) {
      showError('Error', 'Selecciona un colaborador.');
      return;
    }
    try {
      setIsSubmittingManual(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const combined = new Date(manualDate);
      combined.setHours(manualTime.h, manualTime.m, 0, 0);

      await attendanceApi.manualMark({
        employee_id: manualEmpId,
        type: manualType,
        timestamp: combined.toISOString(),
        justification: manualNote.trim() || undefined,
      });

      showSuccess('Marcación Registrada', 'Se registró la marcación manual con éxito.');
      setManualModalVisible(false);
      loadLogs();
    } catch (e: any) {
      const msg = e.response?.data?.message || 'No se pudo registrar la marcación.';
      showError('Error', Array.isArray(msg) ? msg.join('\n') : String(msg));
    } finally {
      setIsSubmittingManual(false);
    }
  };

  // ── Edit Log Handlers ────────────────────────────────────────────────────
  const handleOpenEditLog = (item: AttendanceLogItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingLog(item);
    const d = item.timestamp ? new Date(item.timestamp) : new Date();
    setEditDate(d);
    setEditTime({ h: d.getHours(), m: d.getMinutes() });
    setEditNote(item.justification?.replace('[Editado por admin]: ', '') || '');
    setEditModalVisible(true);
  };

  const handleSaveEditLog = async () => {
    if (!editingLog) return;
    try {
      setIsSubmittingEdit(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const combined = new Date(editDate);
      combined.setHours(editTime.h, editTime.m, 0, 0);

      await attendanceApi.update(editingLog.id, {
        timestamp: combined.toISOString(),
        note: editNote.trim() || undefined,
      });

      showSuccess('Registro Actualizado', 'Se modificó la marcación correctamente.');
      setEditModalVisible(false);
      loadLogs();
    } catch (e: any) {
      showError('Error', 'No se pudo actualizar el registro.');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleDeleteLog = (item: AttendanceLogItem) => {
    showConfirm(
      'Eliminar Registro',
      `¿Deseas eliminar la marcación de ${item.employee?.full_name || 'Empleado'} (${item.type})?`,
      async () => {
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          await attendanceApi.delete(item.id);
          showSuccess('Registro Eliminado', 'La marcación ha sido eliminada.');
          loadLogs();
        } catch (e) {
          showError('Error', 'No se pudo eliminar la marcación.');
        }
      },
      'Eliminar',
      true,
    );
  };

  // ── Computed Log KPIs ─────────────────────────────────────────────────────
  const logStats = useMemo(() => {
    const total = logs.length;
    const puntual = logs.filter((l) => !l.is_late && !l.is_manual).length;
    const tardanza = logs.filter((l) => l.is_late).length;
    const conFoto = logs.filter((l) => !!l.selfie_url).length;
    return { total, puntual, tardanza, conFoto };
  }, [logs]);

  // ── Render Header ─────────────────────────────────────────────────────────
  const renderHeader = () => (
    <View>
      <MotiView
        from={{ opacity: 0, translateY: -10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400 }}
      >
        <Text style={styles.title}>Auditoría & Reportes</Text>
        <Text style={styles.subtitle}>Supervisión consolidada, métricas y fotos</Text>
      </MotiView>

      {/* Top Navigation Tabs */}
      <View style={styles.navTabsWrapper}>
        <TouchableOpacity
          style={[styles.navTabBtn, activeTab === 'logs' && styles.navTabBtnActive]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTab('logs');
          }}
        >
          <Layers color={activeTab === 'logs' ? '#FFF' : theme.colors.textMuted} size={15} />
          <Text style={[styles.navTabBtnText, activeTab === 'logs' && styles.navTabBtnTextActive]}>
            Auditoría
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navTabBtn, activeTab === 'metrics' && styles.navTabBtnActive]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTab('metrics');
          }}
        >
          <TrendingUp
            color={activeTab === 'metrics' ? '#FFF' : theme.colors.textMuted}
            size={15}
          />
          <Text
            style={[styles.navTabBtnText, activeTab === 'metrics' && styles.navTabBtnTextActive]}
          >
            Métricas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navTabBtn, activeTab === 'gallery' && styles.navTabBtnActive]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTab('gallery');
          }}
        >
          <ImageIcon color={activeTab === 'gallery' ? '#FFF' : theme.colors.textMuted} size={15} />
          <Text
            style={[styles.navTabBtnText, activeTab === 'gallery' && styles.navTabBtnTextActive]}
          >
            Galería
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Specific Headers */}
      {activeTab === 'logs' && (
        <View style={styles.tabHeaderContent}>
          {/* Quick Action Button: Marcación Manual */}
          <View style={styles.actionsBarRow}>
            <TouchableOpacity
              style={styles.manualMarkCtaBtn}
              onPress={handleOpenManualModal}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={theme.colors.gradients.cyan}
                style={styles.manualMarkCtaInner}
              >
                <PlusCircle color="#FFF" size={17} />
                <Text style={styles.manualMarkCtaText}>MARCACIÓN MANUAL</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.exportXlsxBtn}
              onPress={handleExportReport}
              disabled={exporting}
              activeOpacity={0.85}
            >
              {exporting ? (
                <ActivityIndicator color={theme.colors.cyan} size="small" />
              ) : (
                <>
                  <FileSpreadsheet color={theme.colors.emerald} size={17} />
                  <Text style={styles.exportXlsxBtnText}>EXCEL</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Filter Card */}
          <View style={styles.filterCard}>
            <View style={styles.filterDatesRow}>
              <View style={styles.datePickerGroup}>
                <Text style={styles.filterLabel}>DESDE</Text>
                <View style={styles.stepperRow}>
                  <TouchableOpacity onPress={() => setDateFrom(addDays(dateFrom, -1))}>
                    <ChevronLeft color={theme.colors.textMuted} size={16} />
                  </TouchableOpacity>
                  <Text style={styles.stepperText}>{displayDate(dateFrom)}</Text>
                  <TouchableOpacity onPress={() => setDateFrom(addDays(dateFrom, 1))}>
                    <ChevronRight color={theme.colors.textMuted} size={16} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.datePickerGroup}>
                <Text style={styles.filterLabel}>HASTA</Text>
                <View style={styles.stepperRow}>
                  <TouchableOpacity onPress={() => setDateTo(addDays(dateTo, -1))}>
                    <ChevronLeft color={theme.colors.textMuted} size={16} />
                  </TouchableOpacity>
                  <Text style={styles.stepperText}>{displayDate(dateTo)}</Text>
                  <TouchableOpacity onPress={() => setDateTo(addDays(dateTo, 1))}>
                    <ChevronRight color={theme.colors.textMuted} size={16} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Type Selector Chips */}
            <View style={styles.chipsRow}>
              {['', 'ENTRADA', 'SALIDA'].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.filterChip, selectedType === t && styles.filterChipActive]}
                  onPress={() => setSelectedType(t)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedType === t && styles.filterChipTextActive,
                    ]}
                  >
                    {t === '' ? 'Todos los tipos' : t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.applyFilterBtn}
              onPress={loadLogs}
              activeOpacity={0.8}
            >
              <Filter color="#FFF" size={15} />
              <Text style={styles.applyFilterBtnText}>Filtrar Marcaciones</Text>
            </TouchableOpacity>
          </View>

          {/* Summary KPI Grid */}
          <View style={styles.kpiRow}>
            <View style={styles.kpiBox}>
              <Text style={styles.kpiBoxNum}>{logStats.total}</Text>
              <Text style={styles.kpiBoxLabel}>TOTAL</Text>
            </View>
            <View style={styles.kpiBox}>
              <Text style={[styles.kpiBoxNum, { color: theme.colors.emerald }]}>
                {logStats.puntual}
              </Text>
              <Text style={styles.kpiBoxLabel}>PUNTUALES</Text>
            </View>
            <View style={styles.kpiBox}>
              <Text style={[styles.kpiBoxNum, { color: theme.colors.orange }]}>
                {logStats.tardanza}
              </Text>
              <Text style={styles.kpiBoxLabel}>TARDANZAS</Text>
            </View>
            <View style={styles.kpiBox}>
              <Text style={[styles.kpiBoxNum, { color: theme.colors.cyan }]}>
                {logStats.conFoto}
              </Text>
              <Text style={styles.kpiBoxLabel}>CON FOTO</Text>
            </View>
          </View>
        </View>
      )}

      {activeTab === 'gallery' && (
        <View style={styles.tabHeaderContent}>
          <Text style={styles.galleryMonthTitle}>
            Fotos del Mes: <Text style={{ color: theme.colors.cyan }}>{galleryMonth}</Text>
          </Text>
        </View>
      )}
    </View>
  );

  // ── Tab 1: Render Attendance Log Item ──────────────────────────────────────
  const renderLogItem = ({ item, index }: { item: AttendanceLogItem; index: number }) => {
    const isEntrada = item.type === 'ENTRADA';
    const isLate = item.is_late;
    const isManual = item.is_manual;

    const timeStr = item.timestamp
      ? new Date(item.timestamp).toLocaleTimeString('es-PE', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      : '—';
    const dateStr = item.timestamp ? displayDate(new Date(item.timestamp)) : '—';

    return (
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 250, delay: Math.min(index, 6) * 30 }}
        style={styles.logCard}
      >
        <View style={styles.logCardMain}>
          {/* Avatar or Photo Thumbnail */}
          {item.selfie_url ? (
            <TouchableOpacity
              onPress={() => {
                setSelectedPhoto(item);
                setPhotoModalVisible(true);
              }}
              activeOpacity={0.8}
            >
              <Image source={{ uri: item.selfie_url }} style={styles.selfieThumb} />
            </TouchableOpacity>
          ) : (
            <View
              style={[
                styles.avatarCircle,
                { backgroundColor: isEntrada ? theme.colors.emerald : theme.colors.rose },
              ]}
            >
              <Text style={styles.avatarText}>
                {item.employee?.full_name ? item.employee.full_name.charAt(0).toUpperCase() : 'E'}
              </Text>
            </View>
          )}

          <View style={styles.logInfoCol}>
            <View style={styles.logHeaderRow}>
              <Text style={styles.logEmpName}>
                {item.employee?.full_name || `Colaborador #${item.employee_id}`}
              </Text>
              <View
                style={[
                  styles.typePill,
                  {
                    backgroundColor: isEntrada
                      ? 'rgba(16, 185, 129, 0.15)'
                      : 'rgba(239, 68, 68, 0.15)',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.typePillText,
                    { color: isEntrada ? theme.colors.emerald : theme.colors.rose },
                  ]}
                >
                  {item.type}
                </Text>
              </View>
            </View>

            <View style={styles.dateTimeMetaRow}>
              <Calendar color={theme.colors.textMuted} size={13} />
              <Text style={styles.logTimeMeta}>{dateStr}</Text>
              <Text style={styles.logTimeDot}>·</Text>
              <Clock color={theme.colors.textMuted} size={13} />
              <Text style={styles.logTimeMeta}>{timeStr}</Text>
            </View>

            {/* Badges Row */}
            <View style={styles.statusBadgesRow}>
              {isManual ? (
                <View style={[styles.badgePill, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                  <Pencil size={11} color={theme.colors.violet} />
                  <Text style={[styles.badgePillText, { color: theme.colors.violet }]}>
                    Manual
                  </Text>
                </View>
              ) : isLate ? (
                <View style={[styles.badgePill, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                  <Clock size={11} color={theme.colors.orange} />
                  <Text style={[styles.badgePillText, { color: theme.colors.orange }]}>
                    Tardanza
                  </Text>
                </View>
              ) : (
                <View style={[styles.badgePill, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                  <CheckCircle2 size={11} color={theme.colors.emerald} />
                  <Text style={[styles.badgePillText, { color: theme.colors.emerald }]}>
                    Puntual
                  </Text>
                </View>
              )}

              {!!item.justification && (
                <Text style={styles.justificationText} numberOfLines={1}>
                  {item.justification}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Action Buttons Row */}
        <View style={styles.logActionsRow}>
          {item.selfie_url && (
            <TouchableOpacity
              style={styles.actionPillBtn}
              onPress={() => {
                setSelectedPhoto(item);
                setPhotoModalVisible(true);
              }}
            >
              <Camera color={theme.colors.cyan} size={15} />
              <Text style={styles.actionPillBtnText}>Foto</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.actionPillBtn}
            onPress={() => handleOpenEditLog(item)}
          >
            <Pencil color={theme.colors.amber} size={15} />
            <Text style={[styles.actionPillBtnText, { color: theme.colors.amber }]}>Editar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionPillBtn}
            onPress={() => handleDeleteLog(item)}
          >
            <Trash2 color={theme.colors.rose} size={15} />
            <Text style={[styles.actionPillBtnText, { color: theme.colors.rose }]}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      </MotiView>
    );
  };

  // ── Tab 2: Render Metrics View ─────────────────────────────────────────────
  const renderMetricsView = () => (
    <View style={{ width: '100%' }}>
      {/* Monthly Chart */}
      <View style={styles.sectionHeader}>
        <TrendingUp color={theme.colors.cyan} size={18} />
        <Text style={styles.sectionTitle}>TENDENCIA MENSUAL DE PUNTUALIDAD</Text>
      </View>
      <SimpleBarChart data={monthlyChart} height={160} />

      {/* Hourly distribution of today's marks */}
      <View style={styles.sectionHeader}>
        <Clock color={theme.colors.cyan} size={18} />
        <Text style={styles.sectionTitle}>MARCACIONES DE HOY POR HORA</Text>
      </View>
      <HourlyBarChart data={hourly} height={140} />

      {/* Top 5 Ranking of Punctual Employees */}
      <View style={styles.sectionHeader}>
        <Award color={theme.colors.emerald} size={18} />
        <Text style={styles.sectionTitle}>TOP 5 COLABORADORES DESTACADOS</Text>
      </View>

      {ranking && ranking.length > 0 ? (
        ranking.slice(0, 5).map((item, i) => {
          const score = item.score ?? item.punctuality_percent ?? 100;
          const badgeColors = [
            '#F59E0B',
            '#94A3B8',
            '#B45309',
            theme.colors.cyan,
            theme.colors.cyan,
          ];

          return (
            <MotiView
              key={item.id || i}
              from={{ opacity: 0, translateX: -10 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: 'timing', duration: 250, delay: Math.min(i, 5) * 40 }}
              style={styles.rankingCard}
            >
              <View
                style={[
                  styles.rankBadge,
                  { backgroundColor: badgeColors[i] || theme.colors.cyan },
                ]}
              >
                <Text style={styles.rankBadgeText}>#{i + 1}</Text>
              </View>

              <View style={styles.rankInfo}>
                <Text style={styles.rankName}>{item.full_name || item.name}</Text>
                <Text style={styles.rankDetails}>
                  {item.position || 'Colaborador'} | {item.onTimeCount ?? item.punctual ?? 0}{' '}
                  asistencias perfectas
                </Text>
              </View>

              <View style={styles.scorePill}>
                <Text style={styles.scoreText}>{score}%</Text>
              </View>
            </MotiView>
          );
        })
      ) : (
        <Text style={styles.emptyText}>Sin datos de ranking disponibles este mes.</Text>
      )}

      {/* Top Late Employees List */}
      {topLate && topLate.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Clock color={theme.colors.amber} size={18} />
            <Text style={styles.sectionTitle}>RECURRENTES EN TARDANZA</Text>
          </View>

          {topLate.slice(0, 5).map((item, i) => (
            <MotiView
              key={item.id || i}
              from={{ opacity: 0, translateX: 10 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: 'timing', duration: 250, delay: Math.min(i, 5) * 40 }}
              style={styles.topLateCard}
            >
              <AlertTriangle color={theme.colors.amber} size={20} />
              <View style={styles.topLateInfo}>
                <Text style={styles.topLateName}>{item.employee_name || item.full_name}</Text>
                <Text style={styles.topLateDetails}>
                  {item.late_count ?? item.lateCount ?? 0} tardanzas
                  {item.minutesLateTotal ? ` (${item.minutesLateTotal} min acumulados)` : ''}
                </Text>
              </View>
            </MotiView>
          ))}
        </>
      )}
    </View>
  );

  // ── Tab 3: Render Gallery Grid Item ───────────────────────────────────────
  const renderPhotoItem = ({ item }: { item: any }) => {
    const photoUri = item.url || item.selfie_url;
    const empName = item.employee?.full_name || item.employee_name || 'Colaborador';
    const dateVal = item.created_at || item.timestamp || item.date;
    const timeStr = dateVal
      ? new Date(dateVal).toLocaleTimeString('es-PE', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '';

    return (
      <TouchableOpacity
        style={styles.galleryCard}
        onPress={() => {
          setSelectedPhoto(item);
          setPhotoModalVisible(true);
        }}
        activeOpacity={0.85}
      >
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.galleryImage} resizeMode="cover" />
        ) : (
          <View
            style={[
              styles.galleryImage,
              {
                backgroundColor: isDark ? '#1E293B' : '#E2E8F0',
                justifyContent: 'center',
                alignItems: 'center',
              },
            ]}
          >
            <Camera size={26} color={theme.colors.textMuted} />
          </View>
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.85)']}
          style={styles.galleryOverlay}
        >
          <Text style={styles.galleryEmpName} numberOfLines={1}>
            {empName}
          </Text>
          <Text style={styles.galleryTimeMeta}>
            {item.type || 'MARCACIÓN'} {timeStr ? `· ${timeStr}` : ''}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
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
      {activeTab === 'logs' && (
        <FlatList
          data={logs}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderHeader}
          renderItem={renderLogItem}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={Platform.OS === 'android'}
          ListEmptyComponent={
            logsLoading ? (
              <ActivityIndicator color={theme.colors.cyan} style={{ marginVertical: 30 }} />
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No hay marcaciones en el rango seleccionado.</Text>
              </View>
            )
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadLogs().then(() => setRefreshing(false));
              }}
              tintColor={theme.colors.cyan}
            />
          }
        />
      )}

      {activeTab === 'metrics' && (
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadMetrics().then(() => setRefreshing(false));
              }}
              tintColor={theme.colors.cyan}
            />
          }
        >
          {renderHeader()}
          {metricsLoading ? (
            <ActivityIndicator color={theme.colors.cyan} size="large" style={{ marginVertical: 40 }} />
          ) : (
            renderMetricsView()
          )}
        </ScrollView>
      )}

      {activeTab === 'gallery' && (
        <FlatList
          data={photos}
          keyExtractor={(item, idx) => String(item.id || item.url || idx)}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderHeader}
          renderItem={renderPhotoItem}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={5}
          ListEmptyComponent={
            galleryLoading ? (
              <ActivityIndicator color={theme.colors.cyan} style={{ marginVertical: 30 }} />
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No hay fotos disponibles para este mes.</Text>
              </View>
            )
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadGallery().then(() => setRefreshing(false));
              }}
              tintColor={theme.colors.cyan}
            />
          }
        />
      )}

      {/* ── Modal: Marcación Manual por Admin ──────────────────────────────── */}
      <Modal visible={manualModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Marcación Manual (Admin)</Text>
              <TouchableOpacity onPress={() => setManualModalVisible(false)}>
                <X color={theme.colors.textMuted} size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>COLABORADOR *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {employees.map((e) => (
                  <TouchableOpacity
                    key={e.id}
                    style={[styles.empChip, manualEmpId === e.id && styles.empChipActive]}
                    onPress={() => setManualEmpId(e.id)}
                  >
                    <Text
                      style={[styles.empChipText, manualEmpId === e.id && styles.empChipTextActive]}
                    >
                      {e.full_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.fieldLabel}>TIPO DE MARCACIÓN *</Text>
              <View style={styles.chipsRow}>
                {(['ENTRADA', 'SALIDA'] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeSelectBtn, manualType === t && styles.typeSelectBtnActive]}
                    onPress={() => setManualType(t)}
                  >
                    <Text
                      style={[
                        styles.typeSelectBtnText,
                        manualType === t && styles.typeSelectBtnTextActive,
                      ]}
                    >
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.formRow}>
                <View style={styles.formCol}>
                  <Text style={styles.fieldLabel}>FECHA</Text>
                  <View style={styles.stepperRow}>
                    <TouchableOpacity onPress={() => setManualDate(addDays(manualDate, -1))}>
                      <ChevronLeft color={theme.colors.textMuted} size={16} />
                    </TouchableOpacity>
                    <Text style={styles.stepperText}>{displayDate(manualDate)}</Text>
                    <TouchableOpacity onPress={() => setManualDate(addDays(manualDate, 1))}>
                      <ChevronRight color={theme.colors.textMuted} size={16} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.formCol}>
                  <Text style={styles.fieldLabel}>HORA (HH:MM)</Text>
                  <View style={styles.stepperRow}>
                    <TouchableOpacity
                      onPress={() => {
                        let h = manualTime.h;
                        let m = manualTime.m - 15;
                        if (m < 0) {
                          m += 60;
                          h = (h - 1 + 24) % 24;
                        }
                        setManualTime({ h, m });
                      }}
                    >
                      <ChevronLeft color={theme.colors.textMuted} size={16} />
                    </TouchableOpacity>
                    <Text style={styles.stepperText}>
                      {pad2(manualTime.h)}:{pad2(manualTime.m)}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        let h = manualTime.h;
                        let m = manualTime.m + 15;
                        if (m >= 60) {
                          m -= 60;
                          h = (h + 1) % 24;
                        }
                        setManualTime({ h, m });
                      }}
                    >
                      <ChevronRight color={theme.colors.textMuted} size={16} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <Text style={styles.fieldLabel}>MOTIVO / JUSTIFICACIÓN (OPCIONAL)</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Ej. Problema con internet / Marcación autorizada por jefatura"
                placeholderTextColor={theme.colors.textMuted}
                multiline
                numberOfLines={3}
                value={manualNote}
                onChangeText={setManualNote}
              />

              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setManualModalVisible(false)}
                >
                  <Text style={styles.modalCancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalSaveBtn}
                  onPress={handleSaveManualMark}
                  disabled={isSubmittingManual}
                >
                  {isSubmittingManual ? (
                    <ActivityIndicator color="#050A14" />
                  ) : (
                    <Text style={styles.modalSaveBtnText}>Registrar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Modal: Edición de Registro ──────────────────────────────────────── */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Registro de Asistencia</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <X color={theme.colors.textMuted} size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>COLABORADOR</Text>
              <Text style={styles.readOnlyText}>
                {editingLog?.employee?.full_name || 'Empleado'} ({editingLog?.type})
              </Text>

              <View style={styles.formRow}>
                <View style={styles.formCol}>
                  <Text style={styles.fieldLabel}>FECHA</Text>
                  <View style={styles.stepperRow}>
                    <TouchableOpacity onPress={() => setEditDate(addDays(editDate, -1))}>
                      <ChevronLeft color={theme.colors.textMuted} size={16} />
                    </TouchableOpacity>
                    <Text style={styles.stepperText}>{displayDate(editDate)}</Text>
                    <TouchableOpacity onPress={() => setEditDate(addDays(editDate, 1))}>
                      <ChevronRight color={theme.colors.textMuted} size={16} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.formCol}>
                  <Text style={styles.fieldLabel}>HORA (HH:MM)</Text>
                  <View style={styles.stepperRow}>
                    <TouchableOpacity
                      onPress={() => {
                        let h = editTime.h;
                        let m = editTime.m - 5;
                        if (m < 0) {
                          m += 60;
                          h = (h - 1 + 24) % 24;
                        }
                        setEditTime({ h, m });
                      }}
                    >
                      <ChevronLeft color={theme.colors.textMuted} size={16} />
                    </TouchableOpacity>
                    <Text style={styles.stepperText}>
                      {pad2(editTime.h)}:{pad2(editTime.m)}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        let h = editTime.h;
                        let m = editTime.m + 5;
                        if (m >= 60) {
                          m -= 60;
                          h = (h + 1) % 24;
                        }
                        setEditTime({ h, m });
                      }}
                    >
                      <ChevronRight color={theme.colors.textMuted} size={16} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <Text style={styles.fieldLabel}>MOTIVO DE CORRECCIÓN</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Motivo del cambio de hora..."
                placeholderTextColor={theme.colors.textMuted}
                multiline
                numberOfLines={3}
                value={editNote}
                onChangeText={setEditNote}
              />

              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setEditModalVisible(false)}
                >
                  <Text style={styles.modalCancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalSaveBtn}
                  onPress={handleSaveEditLog}
                  disabled={isSubmittingEdit}
                >
                  {isSubmittingEdit ? (
                    <ActivityIndicator color="#050A14" />
                  ) : (
                    <Text style={styles.modalSaveBtnText}>Guardar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Modal: Foto Ampliada ────────────────────────────────────────────── */}
      <Modal visible={photoModalVisible} transparent animationType="fade">
        <View style={styles.photoOverlay}>
          <View style={styles.photoCard}>
            <View style={styles.photoModalHeader}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.photoModalTitle} numberOfLines={1}>
                  {selectedPhoto?.employee?.full_name || selectedPhoto?.employee_name || 'Selfie'}
                </Text>
                <Text style={styles.photoModalSubtitle}>
                  {selectedPhoto?.type || 'MARCACIÓN'} ·{' '}
                  {selectedPhoto?.created_at || selectedPhoto?.timestamp || selectedPhoto?.date
                    ? new Date(
                        selectedPhoto?.created_at ||
                          selectedPhoto?.timestamp ||
                          selectedPhoto?.date,
                      ).toLocaleString('es-PE')
                    : ''}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setPhotoModalVisible(false)}
                style={styles.photoCloseBtn}
              >
                <X color="#FFF" size={20} />
              </TouchableOpacity>
            </View>

            {Boolean(selectedPhoto?.url || selectedPhoto?.selfie_url) && (
              <Image
                source={{ uri: selectedPhoto.url || selectedPhoto.selfie_url }}
                style={styles.photoFullImage}
                resizeMode="contain"
              />
            )}
          </View>
        </View>
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
      marginBottom: theme.spacing.md,
      marginTop: 2,
    },

    // Sub Tabs Header
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
    tabHeaderContent: {
      marginBottom: theme.spacing.md,
    },

    // Quick Actions
    actionsBarRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: theme.spacing.md,
    },
    manualMarkCtaBtn: {
      flex: 1,
      borderRadius: theme.borderRadius.md,
      overflow: 'hidden',
      ...theme.shadows.glowPrimary,
    },
    manualMarkCtaInner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 12,
    },
    manualMarkCtaText: {
      color: '#FFF',
      fontSize: 11.5,
      fontWeight: '900',
      letterSpacing: 0.5,
    },
    exportXlsxBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#DCFCE7',
      paddingHorizontal: 16,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1.5,
      borderColor: theme.colors.emerald,
    },
    exportXlsxBtnText: {
      color: isDark ? theme.colors.emerald : '#166534',
      fontSize: 11.5,
      fontWeight: '800',
    },

    // Filter Card
    filterCard: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.glassBorder,
      borderWidth: 1,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      ...theme.shadows.card,
    },
    filterDatesRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 10,
    },
    datePickerGroup: {
      flex: 1,
    },
    filterLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: theme.colors.textMuted,
      letterSpacing: 0.8,
      marginBottom: 4,
    },
    stepperRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: theme.borderRadius.md,
    },
    stepperText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    chipsRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 10,
    },
    filterChip: {
      flex: 1,
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderRadius: theme.borderRadius.md,
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6',
      alignItems: 'center',
    },
    filterChipActive: {
      backgroundColor: theme.colors.cyan,
    },
    filterChipText: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.textMuted,
    },
    filterChipTextActive: {
      color: '#FFF',
      fontWeight: '800',
    },
    applyFilterBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: theme.colors.cyan,
      paddingVertical: 10,
      borderRadius: theme.borderRadius.md,
    },
    applyFilterBtnText: {
      color: '#FFF',
      fontSize: 12,
      fontWeight: '800',
    },

    // KPI Summary Boxes
    kpiRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 6,
    },
    kpiBox: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.glassBorder,
      borderWidth: 1,
      borderRadius: theme.borderRadius.md,
      paddingVertical: 10,
      alignItems: 'center',
      ...theme.shadows.card,
    },
    kpiBoxNum: {
      fontSize: 18,
      fontWeight: '900',
      color: theme.colors.textPrimary,
    },
    kpiBoxLabel: {
      fontSize: 9,
      fontWeight: '800',
      color: theme.colors.textMuted,
      marginTop: 2,
    },

    // Log Card Item
    logCard: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.glassBorder,
      borderWidth: 1,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
      ...theme.shadows.card,
    },
    logCardMain: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    selfieThumb: {
      width: 46,
      height: 46,
      borderRadius: 23,
      borderWidth: 1.5,
      borderColor: theme.colors.cyan,
    },
    avatarCircle: {
      width: 46,
      height: 46,
      borderRadius: 23,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      color: '#FFF',
      fontSize: 18,
      fontWeight: '900',
    },
    logInfoCol: {
      flex: 1,
    },
    logHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 2,
    },
    logEmpName: {
      fontSize: 14,
      fontWeight: '800',
      color: theme.colors.textPrimary,
      flex: 1,
    },
    typePill: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: theme.borderRadius.full,
    },
    typePillText: {
      fontSize: 10,
      fontWeight: '900',
    },
    logTimeMeta: {
      fontSize: 11.5,
      color: theme.colors.textSecondary,
    },
    dateTimeMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginBottom: 6,
    },
    logTimeDot: {
      color: theme.colors.textMuted,
      fontSize: 12,
      fontWeight: '700',
    },
    statusBadgesRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    badgePill: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 6,
    },
    badgePillText: {
      fontSize: 10,
      fontWeight: '800',
    },
    justificationText: {
      fontSize: 10.5,
      color: theme.colors.textMuted,
      fontStyle: 'italic',
      flex: 1,
    },
    logActionsRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 8,
      marginTop: 10,
      borderTopWidth: 1,
      borderTopColor: theme.colors.glassBorder,
      paddingTop: 8,
    },
    actionPillBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6',
    },
    actionPillBtnText: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.cyan,
    },

    // Metrics View
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
    rankingCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.glassBorder,
      borderWidth: 1,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      ...theme.shadows.card,
    },
    rankBadge: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing.md,
    },
    rankBadgeText: {
      color: '#FFF',
      fontWeight: '800',
      fontSize: 12,
    },
    rankInfo: {
      flex: 1,
    },
    rankName: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    rankDetails: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    scorePill: {
      backgroundColor: 'rgba(16, 185, 129, 0.15)',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: theme.borderRadius.full,
    },
    scoreText: {
      color: theme.colors.emerald,
      fontSize: 12,
      fontWeight: '800',
    },
    topLateCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderColor: 'rgba(245, 158, 11, 0.3)',
      borderWidth: 1,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      ...theme.shadows.card,
    },
    topLateInfo: {
      flex: 1,
    },
    topLateName: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    topLateDetails: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },

    // Gallery Tab
    galleryMonthTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: theme.colors.textPrimary,
      marginBottom: 10,
    },
    galleryCard: {
      flex: 1,
      margin: 6,
      height: 180,
      borderRadius: theme.borderRadius.xl,
      overflow: 'hidden',
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.glassBorder,
      borderWidth: 1,
      ...theme.shadows.card,
    },
    galleryImage: {
      width: '100%',
      height: '100%',
    },
    galleryOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: 8,
    },
    galleryEmpName: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '800',
    },
    galleryTimeMeta: {
      color: 'rgba(255,255,255,0.7)',
      fontSize: 10,
      fontWeight: '600',
    },

    // Modals
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
      marginTop: 4,
    },
    empChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: theme.borderRadius.full,
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6',
      marginRight: 8,
    },
    empChipActive: {
      backgroundColor: theme.colors.cyan,
    },
    empChipText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.textMuted,
    },
    empChipTextActive: {
      color: '#FFF',
      fontWeight: '800',
    },
    typeSelectBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: theme.borderRadius.md,
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6',
      alignItems: 'center',
    },
    typeSelectBtnActive: {
      backgroundColor: theme.colors.cyan,
    },
    typeSelectBtnText: {
      fontSize: 12,
      fontWeight: '800',
      color: theme.colors.textMuted,
    },
    typeSelectBtnTextActive: {
      color: '#FFF',
    },
    formRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 10,
    },
    formCol: {
      flex: 1,
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
    readOnlyText: {
      fontSize: 14,
      fontWeight: '800',
      color: theme.colors.cyan,
      marginBottom: 12,
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

    // Photo Overlay
    photoOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.88)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.lg,
    },
    photoCard: {
      width: '100%',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.xl,
      overflow: 'hidden',
      borderColor: theme.colors.glassBorder,
      borderWidth: 1,
    },
    photoModalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
    },
    photoModalTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: theme.colors.textPrimary,
    },
    photoModalSubtitle: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    photoCloseBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0',
      justifyContent: 'center',
      alignItems: 'center',
    },
    photoFullImage: {
      width: '100%',
      height: width * 0.95,
    },

    emptyContainer: {
      padding: theme.spacing.xl,
      alignItems: 'center',
    },
    emptyText: {
      color: theme.colors.textMuted,
      fontSize: 13,
      textAlign: 'center',
    },
  });
