import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator } from 'react-native';
import { MotiView } from 'moti';
import { theme } from '../../theme/theme';
import { companiesApi } from '../../services/api';
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
} from 'lucide-react-native';

export const AdminCompanyScreen = () => {
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const data = await companiesApi.getMe();
      setCompany(data);
    } catch (e: any) {
      if (e.response?.status === 403) setForbidden(true);
      console.log('Error loading company:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Mi Empresa</Text>
      <Text style={styles.subtitle}>Datos corporativos y estado de suscripción</Text>

      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400 }}
        style={styles.group}
      >
        <MenuRow icon={<Building2 color={theme.colors.cyan} size={20} />} label="Nombre" value={company.name} delay={50} />
        <MenuRow icon={<Hash color={theme.colors.violet} size={20} />} label="RUC" value={company.ruc} delay={100} />
        <MenuRow icon={<Briefcase color={theme.colors.emerald} size={20} />} label="Sector" value={company.sector} delay={150} />
        <MenuRow icon={<Phone color={theme.colors.amber} size={20} />} label="Teléfono" value={company.phone} delay={200} />
        <MenuRow icon={<Mail color={theme.colors.cyan} size={20} />} label="Correo admin" value={company.email_admin} delay={250} last />
      </MotiView>

      <Text style={styles.sectionLabel}>SUSCRIPCIÓN</Text>
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400, delay: 100 }}
        style={styles.group}
      >
        <MenuRow
          icon={<CreditCard color={theme.colors.emerald} size={20} />}
          label="Plan"
          value={`${sub?.plan || company.plan} · ${company.status}`}
          delay={300}
        />
        <MenuRow
          icon={<CalendarClock color={theme.colors.amber} size={20} />}
          label="Vence en"
          value={
            sub
              ? `${sub.days_remaining ?? '—'} días restantes${sub.is_expired ? ' (vencido)' : ''}`
              : 'No disponible'
          }
          delay={350}
          last
        />
      </MotiView>
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
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.textMuted,
    letterSpacing: 1,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  group: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.glassBorder,
    borderWidth: 1,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
});
