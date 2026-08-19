import React, { useEffect, useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { MotiView } from 'moti';
import { Theme } from '../../theme/theme';
import { useTheme } from '../../context/ThemeContext';
import { useAlert } from '../../context/AlertContext';
import { companiesApi, employeesApi } from '../../services/api';
import { CompanyInfo } from '../../types';
import { MenuRow } from '../../components/MenuRow';
import {
  Building2,
  Hash,
  Briefcase,
  Phone,
  Mail,
  CreditCard,
  CalendarClock,
  Sparkles,
  HelpCircle,
} from 'lucide-react-native';

export const AdminCompanyScreen = () => {
  const { theme, isDark } = useTheme();
  const { showConfirm } = useAlert();
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [employeeCount, setEmployeeCount] = useState<number>(0);
  const [forbidden, setForbidden] = useState(false);

  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const [compData, empList] = await Promise.all([
        companiesApi.getMe().catch((e) => {
          if (e.response?.status === 403) setForbidden(true);
          return null;
        }),
        employeesApi.list().catch(() => []),
      ]);
      setCompany(compData);
      setEmployeeCount(empList ? empList.length : 0);
    } catch (e: any) {
      console.log('Error loading company:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleContactSupport = () => {
    showConfirm(
      'Soporte UBIX',
      '¿Deseas enviar un correo a soporte@ubix.pe para solicitar un cambio de plan o ampliación?',
      () => Linking.openURL('mailto:soporte@ubix.pe?subject=Solicitud%20de%20Plan%20UBIX'),
      'Escribir a Soporte',
      false,
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.cyan} />
      </View>
    );
  }

  if (forbidden || !company) {
    return (
      <View style={styles.centerContainer}>
        <Building2 color={theme.colors.textMuted} size={40} />
        <Text style={styles.emptyText}>
          {forbidden
            ? 'Esta sección es exclusiva para administradores de empresa.'
            : 'No se pudo cargar la información de la empresa.'}
        </Text>
      </View>
    );
  }

  const sub = company.subscription_status;
  const planName = sub?.plan || company.plan || 'Pro';
  const isUnlimited = planName.toUpperCase() === 'PRO' || planName.toUpperCase() === 'ENTERPRISE';
  const maxLimit = isUnlimited ? 9999 : 10;
  const usedPct = isUnlimited
    ? Math.min(100, Math.max(15, (employeeCount / 100) * 100))
    : Math.min(100, (employeeCount / 10) * 100);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Mi Suscripción</Text>
      <Text style={styles.subtitle}>Estado y detalles de tu plan actual</Text>

      {/* Hero Subscription Card (Identical to Web PWA) */}
      <MotiView
        from={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'timing', duration: 400 }}
        style={styles.subHeroCard}
      >
        {/* Plan Activo Pill */}
        <View style={styles.planActivePill}>
          <Text style={styles.planActiveText}>Plan Activo</Text>
        </View>

        {/* Plan Title */}
        <Text style={styles.subPlanTitle}>{planName}</Text>

        {/* Status Grid */}
        <View style={styles.subMetaGrid}>
          <View style={styles.subMetaCol}>
            <Text style={styles.subMetaLabel}>ESTADO</Text>
            <Text style={styles.subMetaValue}>
              {company.status === 'ACTIVE' || !company.status ? 'Activa' : company.status}
            </Text>
          </View>

          <View style={styles.subMetaCol}>
            <Text style={styles.subMetaLabel}>LÍMITE DE COLABORADORES</Text>
            <Text style={styles.subMetaValue}>
              {isUnlimited ? 'Ilimitados' : `${maxLimit} colaboradores`}
            </Text>
          </View>
        </View>

        {/* Progress Bar: Colaboradores Utilizados */}
        <View style={styles.progressSection}>
          <View style={styles.progressLabelRow}>
            <Text style={styles.progressTitle}>Colaboradores utilizados</Text>
            <Text style={styles.progressCount}>
              {employeeCount} de {isUnlimited ? '∞' : maxLimit}
            </Text>
          </View>

          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${usedPct}%` }]} />
          </View>
        </View>
      </MotiView>

      {/* Support Card */}
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400, delay: 100 }}
        style={styles.needMoreCard}
      >
        <Text style={styles.needMoreTitle}>¿Necesitas más?</Text>
        <Text style={styles.needMoreSubtitle}>
          Contacta a nuestro equipo para renovar, cambiar de plan o agregar más colaboradores.
        </Text>

        <TouchableOpacity
          style={styles.contactSupportBtn}
          onPress={handleContactSupport}
          activeOpacity={0.8}
        >
          <Text style={styles.contactSupportBtnText}>Contactar al Soporte</Text>
        </TouchableOpacity>
      </MotiView>

      {/* Company Corporate Details */}
      <Text style={styles.sectionLabel}>DATOS DE LA EMPRESA</Text>
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400, delay: 150 }}
        style={styles.group}
      >
        <MenuRow icon={<Building2 color={theme.colors.cyan} size={20} />} label="Nombre" value={company.name} delay={50} />
        <MenuRow icon={<Hash color={theme.colors.violet} size={20} />} label="RUC" value={company.ruc || 'No registrado'} delay={100} />
        <MenuRow icon={<Briefcase color={theme.colors.emerald} size={20} />} label="Sector" value={company.sector || 'General'} delay={150} />
        <MenuRow icon={<Phone color={theme.colors.amber} size={20} />} label="Teléfono" value={company.phone || 'No registrado'} delay={200} />
        <MenuRow icon={<Mail color={theme.colors.cyan} size={20} />} label="Correo admin" value={company.email_admin} delay={250} last />
      </MotiView>
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
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      padding: theme.spacing.xl,
      gap: theme.spacing.md,
    },
    title: {
      fontSize: 26,
      fontWeight: '900',
      color: theme.colors.textPrimary,
    },
    subtitle: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.lg,
      marginTop: 2,
    },

    // Sub Hero Card (Web Parity)
    subHeroCard: {
      backgroundColor: isDark ? '#0C1A30' : '#0B192C',
      borderColor: 'rgba(0, 212, 255, 0.3)',
      borderWidth: 1.5,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.xl,
      marginBottom: theme.spacing.lg,
      ...theme.shadows.glowPrimary,
    },
    planActivePill: {
      alignSelf: 'flex-start',
      backgroundColor: '#00D4FF',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: theme.borderRadius.full,
      marginBottom: 12,
    },
    planActiveText: {
      color: '#050A14',
      fontSize: 11,
      fontWeight: '900',
      letterSpacing: 0.5,
    },
    subPlanTitle: {
      fontSize: 28,
      fontWeight: '900',
      color: '#FFFFFF',
      marginBottom: 16,
    },
    subMetaGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 18,
    },
    subMetaCol: {
      flex: 1,
    },
    subMetaLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: 'rgba(255, 255, 255, 0.6)',
      letterSpacing: 0.8,
    },
    subMetaValue: {
      fontSize: 14,
      fontWeight: '800',
      color: '#FFFFFF',
      marginTop: 3,
    },
    progressSection: {
      borderTopWidth: 1,
      borderTopColor: 'rgba(255, 255, 255, 0.15)',
      paddingTop: 14,
    },
    progressLabelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    progressTitle: {
      fontSize: 11,
      fontWeight: '700',
      color: 'rgba(255, 255, 255, 0.8)',
    },
    progressCount: {
      fontSize: 12,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    progressBarTrack: {
      height: 6,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: '#00D4FF',
      borderRadius: 3,
    },

    // Need More Card
    needMoreCard: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.glassBorder,
      borderWidth: 1,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.xl,
      ...theme.shadows.card,
    },
    needMoreTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.colors.textPrimary,
    },
    needMoreSubtitle: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 4,
      lineHeight: 18,
    },
    contactSupportBtn: {
      alignSelf: 'flex-start',
      backgroundColor: theme.colors.cyan,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: theme.borderRadius.md,
      marginTop: 12,
    },
    contactSupportBtnText: {
      color: '#050A14',
      fontSize: 12,
      fontWeight: '800',
    },

    // Corporate Group
    sectionLabel: {
      fontSize: 11,
      fontWeight: '800',
      color: theme.colors.textMuted,
      letterSpacing: 1,
      marginBottom: theme.spacing.sm,
    },
    group: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.glassBorder,
      borderWidth: 1,
      borderRadius: theme.borderRadius.xl,
      paddingHorizontal: theme.spacing.md,
      marginBottom: theme.spacing.lg,
      ...theme.shadows.card,
    },
    emptyText: {
      color: theme.colors.textMuted,
      fontSize: 14,
      textAlign: 'center',
    },
  });
