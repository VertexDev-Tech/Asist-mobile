import React, { useEffect, useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Theme } from '../../theme/theme';
import { useTheme } from '../../context/ThemeContext';
import { useAlert } from '../../context/AlertContext';
import { employeesApi, schedulesApi, overtimeBankApi, assetUrl } from '../../services/api';
import { EmployeeItem, OvertimeBankSummary } from '../../types';
import {
  Search,
  UserCheck,
  UserX,
  UserPlus,
  X,
  Pencil,
  KeyRound,
  ChevronDown,
  Clock,
  Briefcase,
  Mail,
  Phone,
  Hash,
  Check,
  Wallet,
  Camera,
} from 'lucide-react-native';

export const AdminEmployeesScreen = () => {
  const { theme, isDark } = useTheme();
  const { showAlert, showSuccess, showError, showConfirm, showPrompt } = useAlert();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);

  // Modal State (Create or Edit)
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState<number | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields (100% Web Parity)
  const [fullName, setFullName] = useState('');
  const [dni, setDni] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [position, setPosition] = useState('');
  const [scheduleId, setScheduleId] = useState<number | null>(null);

  // Dropdown Picker State
  const [schedulePickerVisible, setSchedulePickerVisible] = useState(false);

  // Overtime Bank Modal State
  const [bankModalVisible, setBankModalVisible] = useState(false);
  const [bankTarget, setBankTarget] = useState<EmployeeItem | null>(null);
  const [bankSummary, setBankSummary] = useState<OvertimeBankSummary | null>(null);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankHours, setBankHours] = useState('0');
  const [bankMinutes, setBankMinutes] = useState('0');
  const [bankNote, setBankNote] = useState('');

  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [empList, schedList] = await Promise.all([
        employeesApi.list().catch(() => []),
        schedulesApi.list().catch(() => []),
      ]);
      setEmployees(empList || []);
      setSchedules(schedList || []);
    } catch (e) {
      console.log('Error loading data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleOpenCreate = () => {
    setIsEditing(false);
    setEditingEmployeeId(null);
    setFullName('');
    setDni('');
    setEmail('');
    setPhone('');
    setPosition('');
    setScheduleId(schedules.length > 0 ? schedules[0].id : null);
    setModalVisible(true);
  };

  const handleOpenEdit = (item: EmployeeItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsEditing(true);
    setEditingEmployeeId(item.id);
    setFullName(item.full_name || '');
    setDni(item.dni || '');
    setEmail(item.email || '');
    setPhone(item.phone || '');
    setPosition(item.position || '');
    setScheduleId(item.schedule_id || (schedules.length > 0 ? schedules[0].id : null));
    setModalVisible(true);
  };

  const handleSaveEmployee = async () => {
    if (!fullName.trim() || !dni.trim()) {
      showError('Campos requeridos', 'Ingresa el nombre completo y DNI del colaborador.');
      return;
    }

    try {
      setIsSubmitting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      if (isEditing && editingEmployeeId) {
        await employeesApi.update(editingEmployeeId, {
          full_name: fullName.trim(),
          dni: dni.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          position: position.trim() || 'Colaborador',
          schedule_id: scheduleId || undefined,
        });

        showSuccess('Colaborador Actualizado', `Los datos de "${fullName}" fueron guardados.`);
      } else {
        await employeesApi.create({
          full_name: fullName.trim(),
          dni: dni.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          position: position.trim() || 'Colaborador',
          schedule_id: scheduleId || undefined,
        });
        showSuccess('Colaborador Registrado', `"${fullName}" ha sido agregado con éxito.`);
      }

      setModalVisible(false);
      loadData();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'No se pudo procesar la solicitud.';
      showError('Error al guardar', Array.isArray(msg) ? msg.join('\n') : String(msg));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePickPhoto = async () => {
    if (!editingEmployeeId) return;
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        showError('Permiso denegado', 'Se requiere acceso a tus fotos para elegir la imagen.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      setIsUploadingPhoto(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await employeesApi.uploadPhoto(editingEmployeeId, asset.uri, asset.mimeType);
      showSuccess('Foto Actualizada', 'La foto del colaborador fue guardada.');
      loadData();
    } catch (e: any) {
      const msg = e.response?.data?.message;
      showError('Error', typeof msg === 'string' ? msg : 'No se pudo subir la foto.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleToggleDeactivate = (item: EmployeeItem) => {
    const isActive = item.active !== false;
    const actionLabel = isActive ? 'Dar de baja' : 'Reactivar';

    showConfirm(
      `${actionLabel} Colaborador`,
      `¿Estás seguro de que deseas ${actionLabel.toLowerCase()} a "${item.full_name}"?`,
      async () => {
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          await employeesApi.update(item.id, { active: !isActive });
          showSuccess(
            'Estado Actualizado',
            `El colaborador "${item.full_name}" ha sido ${isActive ? 'dado de baja' : 'reactivado'}.`,
          );
          loadData();
        } catch (e) {
          showError('Error', 'No se pudo cambiar el estado del colaborador.');
        }
      },
      actionLabel,
      isActive,
    );
  };

  const handleResetPin = (item: EmployeeItem) => {
    showPrompt(
      'Reiniciar PIN',
      `Ingresa el nuevo PIN de 4 a 6 dígitos para ${item.full_name}:`,
      async (newPin) => {
        if (!newPin || newPin.trim().length < 4) {
          showError('PIN inválido', 'El PIN debe tener al menos 4 dígitos numéricos.');
          return;
        }
        try {
          await employeesApi.resetPin(item.id, newPin.trim());
          showSuccess('¡PIN Actualizado!', `El PIN de acceso de ${item.full_name} fue actualizado.`);
        } catch (e) {
          showError('Error', 'No se pudo actualizar el PIN.');
        }
      },
      'Solo números (4 a 6 dígitos)',
      'number-pad',
    );
  };

  const handleOpenBank = async (item: EmployeeItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBankTarget(item);
    setBankSummary(null);
    setBankHours('0');
    setBankMinutes('0');
    setBankNote('');
    setBankModalVisible(true);
    try {
      setBankLoading(true);
      const summary = await overtimeBankApi.getForEmployee(item.id);
      setBankSummary(summary);
    } catch (e) {
      showError('Error', 'No se pudo cargar el banco de horas del colaborador.');
    } finally {
      setBankLoading(false);
    }
  };

  const handleSaveBank = async () => {
    if (!bankTarget) return;
    try {
      setIsSubmitting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await overtimeBankApi.setPreviousMonth(bankTarget.id, {
        hours: Number(bankHours) || 0,
        minutes: Number(bankMinutes) || 0,
        note: bankNote.trim() || undefined,
      });
      showSuccess('¡Banco de Horas Actualizado!', `Se guardó el saldo del mes anterior de ${bankTarget.full_name}.`);
      setBankModalVisible(false);
    } catch (e) {
      showError('Error', 'No se pudo actualizar el banco de horas.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedScheduleName = useMemo(() => {
    const found = schedules.find((s) => s.id === scheduleId);
    return found ? found.name : 'Seleccionar horario...';
  }, [schedules, scheduleId]);

  const filteredEmployees = employees.filter((e) => {
    const q = search.toLowerCase();
    return (
      (e.full_name && e.full_name.toLowerCase().includes(q)) ||
      (e.dni && e.dni.includes(q)) ||
      (e.email && e.email.toLowerCase().includes(q)) ||
      (e.position && e.position.toLowerCase().includes(q))
    );
  });

  const renderHeader = () => (
    <View>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Colaboradores</Text>
          <Text style={styles.subtitle}>Gestión de personal y accesos</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={handleOpenCreate}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={theme.colors.gradients.cyan}
            style={styles.addBtnGradient}
          >
            <UserPlus color="#FFF" size={18} />
            <Text style={styles.addBtnText}>NUEVO</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Search Filter Input */}
      <View style={styles.searchContainer}>
        <Search color={theme.colors.textMuted} size={18} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre, DNI o cargo..."
          placeholderTextColor={theme.colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>
    </View>
  );

  const renderItem = ({ item, index }: { item: EmployeeItem; index: number }) => {
    const isActive = item.active !== false;

    return (
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 350, delay: index * 30 }}
        style={[styles.employeeCard, !isActive && { opacity: 0.65 }]}
      >
        <View
          style={[
            styles.avatarCircle,
            !isActive && { backgroundColor: theme.colors.textMuted },
            { overflow: 'hidden' },
          ]}
        >
          {item.photo_url ? (
            <Image
              source={{ uri: assetUrl(item.photo_url) as string }}
              style={{ width: '100%', height: '100%' }}
            />
          ) : (
            <Text style={styles.avatarText}>
              {item.full_name ? item.full_name.charAt(0).toUpperCase() : 'E'}
            </Text>
          )}
        </View>

        <View style={styles.employeeInfo}>
          <View style={styles.nameStatusRow}>
            <Text style={styles.employeeName}>{item.full_name}</Text>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: isActive
                    ? 'rgba(16, 185, 129, 0.12)'
                    : 'rgba(239, 68, 68, 0.12)',
                },
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  { color: isActive ? theme.colors.emerald : theme.colors.rose },
                ]}
              >
                {isActive ? 'Activo' : 'De baja'}
              </Text>
            </View>
          </View>

          <Text style={styles.employeeDetails}>
            DNI: {item.dni} | {item.position || 'Colaborador'}
          </Text>
          {!!item.email && <Text style={styles.employeeEmail}>{item.email}</Text>}
        </View>

        {/* Action Buttons */}
        <View style={styles.cardActionsRow}>
          {/* Editar */}
          <TouchableOpacity
            style={styles.actionIconButton}
            onPress={() => handleOpenEdit(item)}
            activeOpacity={0.7}
          >
            <Pencil color={theme.colors.cyan} size={18} />
          </TouchableOpacity>

          {/* Reset PIN */}
          <TouchableOpacity
            style={styles.actionIconButton}
            onPress={() => handleResetPin(item)}
            activeOpacity={0.7}
          >
            <KeyRound color={theme.colors.amber} size={18} />
          </TouchableOpacity>

          {/* Banco de Horas */}
          <TouchableOpacity
            style={styles.actionIconButton}
            onPress={() => handleOpenBank(item)}
            activeOpacity={0.7}
          >
            <Wallet color={theme.colors.violet} size={18} />
          </TouchableOpacity>

          {/* Dar de baja / Reactivar */}
          <TouchableOpacity
            style={styles.actionIconButton}
            onPress={() => handleToggleDeactivate(item)}
            activeOpacity={0.7}
          >
            {isActive ? (
              <UserX color={theme.colors.rose} size={18} />
            ) : (
              <UserCheck color={theme.colors.emerald} size={18} />
            )}
          </TouchableOpacity>
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
        data={filteredEmployees}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
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

      {/* Edit / Create Employee Modal (Exact Web Replica) */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditing ? 'Editar Empleado' : 'Nuevo Empleado'}
              </Text>
              <TouchableOpacity
                style={styles.closeModalBtn}
                onPress={() => setModalVisible(false)}
              >
                <X color={theme.colors.textMuted} size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              {/* Foto del colaborador (solo al editar: el endpoint requiere el id) */}
              {isEditing && editingEmployeeId && (
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    paddingVertical: 12,
                    marginBottom: 14,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: theme.colors.cyan,
                  }}
                  onPress={handlePickPhoto}
                  disabled={isUploadingPhoto}
                  activeOpacity={0.8}
                >
                  {isUploadingPhoto ? (
                    <ActivityIndicator size="small" color={theme.colors.cyan} />
                  ) : (
                    <>
                      <Camera color={theme.colors.cyan} size={18} />
                      <Text style={{ color: theme.colors.cyan, fontWeight: '800', fontSize: 12 }}>
                        CAMBIAR FOTO DEL COLABORADOR
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {/* Row 1: Nombre Completo & DNI */}
              <View style={styles.formRow}>
                <View style={styles.formCol}>
                  <Text style={styles.fieldLabel}>NOMBRE COMPLETO *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Bryan Jhonatan vera"
                    placeholderTextColor={theme.colors.textMuted}
                    value={fullName}
                    onChangeText={setFullName}
                  />
                </View>

                <View style={styles.formCol}>
                  <Text style={styles.fieldLabel}>DNI *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="71888905"
                    placeholderTextColor={theme.colors.textMuted}
                    keyboardType="number-pad"
                    value={dni}
                    onChangeText={setDni}
                    maxLength={12}
                  />
                </View>
              </View>

              {/* Row 2: Email & Teléfono */}
              <View style={styles.formRow}>
                <View style={styles.formCol}>
                  <Text style={styles.fieldLabel}>EMAIL</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="ejemplo@gmail.com"
                    placeholderTextColor={theme.colors.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>

                <View style={styles.formCol}>
                  <Text style={styles.fieldLabel}>TELÉFONO</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="921955217"
                    placeholderTextColor={theme.colors.textMuted}
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                    maxLength={15}
                  />
                </View>
              </View>

              {/* Row 3: Cargo & Horario Asignado */}
              <View style={styles.formRow}>
                <View style={styles.formCol}>
                  <Text style={styles.fieldLabel}>CARGO</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Ingeniero de oficina..."
                    placeholderTextColor={theme.colors.textMuted}
                    value={position}
                    onChangeText={setPosition}
                  />
                </View>

                <View style={styles.formCol}>
                  <Text style={styles.fieldLabel}>HORARIO ASIGNADO</Text>
                  <TouchableOpacity
                    style={styles.selectPickerBtn}
                    onPress={() => setSchedulePickerVisible(!schedulePickerVisible)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.selectPickerBtnText,
                        !scheduleId && { color: theme.colors.textMuted },
                      ]}
                      numberOfLines={1}
                    >
                      {selectedScheduleName}
                    </Text>
                    <ChevronDown color={theme.colors.textMuted} size={18} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Schedule Dropdown Menu (If expanded) */}
              {schedulePickerVisible && (
                <View style={styles.schedulesDropdown}>
                  {schedules.map((s) => {
                    const isSelected = s.id === scheduleId;
                    return (
                      <TouchableOpacity
                        key={s.id}
                        style={[
                          styles.scheduleItemRow,
                          isSelected && styles.scheduleItemRowActive,
                        ]}
                        onPress={() => {
                          setScheduleId(s.id);
                          setSchedulePickerVisible(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.scheduleItemText,
                            isSelected && styles.scheduleItemTextActive,
                          ]}
                        >
                          {s.name} ({s.start_time?.substring(0, 5)} - {s.end_time?.substring(0, 5)})
                        </Text>
                        {isSelected && <Check color={theme.colors.cyan} size={16} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Action Buttons Row (Cancelar / Guardar) */}
              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setModalVisible(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalCancelBtnText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalSaveBtn}
                  onPress={handleSaveEmployee}
                  disabled={isSubmitting}
                  activeOpacity={0.8}
                >
                  {isSubmitting ? (
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

      {/* Overtime Bank (Banco de Horas) Modal */}
      <Modal visible={bankModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Banco de Horas</Text>
              <TouchableOpacity onPress={() => setBankModalVisible(false)}>
                <X color={theme.colors.textMuted} size={20} />
              </TouchableOpacity>
            </View>

            <Text style={styles.bankEmployeeName}>{bankTarget?.full_name}</Text>

            {bankLoading ? (
              <ActivityIndicator color={theme.colors.cyan} style={{ marginVertical: 20 }} />
            ) : (
              <>
                <View style={styles.bankSummaryRow}>
                  <View style={styles.bankSummaryCol}>
                    <Text style={styles.bankSummaryLabel}>Mes anterior</Text>
                    <Text style={styles.bankSummaryValue}>
                      {bankSummary?.prevMonth?.formatted ?? '—'}
                    </Text>
                  </View>
                  <View style={styles.bankSummaryCol}>
                    <Text style={styles.bankSummaryLabel}>Mes actual</Text>
                    <Text style={styles.bankSummaryValue}>
                      {bankSummary?.currentMonth?.formatted ?? '—'}
                    </Text>
                  </View>
                  <View style={styles.bankSummaryCol}>
                    <Text style={styles.bankSummaryLabel}>Saldo Total</Text>
                    <Text style={[styles.bankSummaryValue, { color: theme.colors.cyan }]}>
                      {bankSummary?.total?.formatted ?? '—'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.fieldLabel}>AJUSTAR SALDO DEL MES ANTERIOR</Text>
                <View style={styles.formRow}>
                  <View style={styles.formCol}>
                    <Text style={styles.fieldLabel}>HORAS</Text>
                    <TextInput
                      style={styles.modalInput}
                      keyboardType="number-pad"
                      value={bankHours}
                      onChangeText={setBankHours}
                    />
                  </View>
                  <View style={styles.formCol}>
                    <Text style={styles.fieldLabel}>MINUTOS</Text>
                    <TextInput
                      style={styles.modalInput}
                      keyboardType="number-pad"
                      value={bankMinutes}
                      onChangeText={setBankMinutes}
                    />
                  </View>
                </View>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Nota (opcional)"
                  placeholderTextColor={theme.colors.textMuted}
                  value={bankNote}
                  onChangeText={setBankNote}
                />

                <View style={styles.modalActionsRow}>
                  <TouchableOpacity
                    style={styles.modalCancelBtn}
                    onPress={() => setBankModalVisible(false)}
                  >
                    <Text style={styles.modalCancelBtnText}>Cerrar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalSaveBtn}
                    onPress={handleSaveBank}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#050A14" />
                    ) : (
                      <Text style={styles.modalSaveBtnText}>Guardar</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
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
      marginBottom: theme.spacing.lg,
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
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.glassBorder,
      borderWidth: 1.5,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: theme.spacing.md,
      height: 48,
      marginBottom: theme.spacing.lg,
      ...theme.shadows.card,
    },
    searchIcon: {
      marginRight: theme.spacing.sm,
    },
    searchInput: {
      flex: 1,
      color: theme.colors.textPrimary,
      fontSize: 14,
    },
    employeeCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.glassBorder,
      borderWidth: 1.5,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      ...theme.shadows.card,
    },
    avatarCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.cyan,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing.md,
    },
    avatarText: {
      color: '#FFF',
      fontWeight: '900',
      fontSize: 18,
    },
    employeeInfo: {
      flex: 1,
    },
    nameStatusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    employeeName: {
      fontSize: 15,
      fontWeight: '800',
      color: theme.colors.textPrimary,
    },
    statusBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: theme.borderRadius.full,
    },
    statusBadgeText: {
      fontSize: 10,
      fontWeight: '800',
    },
    employeeDetails: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    employeeEmail: {
      fontSize: 11,
      color: theme.colors.textMuted,
      marginTop: 1,
    },
    cardActionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    actionIconButton: {
      padding: 8,
      borderRadius: theme.borderRadius.sm,
    },

    // Modal Styles
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
    closeModalBtn: {
      padding: 4,
    },
    modalScrollView: {
      marginTop: 4,
    },
    formRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 6,
    },
    formCol: {
      flex: 1,
    },
    fieldLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: theme.colors.textSecondary,
      marginBottom: 6,
      letterSpacing: 0.5,
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
    selectPickerBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: isDark ? '#1A2538' : '#F8FAFC',
      borderColor: theme.colors.glassBorder,
      borderWidth: 1.5,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: 12,
      height: 44,
      marginBottom: 10,
    },
    selectPickerBtnText: {
      fontSize: 13,
      color: theme.colors.textPrimary,
      fontWeight: '600',
      flex: 1,
    },
    schedulesDropdown: {
      backgroundColor: isDark ? '#1A2538' : '#FFFFFF',
      borderColor: theme.colors.cyan,
      borderWidth: 1.5,
      borderRadius: theme.borderRadius.md,
      padding: 6,
      marginBottom: 14,
      marginTop: -4,
      ...theme.shadows.card,
    },
    scheduleItemRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: theme.borderRadius.sm,
    },
    scheduleItemRowActive: {
      backgroundColor: isDark ? 'rgba(0,212,255,0.15)' : 'rgba(2,132,199,0.12)',
    },
    scheduleItemText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    scheduleItemTextActive: {
      color: theme.colors.cyan,
      fontWeight: '800',
    },
    modalActionsRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 12,
      marginTop: 12,
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

    // Overtime Bank Modal
    bankEmployeeName: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.textSecondary,
      marginBottom: 14,
      marginTop: -4,
    },
    bankSummaryRow: {
      flexDirection: 'row',
      backgroundColor: isDark ? '#1A2538' : '#F8FAFC',
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    bankSummaryCol: {
      flex: 1,
      alignItems: 'center',
    },
    bankSummaryLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.colors.textMuted,
      textAlign: 'center',
    },
    bankSummaryValue: {
      fontSize: 13,
      fontWeight: '900',
      color: theme.colors.textPrimary,
      marginTop: 4,
    },
  });
