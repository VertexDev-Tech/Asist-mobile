import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import {
  Building2,
  User as UserIcon,
  Mail,
  Lock,
  Phone,
  MapPin,
  Sparkles,
  X,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Compass,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Theme } from '../theme/theme';

const SECTOR_OPTIONS = [
  'Tecnología',
  'Retail',
  'Construcción',
  'Salud',
  'Educación',
  'Servicios',
  'Minería',
  'Seguridad',
  'Otro',
];

const RADIUS_OPTIONS = [50, 100, 200, 500];

interface RegisterTrialModalProps {
  visible: boolean;
  onClose: () => void;
}

export const RegisterTrialModal: React.FC<RegisterTrialModalProps> = ({
  visible,
  onClose,
}) => {
  const { theme, isDark } = useTheme();
  const { registerCompany } = useAuth();

  // Form State
  const [companyName, setCompanyName] = useState('');
  const [ruc, setRuc] = useState('');
  const [sector, setSector] = useState('Tecnología');
  const [phone, setPhone] = useState('');

  const [adminName, setAdminName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Geofence / GPS
  const [latitude, setLatitude] = useState(-12.046374);
  const [longitude, setLongitude] = useState(-77.042793);
  const [radius, setRadius] = useState(100);
  const [gpsCaptured, setGpsCaptured] = useState(false);
  const [loadingGps, setLoadingGps] = useState(false);

  // Terms & Submit
  const [acceptTerms, setAcceptTerms] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const styles = createStyles(theme, isDark);

  const handleCaptureGps = async () => {
    try {
      setLoadingGps(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permiso GPS necesario',
          'No se pudo acceder a tu ubicación. Se usarán las coordenadas de Lima por defecto.',
        );
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLatitude(loc.coords.latitude);
      setLongitude(loc.coords.longitude);
      setGpsCaptured(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert(
        'Ubicación no disponible',
        'No pudimos obtener tus coordenadas en este momento.',
      );
    } finally {
      setLoadingGps(false);
    }
  };

  const handleOpenWebSetup = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const url = 'https://ubix.vertexdev.tech/setup';
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Enlace Web', `Ingresa a: ${url}`);
    }
  };

  const handleSubmit = async () => {
    // Validaciones
    if (!companyName.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Campo requerido', 'Ingresa el nombre de tu empresa.');
      return;
    }

    const cleanRuc = ruc.trim();
    if (!cleanRuc || cleanRuc.length !== 11 || !/^\d+$/.test(cleanRuc)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('RUC inválido', 'El RUC debe tener exactamente 11 dígitos numéricos.');
      return;
    }

    if (!sector) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Campo requerido', 'Por favor selecciona el sector de tu empresa.');
      return;
    }

    if (!adminName.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Campo requerido', 'Ingresa tu nombre completo de administrador.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Correo inválido', 'Ingresa un correo electrónico corporativo válido.');
      return;
    }

    if (password.length < 8) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Contraseña débil', 'La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Las contraseñas no coinciden', 'Asegúrate de escribir la misma contraseña en ambos campos.');
      return;
    }

    if (!acceptTerms) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Términos y Condiciones', 'Debes aceptar los términos y condiciones para continuar.');
      return;
    }

    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await registerCompany({
        company_name: companyName.trim(),
        ruc: cleanRuc,
        sector,
        phone: phone.trim() || undefined,
        admin_name: adminName.trim(),
        email: cleanEmail,
        password: password.trim(),
        latitude,
        longitude,
        geofence_radius: radius,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        '¡Cuenta Creada con Éxito!',
        'Bienvenido a UBIX CONTROL. Tu período de prueba gratuita de 30 días ya está activo.',
        [{ text: 'Ingresar Ahora', onPress: onClose }],
      );
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const rawMsg = error.response?.data?.message || error.message || 'No se pudo crear la cuenta de prueba.';
      const msg = Array.isArray(rawMsg) ? rawMsg.join('\n') : String(rawMsg);
      Alert.alert('Error al Registrar', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header Bar */}
        <View style={styles.headerBar}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onClose();
            }}
          >
            <X color={theme.colors.textSecondary} size={22} />
          </TouchableOpacity>

          <View style={styles.badgeTrial}>
            <Sparkles color={theme.colors.cyan} size={14} style={{ marginRight: 4 }} />
            <Text style={styles.badgeTrialText}>TRIAL 30 DÍAS GRATIS</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Title */}
          <MotiView
            from={{ opacity: 0, translateY: -10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400 }}
            style={styles.heroSection}
          >
            <Text style={styles.title}>Crea tu Empresa</Text>
            <Text style={styles.subtitle}>
              Comienza hoy mismo sin costo y sin necesidad de tarjeta de crédito.
            </Text>
          </MotiView>

          {/* Section 1: Empresa */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Building2 color={theme.colors.cyan} size={18} />
              <Text style={styles.sectionTitle}>Datos de tu Empresa</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nombre de la Empresa *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ej. ACME Corporation SAC"
                placeholderTextColor={theme.colors.textMuted}
                value={companyName}
                onChangeText={setCompanyName}
              />
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.inputLabel}>RUC (11 dígitos) *</Text>
                <Text style={styles.counterText}>{ruc.length}/11</Text>
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="20601234567"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="number-pad"
                maxLength={11}
                value={ruc}
                onChangeText={setRuc}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Sector / Industria *</Text>
              <View style={styles.chipsContainer}>
                {SECTOR_OPTIONS.map((item) => {
                  const isSelected = sector === item;
                  return (
                    <TouchableOpacity
                      key={item}
                      style={[
                        styles.chip,
                        isSelected && styles.chipSelected,
                      ]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSector(item);
                      }}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          isSelected && styles.chipTextSelected,
                        ]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Teléfono de Contacto (Opcional)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ej. 987 654 321"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>
          </View>

          {/* Section 2: Administrador */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <UserIcon color={theme.colors.cyan} size={18} />
              <Text style={styles.sectionTitle}>Cuenta de Administrador</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tu Nombre Completo *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ej. Juan Pérez"
                placeholderTextColor={theme.colors.textMuted}
                value={adminName}
                onChangeText={setAdminName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Correo Corporativo *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="admin@tuempresa.com"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Contraseña (Mínimo 8 caracteres) *</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.textInput, { flex: 1, borderWidth: 0 }]}
                  placeholder="Mínimo 8 caracteres"
                  placeholderTextColor={theme.colors.textMuted}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIconBtn}
                >
                  {showPassword ? (
                    <EyeOff color={theme.colors.textMuted} size={18} />
                  ) : (
                    <Eye color={theme.colors.textMuted} size={18} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Repetir Contraseña *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Confirma tu contraseña"
                placeholderTextColor={theme.colors.textMuted}
                secureTextEntry={!showPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>
          </View>

          {/* Section 3: Sede y Geocerca GPS */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <MapPin color={theme.colors.cyan} size={18} />
              <Text style={styles.sectionTitle}>Sede Principal y Geocerca</Text>
            </View>

            <Text style={styles.geofenceDescription}>
              Define el punto de marcado donde tus colaboradores registrarán asistencia.
            </Text>

            <TouchableOpacity
              style={[styles.gpsBtn, gpsCaptured && styles.gpsBtnActive]}
              onPress={handleCaptureGps}
              disabled={loadingGps}
            >
              {loadingGps ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <View style={styles.gpsBtnContent}>
                  <Compass
                    color={gpsCaptured ? theme.colors.emerald : theme.colors.cyan}
                    size={20}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.gpsBtnText}>
                    {gpsCaptured
                      ? 'GPS Obtenido: ' + latitude.toFixed(4) + ', ' + longitude.toFixed(4)
                      : 'Usar mi Ubicación GPS Actual'}
                  </Text>
                  {gpsCaptured && (
                    <CheckCircle2 color={theme.colors.emerald} size={18} style={{ marginLeft: 6 }} />
                  )}
                </View>
              )}
            </TouchableOpacity>

            <View style={[styles.inputGroup, { marginTop: 14 }]}>
              <Text style={styles.inputLabel}>Radio de Geocerca (Metros)</Text>
              <View style={styles.chipsContainer}>
                {RADIUS_OPTIONS.map((r) => {
                  const isSelected = radius === r;
                  return (
                    <TouchableOpacity
                      key={r}
                      style={[
                        styles.chip,
                        isSelected && styles.chipSelected,
                      ]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setRadius(r);
                      }}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          isSelected && styles.chipTextSelected,
                        ]}
                      >
                        {r} metros {r === 100 ? '⭐' : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Terms Checkbox */}
          <TouchableOpacity
            style={styles.termsRow}
            activeOpacity={0.8}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setAcceptTerms(!acceptTerms);
            }}
          >
            <View
              style={[
                styles.checkboxBox,
                acceptTerms && { backgroundColor: theme.colors.cyan, borderColor: theme.colors.cyan },
              ]}
            >
              {acceptTerms && <CheckCircle2 color="#FFF" size={14} />}
            </View>
            <Text style={styles.termsText}>
              Acepto los <Text style={{ color: theme.colors.cyan, fontWeight: '700' }}>Términos y Condiciones</Text> y la Política de Privacidad de UBIX CONTROL.
            </Text>
          </TouchableOpacity>

          {/* Submit Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleSubmit}
            disabled={isSubmitting}
            style={styles.submitBtnWrapper}
          >
            <LinearGradient
              colors={theme.colors.gradients.cyan}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.submitBtn}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <View style={styles.submitBtnContent}>
                  <Sparkles color="#FFF" size={20} style={{ marginRight: 8 }} />
                  <Text style={styles.submitBtnText}>ACTIVAR MI TRIAL GRATIS</Text>
                  <ArrowRight color="#FFF" size={20} style={{ marginLeft: 8 }} />
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Web Option Link */}
          <TouchableOpacity
            style={styles.webLinkBtn}
            onPress={handleOpenWebSetup}
            activeOpacity={0.7}
          >
            <ExternalLink color={theme.colors.textMuted} size={14} style={{ marginRight: 6 }} />
            <Text style={styles.webLinkText}>¿Deseas registrarte en la web? ubix.vertexdev.tech/setup</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const createStyles = (theme: Theme, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    headerBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: Platform.OS === 'ios' ? 52 : 36,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.glassBorder,
      backgroundColor: isDark ? 'rgba(19, 28, 46, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    },
    closeBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    badgeTrial: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(0, 212, 255, 0.15)' : 'rgba(0, 212, 255, 0.1)',
      borderColor: theme.colors.cyan,
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    badgeTrialText: {
      fontSize: 12,
      fontWeight: '800',
      color: theme.colors.cyan,
      letterSpacing: 0.5,
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 60,
    },
    heroSection: {
      marginBottom: 20,
    },
    title: {
      fontSize: 26,
      fontWeight: '800',
      color: theme.colors.textPrimary,
      marginBottom: 6,
    },
    subtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
    sectionCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 18,
      padding: 18,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.colors.glassBorder,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 14,
      gap: 8,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    inputGroup: {
      marginBottom: 14,
    },
    labelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    inputLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      marginBottom: 6,
    },
    counterText: {
      fontSize: 12,
      color: theme.colors.textMuted,
      fontWeight: '600',
    },
    textInput: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
      borderWidth: 1,
      borderColor: theme.colors.glassBorder,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: theme.colors.textPrimary,
    },
    passwordContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
      borderWidth: 1,
      borderColor: theme.colors.glassBorder,
      borderRadius: 12,
    },
    eyeIconBtn: {
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    chipsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
      borderWidth: 1,
      borderColor: theme.colors.glassBorder,
    },
    chipSelected: {
      backgroundColor: isDark ? 'rgba(0, 212, 255, 0.2)' : 'rgba(0, 212, 255, 0.15)',
      borderColor: theme.colors.cyan,
    },
    chipText: {
      fontSize: 13,
      color: theme.colors.textMuted,
      fontWeight: '500',
    },
    chipTextSelected: {
      color: theme.colors.cyan,
      fontWeight: '700',
    },
    geofenceDescription: {
      fontSize: 13,
      color: theme.colors.textMuted,
      marginBottom: 12,
      lineHeight: 18,
    },
    gpsBtn: {
      backgroundColor: isDark ? 'rgba(0, 212, 255, 0.08)' : 'rgba(0, 212, 255, 0.06)',
      borderWidth: 1,
      borderColor: theme.colors.cyan,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    gpsBtnActive: {
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)',
      borderColor: theme.colors.emerald,
    },
    gpsBtnContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    gpsBtnText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    termsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 14,
      paddingHorizontal: 4,
    },
    checkboxBox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: theme.colors.textMuted,
      marginRight: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    termsText: {
      flex: 1,
      fontSize: 13,
      color: theme.colors.textSecondary,
      lineHeight: 18,
    },
    submitBtnWrapper: {
      borderRadius: 14,
      overflow: 'hidden',
      marginTop: 8,
    },
    submitBtn: {
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    submitBtnContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    submitBtnText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    webLinkBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 20,
      paddingVertical: 10,
    },
    webLinkText: {
      fontSize: 12,
      color: theme.colors.textMuted,
      textDecorationLine: 'underline',
    },
  });
