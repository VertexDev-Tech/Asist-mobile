import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { theme } from '../../theme/theme';
import { devicesApi, companiesApi } from '../../services/api';
import { DeviceItemFull } from '../../types';
import { Smartphone, ShieldCheck, MapPin, Check, Trash2, ShieldAlert } from 'lucide-react-native';

export const AdminDevicesScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingDevices, setPendingDevices] = useState<any[]>([]);
  const [authorizedDevices, setAuthorizedDevices] = useState<DeviceItemFull[]>([]);
  const [geofenceRadius, setGeofenceRadius] = useState<number | null>(null);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      setLoading(true);
      const [pending, authorized, company] = await Promise.all([
        devicesApi.getPending().catch(() => []),
        devicesApi.getAuthorized().catch(() => []),
        companiesApi.getMe().catch(() => null),
      ]);
      setPendingDevices(pending || []);
      setAuthorizedDevices(authorized || []);
      setGeofenceRadius(company?.systemConfig?.geofence_radius_m ?? null);
    } catch (e) {
      console.log('Error loading pending devices:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAuthorize = async (id: number, employeeName: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await devicesApi.authorize(id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('¡Dispositivo Autorizado!', `El celular de ${employeeName} fue vinculado con éxito.`);
      loadDevices();
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'No se pudo autorizar el dispositivo.');
    }
  };

  const handleRevoke = (device: DeviceItemFull) => {
    Alert.alert(
      'Revocar Dispositivo',
      `¿Revocar el acceso del celular de ${device.employee?.full_name || 'este empleado'}? Deberá autorizar uno nuevo para volver a marcar.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Revocar',
          style: 'destructive',
          onPress: async () => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              await devicesApi.revoke(device.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              loadDevices();
            } catch (e) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('Error', 'No se pudo revocar el dispositivo.');
            }
          },
        },
      ],
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadDevices();
          }}
          tintColor={theme.colors.cyan}
        />
      }
    >
      <Text style={styles.title}>Dispositivos & Geocercas</Text>
      <Text style={styles.subtitle}>Vinculación de celulares e inmutabilidad GPS</Text>

      {/* Geofence Card */}
      <MotiView
        from={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'timing', duration: 400 }}
        style={styles.geofenceCard}
      >
        <View style={styles.geoHeader}>
          <MapPin color={theme.colors.cyan} size={22} />
          <Text style={styles.geoTitle}>SEDE PRINCIPAL UBIX</Text>
        </View>
        <Text style={styles.geoDetail}>
          Radio de Cobertura Autorizado:{' '}
          <Text style={styles.geoHighlight}>
            {geofenceRadius !== null ? `${geofenceRadius} Metros` : 'Cargando...'}
          </Text>
        </Text>
        <Text style={styles.geoSubdetail}>
          Las marcaciones fuera del radio generan alertas automáticas de geocerca.
        </Text>
      </MotiView>

      {/* Pending Devices Header */}
      <View style={styles.sectionHeader}>
        <Smartphone color={theme.colors.amber} size={18} />
        <Text style={styles.sectionTitle}>SOLICITUDES DE CELULARES PENDIENTES</Text>
      </View>

      {pendingDevices && pendingDevices.length > 0 ? (
        pendingDevices.map((device, index) => (
          <MotiView
            key={device.id || index}
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 350, delay: index * 50 }}
            style={styles.deviceCard}
          >
            <View style={styles.deviceIconCircle}>
              <Smartphone color={theme.colors.amber} size={22} />
            </View>

            <View style={styles.deviceInfo}>
              <Text style={styles.employeeName}>
                {device.employee?.full_name || 'Empleado'}
              </Text>
              <Text style={styles.deviceModel}>
                {device.model || 'Teléfono Móvil'} ({device.fingerprint ? device.fingerprint.slice(0, 14) : 'ANDROID'})
              </Text>
            </View>

            <TouchableOpacity
              style={styles.authorizeBtn}
              onPress={() => handleAuthorize(device.id, device.employee?.full_name || 'Empleado')}
            >
              <Check color="#050A14" size={16} />
              <Text style={styles.authorizeBtnText}>AUTORIZAR</Text>
            </TouchableOpacity>
          </MotiView>
        ))
      ) : (
        <View style={styles.emptyContainer}>
          <ShieldCheck color={theme.colors.emerald} size={32} />
          <Text style={styles.emptyText}>No hay celulares pendientes de autorización.</Text>
        </View>
      )}

      {/* Authorized Devices Header */}
      <View style={[styles.sectionHeader, { marginTop: theme.spacing.lg }]}>
        <ShieldCheck color={theme.colors.emerald} size={18} />
        <Text style={styles.sectionTitle}>CELULARES AUTORIZADOS</Text>
      </View>

      {authorizedDevices && authorizedDevices.length > 0 ? (
        authorizedDevices.map((device, index) => (
          <MotiView
            key={device.id || index}
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 350, delay: index * 50 }}
            style={styles.authorizedCard}
          >
            <View style={styles.deviceIconCircleEmerald}>
              <Smartphone color={theme.colors.emerald} size={22} />
            </View>

            <View style={styles.deviceInfo}>
              <Text style={styles.employeeName}>
                {device.employee?.full_name || 'Empleado'}
              </Text>
              <Text style={styles.deviceModel}>
                {device.platform || 'Móvil'} · {device.fingerprint ? device.fingerprint.slice(0, 14) : ''}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.revokeBtn}
              onPress={() => handleRevoke(device)}
            >
              <Trash2 color={theme.colors.rose} size={16} />
            </TouchableOpacity>
          </MotiView>
        ))
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Aún no hay celulares autorizados.</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
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
  geofenceCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.glassBorder,
    borderWidth: 1,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    ...theme.shadows.card,
  },
  geoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: theme.spacing.sm,
  },
  geoTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.cyan,
    letterSpacing: 1,
  },
  geoDetail: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    marginTop: 2,
  },
  geoHighlight: {
    color: theme.colors.emerald,
    fontWeight: '800',
  },
  geoSubdetail: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.textMuted,
    letterSpacing: 1,
  },
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  deviceIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  deviceInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  deviceModel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  authorizeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.cyan,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.md,
  },
  authorizeBtnText: {
    color: '#050A14',
    fontSize: 11,
    fontWeight: '800',
  },
  authorizedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  deviceIconCircleEmerald: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  revokeBtn: {
    padding: 10,
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderRadius: theme.borderRadius.md,
  },
  emptyContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
});
