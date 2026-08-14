import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { theme } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  Fingerprint,
  Lock,
  User as UserIcon,
  Building2,
  Mail,
} from 'lucide-react-native';

export const LoginScreen = () => {
  const [activeTab, setActiveTab] = useState<'employee' | 'admin'>('employee');

  // Employee Form State
  const [dni, setDni] = useState('');
  const [pin, setPin] = useState('');

  // Admin Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const {
    loginEmployee,
    loginAdmin,
    isLoading,
    authenticateWithBiometrics,
    enableBiometrics,
    isBiometricAvailable,
    hasSavedBiometrics,
  } = useAuth();

  const handleTabSwitch = (tab: 'employee' | 'admin') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
  };

  const handleLogin = async () => {
    if (activeTab === 'employee') {
      if (!dni.trim() || !pin.trim()) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Campos requeridos', 'Por favor ingresa tu DNI y PIN de seguridad.');
        return;
      }

      try {
        await loginEmployee({ dni: dni.trim(), pin: pin.trim() });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        promptEnableBiometrics('employee', dni.trim(), pin.trim());
      } catch (error: any) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        const rawMsg = error.response?.data?.message || 'Credenciales de empleado inválidas.';
        const msg = Array.isArray(rawMsg) ? rawMsg.join('\n') : String(rawMsg);
        Alert.alert('Error de Autenticación', msg);
      }
    } else {
      if (!email.trim() || !password.trim()) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Campos requeridos', 'Por favor ingresa tu correo y contraseña de administrador.');
        return;
      }

      try {
        await loginAdmin({ email: email.trim().toLowerCase(), password: password.trim() });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        promptEnableBiometrics('admin', undefined, undefined, email.trim().toLowerCase(), password.trim());
      } catch (error: any) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        const rawMsg = error.response?.data?.message || 'Credenciales de administrador inválidas.';
        const msg = Array.isArray(rawMsg) ? rawMsg.join('\n') : String(rawMsg);
        Alert.alert('Error de Autenticación', msg);
      }
    }
  };

  const promptEnableBiometrics = (
    mode: 'employee' | 'admin',
    userDni?: string,
    userPin?: string,
    userEmail?: string,
    userPass?: string,
  ) => {
    if (isBiometricAvailable && !hasSavedBiometrics) {
      Alert.alert(
        '🔐 Activar Acceso Biométrico',
        '¿Deseas guardar tus credenciales para ingresar con FaceID o Huella digital la próxima vez?',
        [
          { text: 'Ahora no', style: 'cancel' },
          {
            text: 'Activar Biometría',
            onPress: () => {
              enableBiometrics({
                mode,
                dni: userDni,
                pin: userPin,
                email: userEmail,
                password: userPass,
              });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            },
          },
        ],
      );
    }
  };

  const handleBiometricsTap = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const ok = await authenticateWithBiometrics();
    if (!ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Background Gradient Bubble */}
        <View style={styles.topGradientBubble}>
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.violet] as const}
            style={styles.gradientFill}
          />
        </View>

        {/* Header Badge */}
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600 }}
          style={styles.header}
        >
          <View style={styles.logoBadge}>
            <LinearGradient
              colors={theme.colors.gradients.primary}
              style={styles.logoIconGradient}
            >
              <ShieldCheck color="#FFF" size={36} />
            </LinearGradient>
          </View>
          <Text style={styles.brandTitle}>UBIX<Text style={{ color: theme.colors.cyan }}>CONTROL</Text></Text>
          <Text style={styles.brandSubtitle}>Control de Asistencia Móvil</Text>
        </MotiView>

        {/* Mode Selector Tabs (Empleado / Administrador) */}
        <View style={styles.tabBarContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'employee' && styles.tabButtonActive]}
            onPress={() => handleTabSwitch('employee')}
            activeOpacity={0.8}
          >
            <UserIcon
              color={activeTab === 'employee' ? '#FFF' : theme.colors.textMuted}
              size={18}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'employee' && styles.tabTextActive,
              ]}
            >
              Empleado
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'admin' && styles.tabButtonActive]}
            onPress={() => handleTabSwitch('admin')}
            activeOpacity={0.8}
          >
            <Building2
              color={activeTab === 'admin' ? '#FFF' : theme.colors.textMuted}
              size={18}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'admin' && styles.tabTextActive,
              ]}
            >
              Administrador
            </Text>
          </TouchableOpacity>
        </View>

        {/* Card Form */}
        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 500 }}
          style={styles.card}
        >
          <Text style={styles.cardTitle}>
            {activeTab === 'employee' ? 'Ingreso de Empleados' : 'Panel de Administración'}
          </Text>
          <Text style={styles.cardSubtitle}>
            {activeTab === 'employee'
              ? 'Ingresa tu DNI y PIN asignado para marcar asistencia'
              : 'Ingresa con tu correo corporativo y contraseña'}
          </Text>

          {activeTab === 'employee' ? (
            /* Empleado Form */
            <>
              <View style={styles.inputContainer}>
                <UserIcon color={theme.colors.textMuted} size={20} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Número de DNI"
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="number-pad"
                  value={dni}
                  onChangeText={setDni}
                  maxLength={12}
                />
              </View>

              <View style={styles.inputContainer}>
                <Lock color={theme.colors.textMuted} size={20} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="PIN de Seguridad (ej: 714846)"
                  placeholderTextColor={theme.colors.textMuted}
                  secureTextEntry
                  keyboardType="number-pad"
                  value={pin}
                  onChangeText={setPin}
                  maxLength={8}
                />
              </View>
            </>
          ) : (
            /* Admin Form */
            <>
              <View style={styles.inputContainer}>
                <Mail color={theme.colors.textMuted} size={20} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Correo (admin@demo.com)"
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View style={styles.inputContainer}>
                <Lock color={theme.colors.textMuted} size={20} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Contraseña (Admin1234!)"
                  placeholderTextColor={theme.colors.textMuted}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
            </>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleLogin}
            disabled={isLoading}
            style={styles.loginBtnWrapper}
          >
            <LinearGradient
              colors={theme.colors.gradients.primary}
              style={styles.loginBtn}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.loginBtnText}>
                  {activeTab === 'employee' ? 'INGRESAR COMO EMPLEADO' : 'INGRESAR COMO ADMIN'}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Biometrics Action (Visible if saved) */}
          {isBiometricAvailable && hasSavedBiometrics && (
            <TouchableOpacity
              style={styles.biometricBtn}
              onPress={handleBiometricsTap}
              activeOpacity={0.7}
            >
              <Fingerprint color={theme.colors.cyan} size={24} />
              <Text style={styles.biometricBtnText}>Acceso Rápido con Biometría</Text>
            </TouchableOpacity>
          )}
        </MotiView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  topGradientBubble: {
    position: 'absolute',
    top: -100,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    opacity: 0.25,
    overflow: 'hidden',
  },
  gradientFill: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  logoBadge: {
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    padding: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  logoIconGradient: {
    width: 68,
    height: 68,
    borderRadius: theme.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    letterSpacing: 2,
  },
  brandSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  tabBarContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.glassBorder,
    borderWidth: 1,
    borderRadius: theme.borderRadius.lg,
    padding: 4,
    marginBottom: theme.spacing.lg,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
  },
  tabButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textMuted,
  },
  tabTextActive: {
    color: '#FFF',
  },
  card: {
    backgroundColor: theme.colors.glass,
    borderColor: theme.colors.glassBorder,
    borderWidth: 1,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    ...theme.shadows.card,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.glassBorder,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    height: 54,
    marginBottom: theme.spacing.md,
  },
  inputIcon: {
    marginRight: theme.spacing.sm,
  },
  input: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: 15,
  },
  loginBtnWrapper: {
    marginTop: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    ...theme.shadows.glowPrimary,
  },
  loginBtn: {
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1,
  },
  biometricBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    gap: 8,
  },
  biometricIconWrapper: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  biometricPulse: {
    position: 'absolute',
    width: 60,
    height: 60,
  },
  biometricBtnText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
