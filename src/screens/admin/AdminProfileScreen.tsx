import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { Theme } from '../../theme/theme';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { MenuRow } from '../../components/MenuRow';
import {
  ShieldCheck,
  Building,
  Clock,
  Smartphone,
  AlertTriangle,
  LogOut,
  Sun,
  Moon,
  Sparkles,
} from 'lucide-react-native';

export const AdminProfileScreen = () => {
  const { user, logout } = useAuth();
  const { theme, isDark, setThemeMode } = useTheme();
  const navigation = useNavigation<any>();

  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas salir del panel de administración?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ],
    );
  };

  const handleSelectTheme = (mode: 'light' | 'dark') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setThemeMode(mode);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Perfil de Administrador</Text>
      <Text style={styles.subtitle}>Gestión de empresa y ajustes de la cuenta</Text>

      {/* Admin Hero Card */}
      <View style={styles.cardHero}>
        <LinearGradient
          colors={theme.colors.gradients.cyan}
          style={styles.heroGradient}
        >
          <View style={styles.heroAvatar}>
            <ShieldCheck color="#050A14" size={32} />
          </View>
          <Text style={styles.heroName}>{user?.full_name || 'Administrador'}</Text>
          <Text style={styles.heroRole}>{user?.role || 'COMPANY_ADMIN'}</Text>
        </LinearGradient>
      </View>

      {/* Theme Appearance Selector Section */}
      <Text style={styles.sectionHeader}>APARIENCIA & MODO DE COLOR</Text>
      <View style={styles.themeSelectorContainer}>
        <TouchableOpacity
          style={[
            styles.themeOptionBtn,
            !isDark && styles.themeOptionBtnActive,
          ]}
          onPress={() => handleSelectTheme('light')}
          activeOpacity={0.8}
        >
          <Sun color={!isDark ? theme.colors.cyan : theme.colors.textMuted} size={20} />
          <Text
            style={[
              styles.themeOptionText,
              !isDark && styles.themeOptionTextActive,
            ]}
          >
            Modo Blanco (Claro)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.themeOptionBtn,
            isDark && styles.themeOptionBtnActive,
          ]}
          onPress={() => handleSelectTheme('dark')}
          activeOpacity={0.8}
        >
          <Moon color={isDark ? theme.colors.cyan : theme.colors.textMuted} size={20} />
          <Text
            style={[
              styles.themeOptionText,
              isDark && styles.themeOptionTextActive,
            ]}
          >
            Modo Oscuro (Obsidian)
          </Text>
        </TouchableOpacity>
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
          last
        />
      </View>

      {/* Account Info */}
      <Text style={styles.sectionHeader}>INFORMACIÓN DE CUENTA</Text>
      <View style={styles.infoGroup}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Correo Electrónico</Text>
          <Text style={styles.infoValue}>{user?.email || 'admin@demo.com'}</Text>
        </View>
        <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
          <Text style={styles.infoLabel}>Empresa Asociada</Text>
          <Text style={styles.infoValue}>{user?.company_name || 'Mi Empresa'}</Text>
        </View>
      </View>

      {/* Logout Action */}
      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <LogOut color={theme.colors.rose} size={20} />
        <Text style={styles.logoutBtnText}>CERRAR SESIÓN</Text>
      </TouchableOpacity>
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
      marginBottom: theme.spacing.xl,
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
      backgroundColor: '#FFF',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    heroName: {
      fontSize: 20,
      fontWeight: '800',
      color: '#050A14',
    },
    heroRole: {
      fontSize: 13,
      fontWeight: '700',
      color: 'rgba(5, 10, 20, 0.75)',
      marginTop: 2,
    },
    sectionHeader: {
      fontSize: 11,
      fontWeight: '800',
      color: theme.colors.textMuted,
      letterSpacing: 1,
      marginBottom: theme.spacing.sm,
      marginTop: theme.spacing.md,
    },
    themeSelectorContainer: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.glassBorder,
      borderWidth: 1,
      borderRadius: theme.borderRadius.lg,
      padding: 4,
      gap: 6,
      marginBottom: theme.spacing.lg,
      ...theme.shadows.card,
    },
    themeOptionBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      borderRadius: theme.borderRadius.md,
    },
    themeOptionBtnActive: {
      backgroundColor: isDark ? 'rgba(0, 212, 255, 0.15)' : 'rgba(2, 132, 199, 0.12)',
      borderWidth: 1,
      borderColor: theme.colors.cyan,
    },
    themeOptionText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.textMuted,
    },
    themeOptionTextActive: {
      color: theme.colors.textPrimary,
      fontWeight: '800',
    },
    menuCard: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.glassBorder,
      borderWidth: 1,
      borderRadius: theme.borderRadius.lg,
      paddingHorizontal: theme.spacing.md,
      marginBottom: theme.spacing.lg,
      ...theme.shadows.card,
    },
    infoGroup: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.glassBorder,
      borderWidth: 1,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.lg,
      ...theme.shadows.card,
    },
    infoRow: {
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.glassBorder,
    },
    infoLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    infoValue: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      marginTop: 2,
    },
    logoutBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)',
      borderColor: 'rgba(239, 68, 68, 0.3)',
      borderWidth: 1,
      borderRadius: theme.borderRadius.md,
      paddingVertical: 14,
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.xl,
    },
    logoutBtnText: {
      color: theme.colors.rose,
      fontSize: 13,
      fontWeight: '800',
      letterSpacing: 1,
    },
  });
