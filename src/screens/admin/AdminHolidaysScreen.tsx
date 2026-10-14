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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Theme } from '../../theme/theme';
import { useTheme } from '../../context/ThemeContext';
import { useAlert } from '../../context/AlertContext';
import { holidaysApi } from '../../services/api';
import { HolidayItem } from '../../types';
import {
  CalendarDays,
  Plus,
  Download,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';

const pad2 = (n: number) => String(n).padStart(2, '0');
const toISODate = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const addDays = (d: Date, n: number) => {
  const nd = new Date(d);
  nd.setDate(nd.getDate() + n);
  return nd;
};
const displayDate = (d: Date) =>
  d.toLocaleDateString('es-PE', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

export const AdminHolidaysScreen = () => {
  const { theme, isDark } = useTheme();
  const { showConfirm, showPrompt, showSuccess, showError } = useAlert();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [holidays, setHolidays] = useState<HolidayItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [newDate, setNewDate] = useState(new Date());
  const [newName, setNewName] = useState('');

  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await holidaysApi.list();
      setHolidays(data || []);
    } catch (e) {
      console.log('Error loading holidays:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const sortedHolidays = useMemo(
    () => [...holidays].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [holidays],
  );

  const handleOpenCreate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNewDate(new Date());
    setNewName('');
    setModalVisible(true);
  };

  const handleSaveHoliday = async () => {
    if (!newName.trim()) {
      showError('Nombre requerido', 'Ingresa el nombre del feriado.');
      return;
    }
    try {
      setIsSubmitting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await holidaysApi.create({ date: toISODate(newDate), name: newName.trim() });
      setModalVisible(false);
      showSuccess('¡Feriado Agregado!', `"${newName.trim()}" fue registrado con éxito.`);
      loadData();
    } catch (e: any) {
      const msg = e.response?.data?.message || 'No se pudo registrar el feriado.';
      showError('Error', Array.isArray(msg) ? msg.join('\n') : String(msg));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImportNational = () => {
    const currentYear = new Date().getFullYear();
    showPrompt(
      'Importar Feriados Nacionales',
      'Ingresa el año a importar (feriados oficiales del Perú):',
      async (yearStr) => {
        const year = parseInt(yearStr, 10);
        if (!year || year < 2000) {
          showError('Año inválido', 'Ingresa un año válido, por ejemplo 2026.');
          return;
        }
        try {
          const res = await holidaysApi.importNational(year);
          showSuccess(
            '¡Importación Completa!',
            `Se importaron ${res.imported} feriados (${res.skipped} ya existían).`,
          );
          loadData();
        } catch (e) {
          showError('Error', 'No se pudo importar los feriados nacionales.');
        }
      },
      String(currentYear),
      'number-pad',
    );
  };

  const handleDelete = (item: HolidayItem) => {
    showConfirm(
      'Eliminar Feriado',
      `¿Deseas eliminar "${item.name}"?`,
      async () => {
        try {
          await holidaysApi.remove(item.id);
          showSuccess('Feriado eliminado', `"${item.name}" fue eliminado.`);
          loadData();
        } catch (e) {
          showError('Error', 'No se pudo eliminar el feriado.');
        }
      },
      'Eliminar',
      true,
    );
  };

  const renderHeader = () => (
    <View>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Feriados</Text>
          <Text style={styles.subtitle}>Días no laborables de la empresa</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={handleOpenCreate} activeOpacity={0.8}>
          <LinearGradient colors={theme.colors.gradients.cyan} style={styles.addBtnGradient}>
            <Plus color="#FFF" size={18} />
            <Text style={styles.addBtnText}>NUEVO</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.importBtn} onPress={handleImportNational} activeOpacity={0.8}>
        <Download color={theme.colors.cyan} size={16} />
        <Text style={styles.importBtnText}>Importar feriados nacionales del Perú</Text>
      </TouchableOpacity>
    </View>
  );

  const renderItem = ({ item, index }: { item: HolidayItem; index: number }) => {
    const [yy, mm, dd] = item.date.split('T')[0].split('-');
    return (
      <MotiView
        from={{ opacity: 0, translateY: 8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 300, delay: index * 25 }}
        style={styles.holidayCard}
      >
        <View style={styles.dateBox}>
          <Text style={styles.dayNum}>{dd}</Text>
          <Text style={styles.monthLabel}>{mm}/{yy}</Text>
        </View>
        <View style={styles.holidayInfo}>
          <Text style={styles.holidayName}>{item.name}</Text>
          {item.is_national && (
            <View style={styles.nationalBadge}>
              <Text style={styles.nationalBadgeText}>Nacional</Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
          <Trash2 color={theme.colors.rose} size={18} />
        </TouchableOpacity>
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
        data={sortedHolidays}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={renderHeader}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <CalendarDays color={theme.colors.textMuted} size={32} />
            <Text style={styles.emptyText}>No hay feriados registrados aún.</Text>
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

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nuevo Feriado</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color={theme.colors.textMuted} size={20} />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>FECHA</Text>
            <View style={styles.dateStepper}>
              <TouchableOpacity onPress={() => setNewDate(addDays(newDate, -1))}>
                <ChevronLeft color={theme.colors.textMuted} size={18} />
              </TouchableOpacity>
              <Text style={styles.dateStepperText}>{displayDate(newDate)}</Text>
              <TouchableOpacity onPress={() => setNewDate(addDays(newDate, 1))}>
                <ChevronRight color={theme.colors.textMuted} size={18} />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>NOMBRE DEL FERIADO</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ej. Aniversario de la empresa"
              placeholderTextColor={theme.colors.textMuted}
              value={newName}
              onChangeText={setNewName}
            />

            <View style={styles.modalActionsRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveHoliday}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#050A14" />
                ) : (
                  <Text style={styles.modalSaveBtnText}>Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
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
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
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
    },
    addBtn: {
      borderRadius: theme.borderRadius.md,
      overflow: 'hidden',
      ...theme.shadows.glowPrimary,
    },
    addBtnGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    addBtnText: {
      color: '#FFF',
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 0.8,
    },
    importBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.glassBorder,
      borderWidth: 1,
      borderRadius: theme.borderRadius.md,
      paddingVertical: 12,
      paddingHorizontal: theme.spacing.md,
      marginBottom: theme.spacing.lg,
      ...theme.shadows.card,
    },
    importBtnText: {
      fontSize: 12.5,
      fontWeight: '700',
      color: theme.colors.cyan,
    },
    holidayCard: {
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
    dateBox: {
      alignItems: 'center',
      minWidth: 44,
    },
    dayNum: {
      fontSize: 20,
      fontWeight: '900',
      color: theme.colors.textPrimary,
      lineHeight: 24,
    },
    monthLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: theme.colors.textMuted,
    },
    holidayInfo: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    holidayName: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      flexShrink: 1,
    },
    nationalBadge: {
      backgroundColor: isDark ? 'rgba(0,212,255,0.15)' : 'rgba(2,132,199,0.12)',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: theme.borderRadius.full,
    },
    nationalBadgeText: {
      fontSize: 10,
      fontWeight: '800',
      color: theme.colors.cyan,
    },
    deleteBtn: {
      padding: 8,
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
      letterSpacing: 0.5,
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
      marginBottom: 14,
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
      marginBottom: 14,
    },
    modalActionsRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 12,
      marginTop: 4,
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
