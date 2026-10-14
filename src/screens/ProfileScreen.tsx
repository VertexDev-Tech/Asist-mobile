import React, { useMemo, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
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
  Scale,
  Zap,
  Clock,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  X,
  Bell,
  Trophy,
  Image as ImageIcon,
} from 'lucide-react-native';
import { getMyMonthlyBalance, MonthlyBalanceSummary } from '../services/balanceService';

export const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const { theme, isDark, setThemeMode } = useTheme();
  const navigation = useNavigation<any>();

  const [balance, setBalance] = useState<MonthlyBalanceSummary | null>(null);
  const [loadingBalance, setLoadingBalance] = useState<boolean>(true);
  const [balanceModalVisible, setBalanceModalVisible] = useState<boolean>(false);

  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const loadBalance = useCallback(async () => {
    try {
      setLoadingBalance(true);
      const data = await getMyMonthlyBalance();
      setBalance(data);
    } catch (err) {
      console.log('Error loading monthly balance:', err);
    } finally {
      setLoadingBalance(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadBalance();
    }, [loadBalance]),
  );

  const handleManualRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    loadBalance();
  };

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

  const balanceBadgeColor =
    balance?.status === 'POSITIVE'
      ? theme.colors.emerald
      : balance?.status === 'NEGATIVE'
      ? theme.colors.rose
      : theme.colors.cyan;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <MotiView
        from={{ opacity: 0, translateY: -15 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400 }}
      >
        <Text style={styles.title}>Mi Perfil</Text>
        <Text style={styles.subtitle}>Información personal y configuración de cuenta</Text>
      </MotiView>

      {/* User Hero Card with Compact Corner Balance Chip */}
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
          {/* Corner Balance Trigger */}
          <TouchableOpacity
            style={styles.heroBalanceCornerBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setBalanceModalVisible(true);
            }}
            activeOpacity={0.8}
          >
            <Scale color="#050A14" size={13} />
            <Text style={styles.heroBalanceCornerText}>
              {loadingBalance ? '...' : (balance?.netBalanceFormatted ?? '0h 00m')}
            </Text>
          </TouchableOpacity>

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
          title="Ranking de Puntualidad"
          subtitle="Tu posición y puntaje frente al equipo"
          icon={<Trophy color={theme.colors.amber} size={20} />}
          onPress={() => navigation.navigate('Ranking')}
        />
        <MenuRow
          title="Mis Fotos de Marcado"
          subtitle="Selfies de tus entradas y salidas por mes"
          icon={<ImageIcon color={theme.colors.cyan} size={20} />}
          onPress={() => navigation.navigate('MisFotos')}
        />
        <MenuRow
          title="Notificaciones"
          subtitle="Avisos de tu empresa pendientes de leer"
          icon={<Bell color={theme.colors.violet} size={20} />}
          onPress={() => navigation.navigate('Notificaciones')}
        />
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

      {/* MODAL DETALLE DE BALANCE HORARIO */}
      <Modal
        visible={balanceModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setBalanceModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Scale color={theme.colors.cyan} size={20} />
                <Text style={styles.modalTitle}>
                  BALANCE DE JORNADA ({balance?.monthName?.toUpperCase() ?? 'MES'})
                </Text>
              </View>
              <View style={styles.modalHeaderRight}>
                <TouchableOpacity
                  onPress={handleManualRefresh}
                  style={styles.modalRefreshBtn}
                  activeOpacity={0.7}
                >
                  {loadingBalance ? (
                    <ActivityIndicator size="small" color={theme.colors.cyan} />
                  ) : (
                    <RefreshCw color={theme.colors.cyan} size={15} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setBalanceModalVisible(false)}
                  style={styles.modalCloseBtn}
                  activeOpacity={0.7}
                >
                  <X color={theme.colors.textMuted} size={18} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Total Balance Hero in Modal */}
            <View style={styles.modalBalanceBox}>
              <Text style={[styles.modalBalanceNumber, { color: balanceBadgeColor }]}>
                {balance?.netBalanceFormatted ?? '0h 00m'}
              </Text>
              <View
                style={[
                  styles.modalBadge,
                  {
                    backgroundColor:
                      balance?.status === 'POSITIVE'
                        ? 'rgba(16, 185, 129, 0.15)'
                        : balance?.status === 'NEGATIVE'
                        ? 'rgba(239, 68, 68, 0.15)'
                        : 'rgba(0, 212, 255, 0.15)',
                    borderColor: balanceBadgeColor,
                  },
                ]}
              >
                {balance?.status === 'POSITIVE' ? (
                  <TrendingUp color={balanceBadgeColor} size={13} />
                ) : balance?.status === 'NEGATIVE' ? (
                  <TrendingDown color={balanceBadgeColor} size={13} />
                ) : (
                  <CheckCircle2 color={balanceBadgeColor} size={13} />
                )}
                <Text style={[styles.modalBadgeText, { color: balanceBadgeColor }]}>
                  {balance?.status === 'POSITIVE'
                    ? 'Saldo a Favor'
                    : balance?.status === 'NEGATIVE'
                    ? 'Tiempo por Recuperar'
                    : 'Al Día'}
                </Text>
              </View>
            </View>

            <Text style={styles.modalSubtext}>
              Balance neto = Horas extra aprobadas menos minutos de tardanza en turnos habituales.
            </Text>

            {/* Breakdown Row */}
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownCol}>
                <View style={styles.breakdownLabelRow}>
                  <Zap color={theme.colors.orange} size={13} />
                  <Text style={styles.breakdownLabel}>EXTRAS (+)</Text>
                </View>
                <Text style={[styles.breakdownValue, { color: theme.colors.orange }]}>
                  {balance?.approvedExtraFormatted ?? '0h 00m'}
                </Text>
                <Text style={styles.breakdownNote}>
                  {balance?.approvedShiftsCount ?? 0} {balance?.approvedShiftsCount === 1 ? 'turno' : 'turnos'}
                </Text>
              </View>

              <View style={styles.breakdownDivider} />

              <View style={styles.breakdownCol}>
                <View style={styles.breakdownLabelRow}>
                  <Clock color={theme.colors.rose} size={13} />
                  <Text style={styles.breakdownLabel}>TARDANZAS (-)</Text>
                </View>
                <Text style={[styles.breakdownValue, { color: theme.colors.rose }]}>
                  {balance?.tardinessFormatted ?? '0h 00m'}
                </Text>
                <Text style={styles.breakdownNote}>
                  {balance?.tardinessCount ?? 0} {balance?.tardinessCount === 1 ? 'registro' : 'registros'}
                </Text>
              </View>

              <View style={styles.breakdownDivider} />

              <View style={styles.breakdownCol}>
                <View style={styles.breakdownLabelRow}>
                  <CheckCircle2 color={theme.colors.emerald} size={13} />
                  <Text style={styles.breakdownLabel}>PUNTUAL</Text>
                </View>
                <Text style={[styles.breakdownValue, { color: theme.colors.emerald }]}>
                  {balance?.onTimeCount ?? 0}
                </Text>
                <Text style={styles.breakdownNote}>a tiempo</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalDoneBtn}
              onPress={() => setBalanceModalVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalDoneBtnText}>ENTENDIDO</Text>
            </TouchableOpacity>
          </View>
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
      position: 'relative',
    },
    heroBalanceCornerBtn: {
      position: 'absolute',
      top: 14,
      right: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 3,
      elevation: 3,
    },
    heroBalanceCornerText: {
      fontSize: 11,
      fontWeight: '900',
      color: '#050A14',
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

    // Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.lg,
    },
    modalCard: {
      width: '100%',
      maxWidth: 380,
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
      marginBottom: theme.spacing.md,
    },
    modalHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flex: 1,
    },
    modalHeaderRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    modalTitle: {
      fontSize: 12,
      fontWeight: '800',
      color: theme.colors.cyan,
      letterSpacing: 0.5,
    },
    modalRefreshBtn: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: isDark ? 'rgba(0, 212, 255, 0.1)' : 'rgba(2, 132, 199, 0.08)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalCloseBtn: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalBalanceBox: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginVertical: theme.spacing.sm,
    },
    modalBalanceNumber: {
      fontSize: 28,
      fontWeight: '900',
      letterSpacing: -0.5,
    },
    modalBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 20,
      borderWidth: 1,
    },
    modalBadgeText: {
      fontSize: 11,
      fontWeight: '800',
    },
    modalSubtext: {
      fontSize: 12,
      color: theme.colors.textMuted,
      marginBottom: theme.spacing.lg,
      lineHeight: 16,
    },
    breakdownRow: {
      flexDirection: 'row',
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)',
      borderRadius: theme.borderRadius.lg,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.sm,
      justifyContent: 'space-around',
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
    },
    breakdownCol: {
      flex: 1,
      alignItems: 'center',
    },
    breakdownLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginBottom: 3,
    },
    breakdownLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: theme.colors.textMuted,
      letterSpacing: 0.5,
    },
    breakdownValue: {
      fontSize: 15,
      fontWeight: '800',
      marginBottom: 2,
    },
    breakdownNote: {
      fontSize: 10,
      color: theme.colors.textMuted,
      fontWeight: '600',
    },
    breakdownDivider: {
      width: 1,
      height: 32,
      backgroundColor: theme.colors.glassBorder,
    },
    modalDoneBtn: {
      backgroundColor: theme.colors.cyan,
      borderRadius: theme.borderRadius.md,
      paddingVertical: 12,
      alignItems: 'center',
    },
    modalDoneBtnText: {
      color: '#050A14',
      fontSize: 13,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
  });


