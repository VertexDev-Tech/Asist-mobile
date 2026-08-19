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
  Alert,
} from 'react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Theme } from '../../theme/theme';
import { useTheme } from '../../context/ThemeContext';
import { employeesApi } from '../../services/api';
import { EmployeeItem } from '../../types';
import { Search, UserCheck, UserX, UserPlus, X, RefreshCw } from 'lucide-react-native';

export const AdminEmployeesScreen = () => {
  const { theme, isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fullName, setFullName] = useState('');
  const [dni, setDni] = useState('');
  const [pin, setPin] = useState('');
  const [position, setPosition] = useState('');

  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const data = await employeesApi.list();
      setEmployees(data || []);
    } catch (e) {
      console.log('Error loading employees:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCreateEmployee = async () => {
    if (!fullName.trim() || !dni.trim() || !pin.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Campos requeridos', 'Ingresa nombre, DNI y un PIN de 6 dígitos.');
      return;
    }

    try {
      setIsSubmitting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await employeesApi.create({
        full_name: fullName.trim(),
        dni: dni.trim(),
        pin: pin.trim(),
        position: position.trim() || 'Colaborador',
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('¡Empleado Registrado! 🎉', `Empleado ${fullName} fue agregado con éxito.`);
      setModalVisible(false);
      setFullName('');
      setDni('');
      setPin('');
      setPosition('');
      loadEmployees();
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = error.response?.data?.message || 'No se pudo registrar el empleado.';
      Alert.alert('Error', Array.isArray(msg) ? msg.join('\n') : String(msg));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPin = (item: EmployeeItem) => {
    Alert.prompt(
      'Reiniciar PIN',
      `Ingresa el nuevo PIN de 6 dígitos para ${item.full_name}:`,
      async (newPin) => {
        if (!newPin || newPin.trim().length < 4) {
          Alert.alert('PIN inválido', 'El PIN debe tener al menos 4 dígitos.');
          return;
        }
        try {
          await employeesApi.resetPin(item.id, newPin.trim());
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert('Éxito', `El PIN de ${item.full_name} fue actualizado.`);
        } catch (e) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          Alert.alert('Error', 'No se pudo actualizar el PIN.');
        }
      },
    );
  };

  const filteredEmployees = employees.filter((e) => {
    const q = search.toLowerCase();
    return (
      (e.full_name && e.full_name.toLowerCase().includes(q)) ||
      (e.dni && e.dni.includes(q)) ||
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
          onPress={() => setModalVisible(true)}
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
        style={styles.employeeCard}
      >
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {item.full_name ? item.full_name.charAt(0).toUpperCase() : 'E'}
          </Text>
        </View>

        <View style={styles.employeeInfo}>
          <Text style={styles.employeeName}>{item.full_name}</Text>
          <Text style={styles.employeeDetails}>
            DNI: {item.dni} | {item.position || 'Colaborador'}
          </Text>
        </View>

        {/* Actions */}
        <TouchableOpacity
          style={styles.resetPinBtn}
          onPress={() => handleResetPin(item)}
          activeOpacity={0.7}
        >
          <RefreshCw color={theme.colors.cyan} size={18} />
        </TouchableOpacity>

        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: isActive
                ? 'rgba(16, 185, 129, 0.15)'
                : 'rgba(239, 68, 68, 0.15)',
            },
          ]}
        >
          {isActive ? (
            <UserCheck color={theme.colors.emerald} size={18} />
          ) : (
            <UserX color={theme.colors.rose} size={18} />
          )}
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
              loadEmployees();
            }}
            tintColor={theme.colors.cyan}
          />
        }
      />

      {/* Create Employee Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nuevo Colaborador</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color={theme.colors.textMuted} size={22} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Nombre completo"
              placeholderTextColor={theme.colors.textMuted}
              value={fullName}
              onChangeText={setFullName}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Número de DNI"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="number-pad"
              value={dni}
              onChangeText={setDni}
              maxLength={12}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="PIN de Acceso (ej: 123456)"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="number-pad"
              value={pin}
              onChangeText={setPin}
              maxLength={8}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Cargo o Puesto (ej: Operador)"
              placeholderTextColor={theme.colors.textMuted}
              value={position}
              onChangeText={setPosition}
            />

            <TouchableOpacity
              style={styles.submitModalBtn}
              onPress={handleCreateEmployee}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={theme.colors.gradients.cyan}
                style={styles.submitModalGradient}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.submitModalText}>REGISTRAR EMPLEADO</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
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
    headerRow: {
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
      borderWidth: 1,
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
      borderWidth: 1,
      borderRadius: theme.borderRadius.md,
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
      fontWeight: '800',
      fontSize: 18,
    },
    employeeInfo: {
      flex: 1,
    },
    employeeName: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    employeeDetails: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    resetPinBtn: {
      padding: 8,
      marginRight: 6,
    },
    statusBadge: {
      padding: 8,
      borderRadius: theme.borderRadius.full,
    },

    // Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.7)',
      justifyContent: 'center',
      padding: theme.spacing.lg,
    },
    modalCard: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.glassBorder,
      borderWidth: 1,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.xl,
      ...theme.shadows.card,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.colors.textPrimary,
    },
    modalInput: {
      backgroundColor: isDark ? theme.colors.surfaceHover : '#F8FAFC',
      borderColor: theme.colors.glassBorder,
      borderWidth: 1,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: theme.spacing.md,
      height: 50,
      color: theme.colors.textPrimary,
      fontSize: 14,
      marginBottom: theme.spacing.md,
    },
    submitModalBtn: {
      marginTop: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      overflow: 'hidden',
      ...theme.shadows.glowPrimary,
    },
    submitModalGradient: {
      height: 50,
      justifyContent: 'center',
      alignItems: 'center',
    },
    submitModalText: {
      color: '#FFF',
      fontWeight: '800',
      fontSize: 14,
      letterSpacing: 1,
    },
  });
