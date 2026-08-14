import React, { useEffect, useState } from 'react';
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
import { theme } from '../../theme/theme';
import { employeesApi } from '../../services/api';
import { EmployeeItem } from '../../types';
import { Search, UserCheck, UserX, UserPlus, Mail, Lock, X, RefreshCw } from 'lucide-react-native';

export const AdminEmployeesScreen = () => {
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
      'plain-text',
      '',
      'number-pad',
    );
  };

  const filteredEmployees = employees.filter((e) => {
    const q = search.toLowerCase();
    return (
      e.full_name?.toLowerCase().includes(q) ||
      e.dni?.toLowerCase().includes(q) ||
      e.position?.toLowerCase().includes(q)
    );
  });

  const renderHeader = () => (
    <View>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Directorio de Empleados</Text>
          <Text style={styles.subtitle}>Gestión de colaboradores UBIX</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtnWrapper}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setModalVisible(true);
          }}
        >
          <LinearGradient
            colors={theme.colors.gradients.cyan}
            style={styles.addBtn}
          >
            <UserPlus color="#050A14" size={18} />
            <Text style={styles.addBtnText}>NUEVO</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
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

  const renderItem = ({ item, index }: { item: EmployeeItem; index: number }) => (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 350, delay: index * 40 }}
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

      <TouchableOpacity
        style={styles.resetPinBtn}
        onPress={() => handleResetPin(item)}
      >
        <RefreshCw color={theme.colors.cyan} size={16} />
      </TouchableOpacity>

      <View
        style={[
          styles.statusBadge,
          {
            backgroundColor: item.active
              ? 'rgba(16, 185, 129, 0.15)'
              : 'rgba(244, 63, 94, 0.15)',
          },
        ]}
      >
        {item.active ? (
          <UserCheck color={theme.colors.emerald} size={16} />
        ) : (
          <UserX color={theme.colors.rose} size={16} />
        )}
      </View>
    </MotiView>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.cyan} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        style={styles.container}
        contentContainerStyle={styles.listContent}
        data={filteredEmployees}
        keyExtractor={(item) => String(item.id)}
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

      {/* New Employee Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Registrar Nuevo Empleado</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color={theme.colors.textMuted} size={22} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Nombre Completo"
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
              placeholder="PIN de Seguridad (ej: 123456)"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="number-pad"
              secureTextEntry
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
            >
              <LinearGradient
                colors={theme.colors.gradients.cyan}
                style={styles.submitModalGradient}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#050A14" />
                ) : (
                  <Text style={styles.submitModalText}>REGISTRAR EN UBIX</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listContent: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
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
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  addBtnWrapper: {
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  addBtnText: {
    color: '#050A14',
    fontWeight: '800',
    fontSize: 12,
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
    color: '#050A14',
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
    backgroundColor: theme.colors.background,
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
  },
  submitModalGradient: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitModalText: {
    color: '#050A14',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 1,
  },
});
