import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Switch, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';
import { MenuRow } from '../../components/MenuRow';
import {
  ShieldCheck,
  Mail,
  Building2,
  Fingerprint,
  LogOut,
  Clock,
  Smartphone,
  AlertTriangle,
} from 'lucide-react-native';

export const AdminProfileScreen = ({ navigation }: any) => {
  const { user, logout, isBiometricAvailable, hasSavedBiometrics, disableBiometrics } = useAuth();

  const handleLogout = () => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro de que deseas salir del panel de administración?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar Sesión', style: 'destructive', onPress: logout },
    ]);
  };

  const handleToggleBiometrics = async (value: boolean) => {
    if (!value) {
      await disableBiometrics();
      Alert.alert('Biometría Desactivada', 'Las credenciales guardadas han sido removidas.');
    } else {
      Alert.alert(
        'Activar Biometría',
        'Para activar la biometría debes realizar un inicio de sesión manual marcando la opción de guardar al ingresar.',
      );
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Perfil de Administrador</Text>
      <Text style={styles.subtitle}>Gestión de cuenta y herramientas corporativas UBIX</Text>

      {/* User Hero Card */}
      <View style={styles.cardHero}>
        <LinearGradient
          colors={theme.colors.gradients.primary}
          style={styles.heroGradient}
        >
          <View style={styles.heroAvatar}>
            <ShieldCheck color={theme.colors.cyan} size={32} />
          </View>
          <Text style={styles.heroName}>{user?.full_name || 'Administrador'}</Text>
          <Text style={styles.heroRole}>{user?.role || 'COMPANY_ADMIN'}</Text>
        </LinearGradient>
      </View>

      {/* Corporate Admin Tools Menu */}
      <Text style={styles.sectionHeader}>HERRAMIENTAS DE ADMINISTRACIÓN</Text>
      <View style={styles.menuCard}>
        <MenuRow
          title="Horarios & Turnos"
          subtitle="Plantillas de trabajo y tolerancias de ingreso"
          icon={<Clock color={theme.colors.cyan} size={20} />}
          onPress={() => navigation.navigate('AdminSchedules')}
        />
        <MenuRow
          title="Dispositivos & Geocercas"
          subtitle="Autorizar celulares e inspeccionar radio GPS"
          icon={<Smartphone color={theme.colors.amber} size={20} />}
          onPress={() => navigation.navigate('AdminDevices')}
        />
        <MenuRow
          title="Alertas & Incidencias"
          subtitle="Revisión de marcaciones fuera de zona"
          icon={<AlertTriangle color={theme.colors.rose} size={20} />}
          onPress={() => navigation.navigate('AdminAlerts')}
        />
      </View>

      {/* Account Info */}
      <Text style={styles.sectionHeader}>INFORMACIÓN DE CUENTA</Text>
      <View style={styles.infoGroup}>
        <View style={styles.infoRow}>
          <View style={styles.rowIcon}>
            <Mail color={theme.colors.cyan} size={20} />
          </View>
          <View style={styles.rowContent}>
            <Text style={styles.rowLabel}>Correo Corporativo</Text>
            <Text style={styles.rowValue}>{user?.email || 'admin@demo.com'}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.rowIcon}>
            <Building2 color={theme.colors.violet} size={20} />
          </View>
          <View style={styles.rowContent}>
            <Text style={styles.rowLabel}>Empresa</Text>
            <Text style={styles.rowValue}>{user?.company_name || 'Empresa Demo'}</Text>
          </View>
        </View>

        {isBiometricAvailable && (
          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <View style={styles.rowIcon}>
              <Fingerprint color={theme.colors.emerald} size={20} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Acceso Biométrico Rápido</Text>
              <Text style={styles.rowValue}>
                {hasSavedBiometrics ? 'Activo' : 'Inactivo'}
              </Text>
            </View>
            <Switch
              value={hasSavedBiometrics}
              onValueChange={handleToggleBiometrics}
              thumbColor={hasSavedBiometrics ? theme.colors.emerald : '#9CA3AF'}
              trackColor={{ false: '#374151', true: 'rgba(16, 185, 129, 0.4)' }}
            />
          </View>
        )}
      </View>

      {/* Logout Action */}
      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <LogOut color={theme.colors.rose} size={20} />
        <Text style={styles.logoutText}>Cerrar Sesión de Administrador</Text>
      </TouchableOpacity>
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
  cardHero: {
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    marginBottom: theme.spacing.lg,
    ...theme.shadows.glowPrimary,
  },
  heroGradient: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  heroAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#050A14',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  heroName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
  },
  heroRole: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
    letterSpacing: 1,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.textMuted,
    letterSpacing: 1,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  menuCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.glassBorder,
    borderWidth: 1,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  infoGroup: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.glassBorder,
    borderWidth: 1,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  rowContent: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderColor: 'rgba(244, 63, 94, 0.3)',
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  logoutText: {
    color: theme.colors.rose,
    fontSize: 15,
    fontWeight: '700',
  },
});
