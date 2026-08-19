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
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { Theme } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { MenuRow } from '../components/MenuRow';
import {
  User,
  ShieldCheck,
  FileText,
  HelpCircle,
  LogOut,
  Sparkles,
  Sun,
  Moon,
  CreditCard,
  Building,
} from 'lucide-react-native';

export const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const { theme, isDark, setThemeMode } = useTheme();
  const navigation = useNavigation<any>();

  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas salir de tu cuenta?',
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
      <MotiView
        from={{ opacity: 0, translateY: -15 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400 }}
      >
        <Text style={styles.title}>Mi Perfil</Text>
        <Text style={styles.subtitle}>Información personal y configuración de UBIX Control</Text>
      </MotiView>

      {/* User Hero Card */}
      <MotiView
        from={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'timing', duration: 450, delay: 100 }}
        style={styles.cardHero}
      >
        <LinearGradient
          colors={theme.colors.gradients.cyan}
          style={styles.heroGradient}
        >
          <View style={styles.heroAvatar}>
            <User color="#050A14" size={32} />
          </View>
          <Text style={styles.heroName}>{user?.full_name || 'Empleado'}</Text>
          <Text style={styles.heroRole}>Empleado Autorizado UBIX</Text>
        </LinearGradient>
      </MotiView>

      {/* Theme Appearance Selector Section */}
      <Text style={styles.sectionHeader}>APARIENCIA & MODO DE COLOR</Text>
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400, delay: 150 }}
        style={styles.themeSelectorContainer}
      >
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
      </MotiView>

      {/* Account Info Details */}
      <Text style={styles.sectionHeader}>DATOS DE IDENTIFICACIÓN</Text>
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400, delay: 200 }}
        style={styles.group}
      >
        <MenuRow
          title="Documento DNI"
          subtitle={user?.dni || 'No disponible'}
          icon={<CreditCard color={theme.colors.cyan} size={20} />}
        />
        <MenuRow
          title="Empresa / Organización"
          subtitle={user?.company_name || 'Sede Principal UBIX'}
          icon={<Building color={theme.colors.emerald} size={20} />}
        />
        <MenuRow
          title="Estado de Dispositivo"
          subtitle="Celular Personal Vinculado y Autorizado"
          icon={<ShieldCheck color={theme.colors.emerald} size={20} />}
          last
        />
      </MotiView>

      {/* Quick Actions & Help */}
      <Text style={styles.sectionHeader}>GESTIÓN & AYUDA</Text>
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400, delay: 250 }}
        style={styles.group}
      >
        <MenuRow
          title="Libro de Reclamaciones"
          subtitle="Envía solicitudes de justificación o consultas a RRHH"
          icon={<FileText color={theme.colors.amber} size={20} />}
          onPress={() => navigation.navigate('Reclamaciones')}
        />
        <MenuRow
          title="Centro de Ayuda UBIX"
          subtitle="Preguntas frecuentes y soporte de marcaciones"
          icon={<HelpCircle color={theme.colors.cyan} size={20} />}
          onPress={() => Alert.alert('Soporte UBIX', 'Escríbenos a soporte@ubix.pe para asistencia técnica.')}
          last
        />
      </MotiView>

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
    group: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.glassBorder,
      borderWidth: 1,
      borderRadius: theme.borderRadius.lg,
      paddingHorizontal: theme.spacing.md,
      marginBottom: theme.spacing.lg,
      ...theme.shadows.card,
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
