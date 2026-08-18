import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { MotiView } from 'moti';
import LottieView from 'lottie-react-native';
import * as Haptics from 'expo-haptics';
import { theme } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import { attendanceApi } from '../services/api';
import { secureStorage } from '../services/secureStorage';
import { ShiftStatus } from '../types';
import { startGeofenceMonitoring, stopGeofenceMonitoring } from '../services/geofenceTask';
import {
  MapPin,
  Clock,
  Camera,
  CheckCircle2,
  Sparkles,
  X,
  Navigation,
  ListChecks,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export const HomeScreen = () => {
  const { user } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraVisible, setCameraVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Location & Geofence state
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [distanceM, setDistanceM] = useState<number | null>(null);
  const [isWithinZone, setIsWithinZone] = useState<boolean>(false);
  const [nextActionType, setNextActionType] = useState<'ENTRADA' | 'SALIDA'>('ENTRADA');
  const [todayShifts, setTodayShifts] = useState<ShiftStatus[]>([]);
  const [successVisible, setSuccessVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [deviceId, setDeviceId] = useState<string | null>(null);

  const cameraRef = useRef<any>(null);

  useEffect(() => {
    secureStorage.getOrCreateDeviceId().then(setDeviceId);
  }, []);

  // Live Digital Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Location & Geofence
  useEffect(() => {
    loadLocation();
    fetchTodayStatus();
  }, []);

  const loadLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso de Ubicación', 'Se requiere acceso al GPS para validar tu posición.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(loc);

      // Office coordinates from user config or fallback
      const officeLat = Number(user?.systemConfig?.office_latitude ?? -7.16233);
      const officeLng = Number(user?.systemConfig?.office_longitude ?? -78.51477);
      const radiusM = Number(user?.systemConfig?.geofence_radius_m ?? 150);

      // Distance calculation in meters (Haversine formula)
      const d = calculateDistance(
        loc.coords.latitude,
        loc.coords.longitude,
        officeLat,
        officeLng,
      );
      setDistanceM(Math.round(d));
      setIsWithinZone(d <= radiusM);
    } catch (e) {
      console.log('Location error:', e);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const fetchTodayStatus = async () => {
    try {
      const data = await attendanceApi.getMyToday();
      setTodayShifts(data?.shifts || []);
      
      const officeLat = Number(user?.systemConfig?.office_latitude ?? -7.16233);
      const officeLng = Number(user?.systemConfig?.office_longitude ?? -78.51477);
      const radiusM = Number(user?.systemConfig?.geofence_radius_m ?? 150);

      let nextType: 'ENTRADA' | 'SALIDA' = 'ENTRADA';
      if (data && data.proximo_turno && data.proximo_turno.accion) {
        nextType = data.proximo_turno.accion as 'ENTRADA' | 'SALIDA';
      } else if (data && data.checkIn && !data.checkOut) {
        nextType = 'SALIDA';
      }
      setNextActionType(nextType);

      // Si la siguiente acción es SALIDA (está laborando), aseguramos que el geofence esté activo
      if (nextType === 'SALIDA') {
        startGeofenceMonitoring(officeLat, officeLng, radiusM);
      } else {
        stopGeofenceMonitoring();
      }
    } catch (e) {
      console.log('Today logs error:', e);
    }
  };

  const handleOpenScanner = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert('Cámara Requerida', 'La app necesita permiso de cámara para tomar la selfie.');
        return;
      }
    }
    setCameraVisible(true);
  };

  const handleTakeSelfieAndMark = async () => {
    if (!cameraRef.current || isSubmitting) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setIsSubmitting(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.6,
        base64: true,
        shutterSound: false,
      });

      if (!photo || !photo.base64) {
        throw new Error('No se pudo capturar la selfie.');
      }

      const base64Image = `data:image/jpeg;base64,${photo.base64}`;

      // Call mark endpoint
      const result = await attendanceApi.mark({
        type: nextActionType,
        latitude: location?.coords.latitude || -7.16233,
        longitude: location?.coords.longitude || -78.51477,
        device_fingerprint: deviceId || (await secureStorage.getOrCreateDeviceId()),
        selfie: base64Image,
      });

      setCameraVisible(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccessMessage(result.message || `Has registrado tu ${nextActionType} exitosamente.`);
      setSuccessVisible(true);

      const officeLat = Number(user?.systemConfig?.office_latitude ?? -7.16233);
      const officeLng = Number(user?.systemConfig?.office_longitude ?? -78.51477);
      const radiusM = Number(user?.systemConfig?.geofence_radius_m ?? 150);

      // Gestor de Geofencing en vivo al marcar
      if (nextActionType === 'ENTRADA') {
        startGeofenceMonitoring(officeLat, officeLng, radiusM);
      } else {
        stopGeofenceMonitoring();
      }

      fetchTodayStatus();
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const rawMsg = error.response?.data?.message || error.message || 'Error al procesar el marcado.';
      const msg = Array.isArray(rawMsg) ? rawMsg.join('\n') : String(rawMsg);
      Alert.alert('Marcado no procesado', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formattedTime = currentTime.toLocaleTimeString('es-PE', {
    hour12: true,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const formattedDate = currentTime.toLocaleDateString('es-PE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Info Card */}
      <MotiView
        from={{ opacity: 0, translateY: -15 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 450 }}
        style={styles.userCard}
      >
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'E'}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user?.full_name || 'Empleado'}</Text>
          <Text style={styles.userDni}>DNI: {user?.dni || '---'}</Text>
        </View>
        <View style={styles.badgeShift}>
          <Sparkles color={theme.colors.cyan} size={14} />
          <Text style={styles.badgeShiftText}>Turno Activo</Text>
        </View>
      </MotiView>

      {/* Live Digital Clock Section */}
      <MotiView
        from={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'timing', duration: 500, delay: 100 }}
        style={styles.clockCard}
      >
        <LinearGradient
          colors={theme.colors.gradients.darkCard}
          style={styles.clockGradient}
        >
          <Clock color={theme.colors.primary} size={28} style={styles.clockIcon} />
          <Text style={styles.clockTime}>{formattedTime}</Text>
          <Text style={styles.clockDate}>{formattedDate}</Text>
        </LinearGradient>
      </MotiView>

      {/* GPS Status Banner */}
      <MotiView
        from={{ opacity: 0, translateY: 15 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 500, delay: 200 }}
        style={styles.gpsBanner}
      >
        <View
          style={[
            styles.gpsIndicator,
            { backgroundColor: isWithinZone ? theme.colors.emerald : theme.colors.rose },
          ]}
        >
          {isWithinZone ? (
            <CheckCircle2 color="#FFF" size={18} />
          ) : (
            <Navigation color="#FFF" size={18} />
          )}
        </View>
        <View style={styles.gpsInfo}>
          <Text style={styles.gpsTitle}>
            {isWithinZone ? 'DENTRO DE LA SEDE' : 'FUERA DE ZONA'}
          </Text>
          <Text style={styles.gpsSubtitle}>
            {distanceM !== null
              ? `Distancia actual a la oficina: ${distanceM} metros`
              : 'Verificando señal de GPS...'}
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshGpsBtn} onPress={loadLocation}>
          <MapPin color={theme.colors.textSecondary} size={18} />
        </TouchableOpacity>
      </MotiView>

      {/* Today's Shifts Section (multi-turno) */}
      {todayShifts.length > 0 && (
        <MotiView
          from={{ opacity: 0, translateY: 15 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 250 }}
          style={styles.shiftsCard}
        >
          <View style={styles.shiftsHeader}>
            <ListChecks color={theme.colors.cyan} size={16} />
            <Text style={styles.shiftsTitle}>
              MIS TURNOS DE HOY {todayShifts.length > 1 ? `(${todayShifts.length})` : ''}
            </Text>
          </View>
          {todayShifts.map((shift, i) => {
            const done = !!shift.entry && !!shift.exit;
            const inProgress = !!shift.entry && !shift.exit;
            const statusLabel = done ? 'Completado' : inProgress ? 'En curso' : 'Pendiente';
            const statusColor = done
              ? theme.colors.emerald
              : inProgress
              ? theme.colors.amber
              : theme.colors.textMuted;
            return (
              <View key={shift.shift_id ?? i} style={styles.shiftRow}>
                <View style={styles.shiftInfo}>
                  <Text style={styles.shiftTimes}>
                    Turno {shift.shift_number}: {shift.start_time} - {shift.end_time}
                  </Text>
                  <Text style={styles.shiftDetail}>
                    {shift.entry
                      ? `Entrada: ${new Date(shift.entry.timestamp).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`
                      : 'Sin entrada'}
                    {shift.exit
                      ? ` | Salida: ${new Date(shift.exit.timestamp).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`
                      : ''}
                  </Text>
                </View>
                <View style={[styles.shiftBadge, { backgroundColor: `${statusColor}22` }]}>
                  <Text style={[styles.shiftBadgeText, { color: statusColor }]}>{statusLabel}</Text>
                </View>
              </View>
            );
          })}
        </MotiView>
      )}

      {/* Giant Action Button Section */}
      <MotiView
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'timing', duration: 550, delay: 300 }}
        style={styles.actionSection}
      >
        <Text style={styles.nextActionLabel}>
          PRÓXIMO REGISTRO: <Text style={styles.nextActionHighlight}>{nextActionType}</Text>
        </Text>

        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleOpenScanner}
          style={styles.actionBtnPulseWrapper}
        >
          <LottieView
            source={require('../../assets/lottie/pulse-ring.json')}
            autoPlay
            loop
            style={styles.actionBtnPulseLottie}
          />
          <LinearGradient
            colors={
              nextActionType === 'ENTRADA'
                ? theme.colors.gradients.emerald
                : theme.colors.gradients.amber
            }
            style={styles.actionBtn}
          >
            <Camera color="#FFF" size={48} />
            <Text style={styles.actionBtnText}>
              REGISTRAR {nextActionType}
            </Text>
            <Text style={styles.actionBtnSubtext}>Toca para tomar selfie y marcar</Text>
          </LinearGradient>
        </TouchableOpacity>
      </MotiView>

      {/* Camera Modal */}
      <Modal visible={cameraVisible} animationType="slide" transparent={false}>
        <View style={styles.cameraContainer}>
          <CameraView style={styles.camera} facing="front" ref={cameraRef}>
            {/* Header overlay */}
            <View style={styles.cameraHeader}>
              <Text style={styles.cameraTitle}>Alinea tu rostro</Text>
              <TouchableOpacity
                onPress={() => setCameraVisible(false)}
                style={styles.closeCamBtn}
              >
                <X color="#FFF" size={24} />
              </TouchableOpacity>
            </View>

            {/* Oval Facial Frame Guide */}
            <View style={styles.faceOvalFrame}>
              <View style={styles.faceOvalBorder} />
            </View>

            {/* Bottom Capture Action */}
            <View style={styles.cameraFooter}>
              <TouchableOpacity
                style={styles.captureBtn}
                onPress={handleTakeSelfieAndMark}
                disabled={isSubmitting}
              >
                <LinearGradient
                  colors={theme.colors.gradients.primary}
                  style={styles.captureBtnInner}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFF" size="large" />
                  ) : (
                    <Camera color="#FFF" size={32} />
                  )}
                </LinearGradient>
              </TouchableOpacity>
              <Text style={styles.captureInstructions}>
                Mantén la mirada al frente y toca el botón para tomar la selfie.
              </Text>
            </View>
          </CameraView>
        </View>
      </Modal>

      {/* Success Overlay */}
      <Modal visible={successVisible} animationType="fade" transparent>
        <View style={styles.successOverlay}>
          <MotiView
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 300 }}
            style={styles.successCard}
          >
            <LottieView
              source={require('../../assets/lottie/success-pop.json')}
              autoPlay
              loop={false}
              style={styles.successLottie}
              onAnimationFinish={() => {
                setTimeout(() => setSuccessVisible(false), 700);
              }}
            />
            <Text style={styles.successTitle}>¡Marcado Registrado!</Text>
            <Text style={styles.successSubtitle}>{successMessage}</Text>
          </MotiView>
        </View>
      </Modal>
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
    paddingBottom: 110,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.glassBorder,
    borderWidth: 1,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  avatarText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 20,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  userDni: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  badgeShift: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
  },
  badgeShiftText: {
    color: theme.colors.cyan,
    fontSize: 11,
    fontWeight: '700',
  },
  clockCard: {
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    marginBottom: theme.spacing.lg,
    ...theme.shadows.card,
  },
  clockGradient: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  clockIcon: {
    marginBottom: theme.spacing.sm,
  },
  clockTime: {
    fontSize: 38,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    letterSpacing: 2,
  },
  clockDate: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textTransform: 'capitalize',
    marginTop: 4,
  },
  gpsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.glassBorder,
    borderWidth: 1,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  gpsIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  gpsInfo: {
    flex: 1,
  },
  gpsTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    letterSpacing: 0.5,
  },
  gpsSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  refreshGpsBtn: {
    padding: theme.spacing.xs,
  },
  shiftsCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.glassBorder,
    borderWidth: 1,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  shiftsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: theme.spacing.sm,
  },
  shiftsTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.textMuted,
    letterSpacing: 1,
  },
  shiftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  shiftInfo: {
    flex: 1,
  },
  shiftTimes: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  shiftDetail: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  shiftBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
  },
  shiftBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  actionSection: {
    alignItems: 'center',
    marginVertical: theme.spacing.md,
  },
  nextActionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textMuted,
    letterSpacing: 1,
    marginBottom: theme.spacing.lg,
  },
  nextActionHighlight: {
    color: theme.colors.primary,
  },
  actionBtnPulseWrapper: {
    width: width * 0.72,
    height: width * 0.72,
    borderRadius: (width * 0.72) / 2,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.glowEmerald,
  },
  actionBtnPulseLottie: {
    position: 'absolute',
    width: width * 0.95,
    height: width * 0.95,
  },
  actionBtn: {
    flex: 1,
    borderRadius: (width * 0.72) / 2,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  actionBtnText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 1,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  actionBtnSubtext: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
    textAlign: 'center',
  },

  // Camera Modal Styles
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: 50,
  },
  cameraTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  closeCamBtn: {
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
  },
  faceOvalFrame: {
    alignSelf: 'center',
    width: 240,
    height: 310,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceOvalBorder: {
    width: '100%',
    height: '100%',
    borderRadius: 120,
    borderWidth: 3,
    borderColor: theme.colors.emerald,
    borderStyle: 'dashed',
  },
  cameraFooter: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  captureBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    marginBottom: theme.spacing.md,
  },
  captureBtnInner: {
    width: '100%',
    height: '100%',
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInstructions: {
    color: '#9CA3AF',
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 30,
  },

  // Success Overlay Styles
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.glassBorder,
    borderWidth: 1,
    borderRadius: theme.borderRadius.xl,
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
    width: '80%',
    ...theme.shadows.glowEmerald,
  },
  successLottie: {
    width: 150,
    height: 150,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
});
