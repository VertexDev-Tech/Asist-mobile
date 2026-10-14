import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { MotiView } from 'moti';
import Svg, {
  Circle,
  Line,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
} from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Theme } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { attendanceApi } from '../services/api';
import { CyberWolfSprite } from '../components/CyberWolfSprite';
import {
  MapPin,
  Clock,
  Camera,
  CheckCircle2,
  Sparkles,
  X,
  Navigation,
  Sun,
  Moon,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');
const DIAL_SIZE = Math.min(width * 0.78, 300);
const BUTTON_CORE_SIZE = DIAL_SIZE * 0.76;

export const HomeScreen = () => {
  const { user } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraVisible, setCameraVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Location & Geofence state
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [distanceM, setDistanceM] = useState<number | null>(null);
  const [isWithinZone, setIsWithinZone] = useState<boolean>(false);
  const [nextActionType, setNextActionType] = useState<'ENTRADA' | 'SALIDA'>('ENTRADA');
  const [todayLogs, setTodayLogs] = useState<any[]>([]);

  // Success Modal
  const [successVisible, setSuccessVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const cameraRef = useRef<any>(null);
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

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

      const officeLat = user?.systemConfig?.office_latitude ?? -7.16233;
      const officeLng = user?.systemConfig?.office_longitude ?? -78.51477;
      const radiusM = user?.systemConfig?.geofence_radius_m ?? 150;

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
    const R = 6371e3;
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
      setTodayLogs(data?.shifts || []);

      if (data && data.proximo_turno && data.proximo_turno.accion) {
        setNextActionType(data.proximo_turno.accion);
      } else if (data && data.has_open_entrada) {
        setNextActionType('SALIDA');
      } else {
        setNextActionType('ENTRADA');
      }
    } catch (e) {
      console.log('Error loading today status:', e);
    }
  };

  // Justification Modal for Out of Zone / Special Marks
  const [justificationModalVisible, setJustificationModalVisible] = useState(false);
  const [outOfZoneReason, setOutOfZoneReason] = useState('');

  const handleOpenScanner = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    if (!permission || !permission.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert(
          'Permiso de Cámara',
          'Debes conceder acceso a la cámara para tomar tu selfie de validación.',
        );
        return;
      }
    }

    if (!isWithinZone) {
      // Prompt justification modal before camera
      setOutOfZoneReason('');
      setJustificationModalVisible(true);
      return;
    }

    setCameraVisible(true);
  };

  const handleProceedWithJustification = () => {
    setJustificationModalVisible(false);
    setCameraVisible(true);
  };

  const handleCapture = async () => {
    if (!cameraRef.current || isSubmitting) return;

    try {
      setIsSubmitting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.6,
        base64: true,
      });

      if (!photo || !photo.base64) {
        throw new Error('No se pudo capturar la selfie.');
      }

      const base64Image = `data:image/jpeg;base64,${photo.base64}`;

      const result = await attendanceApi.mark({
        type: nextActionType,
        latitude: location?.coords.latitude || -7.16233,
        longitude: location?.coords.longitude || -78.51477,
        device_fingerprint: 'MOBILE_EXPO_DEVICE_' + (user?.id || 1),
        selfie: base64Image,
        justification: outOfZoneReason.trim() || undefined,
      });

      setCameraVisible(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccessMessage(result.message || `Has registrado tu ${nextActionType} exitosamente.`);
      setSuccessVisible(true);
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

  // Generar los ticks radiales del dial
  const radialTicks = useMemo(() => {
    const totalTicks = 42;
    const cx = DIAL_SIZE / 2;
    const cy = DIAL_SIZE / 2;
    const rOuter = DIAL_SIZE / 2 - 2;
    const rInner = DIAL_SIZE / 2 - 11;

    const ticks = [];
    for (let i = 0; i < totalTicks; i++) {
      const angle = (i / totalTicks) * 2 * Math.PI - Math.PI / 2;
      const x1 = cx + rInner * Math.cos(angle);
      const y1 = cy + rInner * Math.sin(angle);
      const x2 = cx + rOuter * Math.cos(angle);
      const y2 = cy + rOuter * Math.sin(angle);

      const isTopQuarter = i <= 6 || i >= 36;
      const isSidePointers = (i >= 12 && i <= 16) || (i >= 26 && i <= 30);
      const strokeColor = isTopQuarter || isSidePointers
        ? '#00F5FF'
        : isDark
        ? 'rgba(255, 255, 255, 0.22)'
        : 'rgba(2, 132, 199, 0.25)';
      const strokeOpacity = isTopQuarter ? 0.95 : isSidePointers ? 0.7 : 0.35;
      const strokeWidth = i % 3 === 0 ? 2 : 1.2;

      ticks.push({
        id: i,
        x1,
        y1,
        x2,
        y2,
        strokeColor,
        strokeOpacity,
        strokeWidth,
      });
    }
    return ticks;
  }, [isDark]);

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
        <View style={styles.headerRightActions}>
          <View style={styles.badgeShift}>
            <Sparkles color={theme.colors.cyan} size={13} />
            <Text style={styles.badgeShiftText}>Turno Activo</Text>
          </View>
          <TouchableOpacity
            style={styles.themeToggleBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              toggleTheme();
            }}
            activeOpacity={0.7}
          >
            {isDark ? (
              <Sun color="#FBBF24" size={18} />
            ) : (
              <Moon color={theme.colors.cyan} size={18} />
            )}
          </TouchableOpacity>
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
          colors={isDark ? ['#131C2E', '#0B0F19'] : ['#FFFFFF', '#F8FAFC']}
          style={styles.clockGradient}
        >
          <Clock color={theme.colors.cyan} size={26} style={styles.clockIcon} />
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
              ? `Distancia a oficina: ${distanceM} m`
              : 'Verificando señal GPS...'}
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshGpsBtn} onPress={loadLocation}>
          <MapPin color={theme.colors.textSecondary} size={18} />
        </TouchableOpacity>
      </MotiView>



      {/* Precision Chrono Dial & Dynamic Animated Progress Ring */}
      <MotiView
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'timing', duration: 550, delay: 300 }}
        style={styles.actionSection}
      >
        <View style={styles.nextActionBadgeContainer}>
          <Text style={styles.nextActionLabel}>
            ESTADO:{' '}
            <Text style={styles.nextActionHighlight}>
              {nextActionType === 'ENTRADA' ? 'PENDIENTE DE INGRESO' : 'JORNADA EN CURSO'}
            </Text>
          </Text>
        </View>

        {/* Dial + Glowing Nodes + Dome Button */}
        <View style={styles.dialWrapper}>
          {/* Animated Ambient Pulsing Halo behind Button */}
          <MotiView
            from={{ scale: 0.96, opacity: 0.5 }}
            animate={{ scale: 1.14, opacity: 0 }}
            transition={{
              type: 'timing',
              duration: 2200,
              loop: true,
            }}
            style={styles.pulsingHaloRing}
          />

          {/* Slow Continuous 360° Rotating Ticks SVG Overlay */}
          <MotiView
            from={{ rotate: '0deg' }}
            animate={{ rotate: '360deg' }}
            transition={{
              type: 'timing',
              duration: 32000,
              loop: true,
              repeatReverse: false,
            }}
            style={styles.svgDialContainer}
          >
            <Svg width={DIAL_SIZE} height={DIAL_SIZE} viewBox={`0 0 ${DIAL_SIZE} ${DIAL_SIZE}`}>
              <Defs>
                <SvgGradient id="arcGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#00F5FF" stopOpacity="0.9" />
                  <Stop offset="50%" stopColor="#00D4FF" stopOpacity="0.6" />
                  <Stop offset="100%" stopColor="#0284C7" stopOpacity="0.2" />
                </SvgGradient>
              </Defs>

              {/* Dial Track Circle */}
              <Circle
                cx={DIAL_SIZE / 2}
                cy={DIAL_SIZE / 2}
                r={DIAL_SIZE / 2 - 6}
                stroke={isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(2, 132, 199, 0.12)'}
                strokeWidth="1"
                fill="none"
              />

              {/* Radial Precision Ticks */}
              {radialTicks.map((t) => (
                <Line
                  key={t.id}
                  x1={t.x1}
                  y1={t.y1}
                  x2={t.x2}
                  y2={t.y2}
                  stroke={t.strokeColor}
                  strokeOpacity={t.strokeOpacity}
                  strokeWidth={t.strokeWidth}
                  strokeLinecap="round"
                />
              ))}

              {/* Glowing Glass Outer Bevel Ring */}
              <Circle
                cx={DIAL_SIZE / 2}
                cy={DIAL_SIZE / 2}
                r={BUTTON_CORE_SIZE / 2 + 5}
                stroke="url(#arcGlow)"
                strokeWidth="3"
                fill="none"
              />
            </Svg>
          </MotiView>

          {/* Top Animated Pointer Marker with Luminous Heartbeat */}
          <MotiView
            from={{ opacity: 0.7, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1.1 }}
            transition={{
              type: 'timing',
              duration: 1500,
              loop: true,
            }}
            style={styles.topPointerMarker}
          >
            <View style={styles.topArrowHead} />
            <View style={styles.topPointerGlow} />
          </MotiView>

          {/* Left Animated Glowing Node Marker */}
          <MotiView
            from={{ opacity: 0.55, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1.12 }}
            transition={{
              type: 'timing',
              duration: 1500,
              delay: 350,
              loop: true,
            }}
            style={styles.leftNodeMarker}
          >
            <View style={styles.nodeCapsuleGlow} />
          </MotiView>

          {/* Right Animated Glowing Node Marker */}
          <MotiView
            from={{ opacity: 0.55, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1.12 }}
            transition={{
              type: 'timing',
              duration: 1500,
              delay: 350,
              loop: true,
            }}
            style={styles.rightNodeMarker}
          >
            <View style={styles.nodeCapsuleGlow} />
          </MotiView>

          {/* Central 3D Smoked Glass Dome Button */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleOpenScanner}
            style={styles.centerDomeButton}
          >
            <LinearGradient
              colors={
                isDark
                  ? ['#1E293B', '#0F172A', '#0B0F19']
                  : ['#FFFFFF', '#F1F5F9', '#E2E8F0']
              }
              start={{ x: 0.3, y: 0 }}
              end={{ x: 0.7, y: 1 }}
              style={styles.domeGradient}
            >
              {/* Glass Rim Reflection Highlight */}
              <View style={styles.glassRimHighlight} />

              {/* Breathing Camera Icon Badge */}
              <MotiView
                from={{ scale: 0.94, opacity: 0.85 }}
                animate={{ scale: 1.06, opacity: 1 }}
                transition={{
                  type: 'timing',
                  duration: 1800,
                  loop: true,
                }}
                style={styles.cameraIconBadge}
              >
                <Camera color="#00F5FF" size={38} strokeWidth={2.4} />
              </MotiView>

              {/* Title: MARCAR ENTRADA / SALIDA */}
              <Text style={styles.actionTitleText}>
                MARCAR {nextActionType}
              </Text>

              {/* Status Pill: Verificado GPS */}
              <View style={styles.gpsVerifiedPill}>
                <MotiView
                  from={{ opacity: 0.4 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    type: 'timing',
                    duration: 800,
                    loop: true,
                  }}
                  style={[
                    styles.gpsDot,
                    { backgroundColor: isWithinZone ? '#10B981' : '#EF4444' },
                  ]}
                />
                <Text style={styles.gpsVerifiedText}>
                  {isWithinZone ? 'Verificado: GPS' : 'Fuera de Zona'}
                </Text>
              </View>

              {/* Subtitle */}
              <Text style={styles.actionSubtext}>
                {nextActionType === 'ENTRADA' ? 'Toca para ingresar y marcar' : 'Toca para salir y marcar'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Feature Check Note at the bottom */}
        <View style={styles.featureNoteRow}>
          <CheckCircle2 color={theme.colors.cyan} size={16} />
          <Text style={styles.featureNoteText}>
            Anillo de progreso con ticks luminosos y borde de vidrio
          </Text>
        </View>
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
                onPress={handleCapture}
                disabled={isSubmitting}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#00F5FF', '#0284C7']}
                  style={styles.captureBtnInner}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#050A14" size="small" />
                  ) : (
                    <Camera color="#050A14" size={32} />
                  )}
                </LinearGradient>
              </TouchableOpacity>
              <Text style={styles.captureInstructions}>
                Mantén una postura frontal para la verificación fotográfica
              </Text>
            </View>
          </CameraView>
        </View>
      </Modal>

      {/* Out of Zone Justification Modal */}
      <Modal visible={justificationModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MapPin color={theme.colors.orange} size={22} />
                <Text style={styles.modalTitle}>Marcación Fuera de Zona</Text>
              </View>
              <TouchableOpacity onPress={() => setJustificationModalVisible(false)}>
                <X color={theme.colors.textMuted} size={20} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDesc}>
              Te encuentras fuera del perímetro permitido ({distanceM ?? '—'} m). Ingresa el motivo de tu marcación para continuar:
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Ej. Visita a cliente / Trabajo en campo / Tráfico"
              placeholderTextColor={theme.colors.textMuted}
              value={outOfZoneReason}
              onChangeText={setOutOfZoneReason}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setJustificationModalVisible(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleProceedWithJustification}
              >
                <Text style={styles.modalSaveBtnText}>Continuar a Foto →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success Modal Overlay */}
      <Modal visible={successVisible} transparent animationType="fade">
        <View style={styles.successOverlay}>
          <MotiView
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 14 }}
            style={styles.successCard}
          >
            <View style={{ marginBottom: 6 }}>
              <CyberWolfSprite size={115} pose="celebrating" showAura floating />
            </View>
            <Text style={styles.successTitle}>¡Marcación Exitosa!</Text>
            <Text style={styles.successSubtitle}>{successMessage}</Text>

            <TouchableOpacity
              style={styles.successBtn}
              onPress={() => setSuccessVisible(false)}
            >
              <Text style={styles.successBtnText}>ENTENDIDO</Text>
            </TouchableOpacity>
          </MotiView>
        </View>
      </Modal>
    </ScrollView>
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
    userCard: {
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
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '800',
    },
    userInfo: {
      flex: 1,
    },
    userName: {
      fontSize: 15,
      fontWeight: '800',
      color: theme.colors.textPrimary,
    },
    userDni: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    headerRightActions: {
      alignItems: 'flex-end',
      gap: 6,
    },
    badgeShift: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: isDark ? 'rgba(0, 212, 255, 0.15)' : 'rgba(2, 132, 199, 0.12)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: theme.borderRadius.full,
    },
    badgeShiftText: {
      color: theme.colors.cyan,
      fontSize: 11,
      fontWeight: '800',
    },
    themeToggleBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9',
      justifyContent: 'center',
      alignItems: 'center',
    },
    clockCard: {
      borderRadius: theme.borderRadius.xl,
      overflow: 'hidden',
      marginBottom: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.glassBorder,
      ...theme.shadows.card,
    },
    clockGradient: {
      paddingVertical: theme.spacing.lg,
      paddingHorizontal: theme.spacing.xl,
      alignItems: 'center',
    },
    clockIcon: {
      marginBottom: 6,
    },
    clockTime: {
      fontSize: 34,
      fontWeight: '900',
      color: theme.colors.textPrimary,
      letterSpacing: 1.5,
    },
    clockDate: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      marginTop: 4,
      textTransform: 'capitalize',
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
      ...theme.shadows.card,
    },
    gpsIndicator: {
      width: 34,
      height: 34,
      borderRadius: 17,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing.md,
    },
    gpsInfo: {
      flex: 1,
    },
    gpsTitle: {
      fontSize: 12,
      fontWeight: '800',
      color: theme.colors.textPrimary,
      letterSpacing: 0.5,
    },
    gpsSubtitle: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    refreshGpsBtn: {
      padding: 8,
    },
    actionSection: {
      alignItems: 'center',
      marginTop: 6,
    },
    nextActionBadgeContainer: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.glassBorder,
      borderWidth: 1,
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: theme.borderRadius.full,
      marginBottom: 16,
      ...theme.shadows.card,
    },
    nextActionLabel: {
      fontSize: 11,
      fontWeight: '800',
      color: theme.colors.textMuted,
      letterSpacing: 0.8,
    },
    nextActionHighlight: {
      color: theme.colors.cyan,
      fontWeight: '900',
    },

    // Precision Dial & Chrono Glass Dome
    dialWrapper: {
      width: DIAL_SIZE,
      height: DIAL_SIZE,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    pulsingHaloRing: {
      position: 'absolute',
      width: BUTTON_CORE_SIZE + 18,
      height: BUTTON_CORE_SIZE + 18,
      borderRadius: (BUTTON_CORE_SIZE + 18) / 2,
      borderWidth: 2,
      borderColor: '#00F5FF',
      backgroundColor: isDark ? 'rgba(0, 245, 255, 0.12)' : 'rgba(2, 132, 199, 0.1)',
    },
    svgDialContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: DIAL_SIZE,
      height: DIAL_SIZE,
      pointerEvents: 'none',
    },

    // Pointers & Luminous Nodes
    topPointerMarker: {
      position: 'absolute',
      top: 14,
      alignItems: 'center',
      zIndex: 10,
    },
    topArrowHead: {
      width: 0,
      height: 0,
      backgroundColor: 'transparent',
      borderStyle: 'solid',
      borderLeftWidth: 5,
      borderRightWidth: 5,
      borderBottomWidth: 7,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderBottomColor: '#00F5FF',
    },
    topPointerGlow: {
      width: 6,
      height: 14,
      borderRadius: 3,
      backgroundColor: '#00F5FF',
      shadowColor: '#00F5FF',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 1,
      shadowRadius: 10,
      elevation: 8,
      marginTop: 2,
    },
    leftNodeMarker: {
      position: 'absolute',
      left: 18,
      bottom: DIAL_SIZE * 0.22,
      transform: [{ rotate: '-40deg' }],
      zIndex: 10,
    },
    rightNodeMarker: {
      position: 'absolute',
      right: 18,
      bottom: DIAL_SIZE * 0.22,
      transform: [{ rotate: '40deg' }],
      zIndex: 10,
    },
    nodeCapsuleGlow: {
      width: 6,
      height: 18,
      borderRadius: 3,
      backgroundColor: '#00F5FF',
      shadowColor: '#00F5FF',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 1,
      shadowRadius: 10,
      elevation: 8,
    },

    // Dome Button
    centerDomeButton: {
      width: BUTTON_CORE_SIZE,
      height: BUTTON_CORE_SIZE,
      borderRadius: BUTTON_CORE_SIZE / 2,
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: 'rgba(0, 245, 255, 0.4)',
      shadowColor: '#00F5FF',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.55 : 0.35,
      shadowRadius: 24,
      elevation: 14,
    },
    domeGradient: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.md,
      position: 'relative',
    },
    glassRimHighlight: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: BUTTON_CORE_SIZE * 0.45,
      borderTopLeftRadius: BUTTON_CORE_SIZE / 2,
      borderTopRightRadius: BUTTON_CORE_SIZE / 2,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.45)',
    },
    cameraIconBadge: {
      marginBottom: 6,
      shadowColor: '#00F5FF',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 12,
      elevation: 6,
    },
    actionTitleText: {
      fontSize: 18,
      fontWeight: '900',
      color: theme.colors.textPrimary,
      letterSpacing: 1.2,
      textAlign: 'center',
    },
    gpsVerifiedPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.85)',
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
      borderWidth: 1,
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: theme.borderRadius.full,
      marginTop: 6,
    },
    gpsDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    gpsVerifiedText: {
      fontSize: 10.5,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    actionSubtext: {
      fontSize: 10,
      fontWeight: '500',
      color: theme.colors.textSecondary,
      marginTop: 4,
      textAlign: 'center',
    },

    // Bottom Feature Note
    featureNoteRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 20,
      paddingHorizontal: 16,
    },
    featureNoteText: {
      fontSize: 11.5,
      fontWeight: '600',
      color: theme.colors.textSecondary,
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
      borderColor: theme.colors.cyan,
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
      ...theme.shadows.glowPrimary,
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
      ...theme.shadows.card,
    },
    successIconCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: 'rgba(16, 185, 129, 0.15)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
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
    successBtn: {
      backgroundColor: theme.colors.cyan,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: theme.borderRadius.md,
      marginTop: theme.spacing.lg,
    },
    successBtnText: {
      color: '#050A14',
      fontSize: 13,
      fontWeight: '800',
      letterSpacing: 0.8,
    },

    // Justification Modal Styles
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
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    modalTitle: {
      fontSize: 17,
      fontWeight: '900',
      color: theme.colors.textPrimary,
    },
    modalDesc: {
      fontSize: 12.5,
      color: theme.colors.textSecondary,
      marginBottom: 12,
      lineHeight: 18,
    },
    modalInput: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F8FAFC',
      borderColor: theme.colors.glassBorder,
      borderWidth: 1,
      borderRadius: theme.borderRadius.md,
      padding: 12,
      color: theme.colors.textPrimary,
      fontSize: 13,
      marginBottom: 16,
    },
    modalActionsRow: {
      flexDirection: 'row',
      gap: 10,
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
      flex: 1.4,
      paddingVertical: 12,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      backgroundColor: theme.colors.cyan,
    },
    modalSaveBtnText: {
      color: '#050A14',
      fontWeight: '900',
      fontSize: 13,
    },
  });
