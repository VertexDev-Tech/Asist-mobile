import React, { useEffect, useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Alert,
  ScrollView,
} from 'react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Theme } from '../../theme/theme';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';
import { superAdminApi } from '../../services/api';
import { SuperAdminCompanyItem, SuperAdminStats } from '../../types';
import {
  Building2,
  Search,
  Crown,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Mail,
  ShieldAlert,
  Send,
  X,
  CreditCard,
  UserCheck,
  UserX,
  Sparkles,
  ChevronRight,
  ExternalLink,
} from 'lucide-react-native';

export const SuperAdminCompaniesScreen = () => {
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const { showAlert, showSuccess, showError, showConfirm } = useAlert();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'TRIAL' | 'SUSPENDED'>('ALL');

  const [stats, setStats] = useState<SuperAdminStats | null>(null);
  const [companies, setCompanies] = useState<SuperAdminCompanyItem[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<SuperAdminCompanyItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  useEffect(() => {
    loadSuperAdminData();
  }, []);

  const loadSuperAdminData = async () => {
    try {
      setLoading(true);
      const [statsData, companiesData] = await Promise.all([
        superAdminApi.getStats().catch(() => null),
        superAdminApi.getCompanies().catch(() => []),
      ]);
      setStats(statsData);
      setCompanies(companiesData || []);
    } catch (e) {
      console.log('Error loading superadmin data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleOpenDetail = (company: SuperAdminCompanyItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCompany(company);
    setModalVisible(true);
  };

  const handleToggleStatus = async (company: SuperAdminCompanyItem) => {
    const isSuspended = company.status === 'SUSPENDED';
    const nextAction = isSuspended ? 'reactivateCompany' : 'suspendCompany';
    const actionName = isSuspended ? 'Reactivar' : 'Suspender';

    showConfirm(
      `${actionName} Empresa`,
      `¿Estás seguro de que deseas ${actionName.toLowerCase()} la cuenta de "${company.name}"?`,
      async () => {
        try {
          setIsProcessing(true);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          await superAdminApi[nextAction](company.id);
          showSuccess('Empresa Actualizada', `La empresa "${company.name}" ha sido ${isSuspended ? 'reactivada' : 'suspendida'}.`);
          setModalVisible(false);
          loadSuperAdminData();
        } catch (e) {
          showError('Error', 'No se pudo actualizar el estado de la empresa.');
        } finally {
          setIsProcessing(false);
        }
      },
      actionName,
      !isSuspended,
    );
  };

  const handleChangePlan = (company: SuperAdminCompanyItem, newPlan: string) => {
    showConfirm(
      'Cambiar Plan',
      `¿Deseas asignar el plan "${newPlan}" a ${company.name} por 30 días adicionales?`,
      async () => {
        try {
          setIsProcessing(true);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          await superAdminApi.changePlan(company.id, newPlan);
          showSuccess('¡Plan Asignado!', `La empresa "${company.name}" ahora cuenta con el plan ${newPlan}.`);
          setModalVisible(false);
          loadSuperAdminData();
        } catch (e) {
          showError('Error', 'No se pudo actualizar el plan de la empresa.');
        } finally {
          setIsProcessing(false);
        }
      },
      'Confirmar Plan',
      false,
    );
  };

  const handleSendBrevoEmail = async (company: SuperAdminCompanyItem, type: 'expiring' | 'expired' | 'payment') => {
    try {
      setIsProcessing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (type === 'expiring') await superAdminApi.notifyExpiring(company.id);
      else if (type === 'expired') await superAdminApi.notifyExpired(company.id);
      else await superAdminApi.notifyPayment(company.id);

      showSuccess('Correo Enviado', `Notificación despachada con éxito a ${company.email_admin}`);
    } catch (e: any) {
      showError('Error', 'No se pudo enviar la notificación por correo.');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      const matchSearch =
        (c.name && c.name.toLowerCase().includes(search.toLowerCase())) ||
        (c.ruc && c.ruc.includes(search)) ||
        (c.email_admin && c.email_admin.toLowerCase().includes(search.toLowerCase()));

      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && c.status === 'ACTIVE') ||
        (statusFilter === 'TRIAL' && c.status === 'TRIAL') ||
        (statusFilter === 'SUSPENDED' && c.status === 'SUSPENDED');

      return matchSearch && matchStatus;
    });
  }, [companies, search, statusFilter]);

  const activeCount = useMemo(
    () => companies.filter((c) => c.status === 'ACTIVE').length,
    [companies],
  );
  const trialCount = useMemo(
    () => companies.filter((c) => c.status === 'TRIAL').length,
    [companies],
  );
  const suspendedCount = useMemo(
    () => companies.filter((c) => c.status === 'SUSPENDED').length,
    [companies],
  );

  const renderHeader = () => (
    <View>
      {/* Super Admin Title Banner */}
      <MotiView
        from={{ opacity: 0, translateY: -10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400 }}
        style={styles.headerBanner}
      >
        <View>
          <Text style={styles.title}>Super Admin</Text>
          <Text style={styles.subtitle}>Gestión global de empresas y licencias UBIX</Text>
        </View>
        <View style={styles.superBadge}>
          <Crown color="#F59E0B" size={14} />
          <Text style={styles.superBadgeText}>SUPER_ADMIN</Text>
        </View>
      </MotiView>

      {/* Global Platform KPIs Grid */}
      <View style={styles.kpiGrid}>
        <View style={styles.kpiCard}>
          <Building2 color={theme.colors.cyan} size={20} />
          <Text style={[styles.kpiValue, { color: theme.colors.cyan }]}>{companies.length}</Text>
          <Text style={styles.kpiLabel}>EMPRESAS</Text>
        </View>

        <View style={styles.kpiCard}>
          <CheckCircle2 color={theme.colors.emerald} size={20} />
          <Text style={[styles.kpiValue, { color: theme.colors.emerald }]}>{activeCount}</Text>
          <Text style={styles.kpiLabel}>ACTIVAS</Text>
        </View>

        <View style={styles.kpiCard}>
          <Clock color={theme.colors.amber} size={20} />
          <Text style={[styles.kpiValue, { color: theme.colors.amber }]}>{trialCount}</Text>
          <Text style={styles.kpiLabel}>EN PRUEBA</Text>
        </View>

        <View style={styles.kpiCard}>
          <ShieldAlert color={theme.colors.rose} size={20} />
          <Text style={[styles.kpiValue, { color: theme.colors.rose }]}>{suspendedCount}</Text>
          <Text style={styles.kpiLabel}>SUSPENDIDAS</Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Search color={theme.colors.textMuted} size={18} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por empresa, RUC o email..."
          placeholderTextColor={theme.colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filter Chips */}
      <View style={styles.filterChipsRow}>
        {(['ALL', 'ACTIVE', 'TRIAL', 'SUSPENDED'] as const).map((st) => {
          const isSelected = statusFilter === st;
          const labels: Record<string, string> = {
            ALL: 'Todas',
            ACTIVE: 'Activas',
            TRIAL: 'En Trial',
            SUSPENDED: 'Suspendidas',
          };

          return (
            <TouchableOpacity
              key={st}
              style={[styles.filterChip, isSelected && styles.filterChipActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setStatusFilter(st);
              }}
            >
              <Text
                style={[
                  styles.filterChipText,
                  isSelected && styles.filterChipTextActive,
                ]}
              >
                {labels[st]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderCompanyItem = ({ item, index }: { item: SuperAdminCompanyItem; index: number }) => {
    const isSuspended = item.status === 'SUSPENDED';
    const isTrial = item.status === 'TRIAL';
    const statusColor = isSuspended
      ? theme.colors.rose
      : isTrial
      ? theme.colors.amber
      : theme.colors.emerald;

    const statusBg = isSuspended
      ? 'rgba(239, 68, 68, 0.12)'
      : isTrial
      ? 'rgba(245, 158, 11, 0.12)'
      : 'rgba(16, 185, 129, 0.12)';

    return (
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 350, delay: index * 30 }}
      >
        <TouchableOpacity
          style={styles.companyCard}
          onPress={() => handleOpenDetail(item)}
          activeOpacity={0.75}
        >
          <View style={styles.companyCardHeader}>
            <View style={styles.companyAvatar}>
              <Text style={styles.companyAvatarText}>
                {item.name ? item.name.charAt(0).toUpperCase() : 'E'}
              </Text>
            </View>

            <View style={styles.companyMainInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.companyName}>{item.name}</Text>
                <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
                  <Text style={[styles.statusPillText, { color: statusColor }]}>
                    {item.status}
                  </Text>
                </View>
              </View>
              <Text style={styles.companyMeta}>
                RUC: {item.ruc || 'Sin RUC'} • {item.sector || 'General'}
              </Text>
              <Text style={styles.companyEmail}>{item.email_admin}</Text>
            </View>

            <ChevronRight color={theme.colors.textMuted} size={20} />
          </View>

          {/* Quick Metrics Footer */}
          <View style={styles.companyFooter}>
            <View style={styles.footerMetric}>
              <Text style={styles.footerMetricLabel}>PLAN:</Text>
              <Text style={[styles.footerMetricValue, { color: theme.colors.cyan }]}>
                {item.plan || 'TRIAL'}
              </Text>
            </View>
            <View style={styles.footerMetric}>
              <Text style={styles.footerMetricLabel}>COLABORADORES:</Text>
              <Text style={styles.footerMetricValue}>
                {item._count?.employees ?? 0}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </MotiView>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.cyan} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredCompanies}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        renderItem={renderCompanyItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadSuperAdminData();
            }}
            tintColor={theme.colors.cyan}
          />
        }
      />

      {/* Company Management Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{selectedCompany?.name}</Text>
                <Text style={styles.modalSubtitle}>Administración de Licencia & Acceso</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color={theme.colors.textMuted} size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Status Toggle Action */}
              <TouchableOpacity
                style={[
                  styles.actionModalBtn,
                  {
                    borderColor:
                      selectedCompany?.status === 'SUSPENDED'
                        ? theme.colors.emerald
                        : theme.colors.rose,
                  },
                ]}
                onPress={() => selectedCompany && handleToggleStatus(selectedCompany)}
                disabled={isProcessing}
              >
                {selectedCompany?.status === 'SUSPENDED' ? (
                  <>
                    <UserCheck color={theme.colors.emerald} size={18} />
                    <Text style={[styles.actionModalBtnText, { color: theme.colors.emerald }]}>
                      Reactivar Empresa
                    </Text>
                  </>
                ) : (
                  <>
                    <UserX color={theme.colors.rose} size={18} />
                    <Text style={[styles.actionModalBtnText, { color: theme.colors.rose }]}>
                      Suspender Empresa
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Plan Switch Section */}
              <Text style={styles.modalSectionLabel}>CAMBIAR PLAN / RENOVAR</Text>
              <View style={styles.planButtonsRow}>
                {['BASICO', 'PRO', 'ENTERPRISE'].map((pl) => (
                  <TouchableOpacity
                    key={pl}
                    style={[
                      styles.planSelectBtn,
                      selectedCompany?.plan === pl && styles.planSelectBtnActive,
                    ]}
                    onPress={() => selectedCompany && handleChangePlan(selectedCompany, pl)}
                  >
                    <Text
                      style={[
                        styles.planSelectBtnText,
                        selectedCompany?.plan === pl && styles.planSelectBtnTextActive,
                      ]}
                    >
                      {pl}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Brevo Email Notifications Section */}
              <Text style={styles.modalSectionLabel}>ENVIAR CORREOS DE COBRANZA (BREVO)</Text>
              <TouchableOpacity
                style={styles.emailBtn}
                onPress={() => selectedCompany && handleSendBrevoEmail(selectedCompany, 'expiring')}
                disabled={isProcessing}
              >
                <Mail color={theme.colors.amber} size={18} />
                <Text style={styles.emailBtnText}>Aviso de Vencimiento Próximo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.emailBtn}
                onPress={() => selectedCompany && handleSendBrevoEmail(selectedCompany, 'payment')}
                disabled={isProcessing}
              >
                <CreditCard color={theme.colors.emerald} size={18} />
                <Text style={styles.emailBtnText}>Confirmación de Pago Recibido</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const createStyles = (theme: Theme, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    listContent: {
      padding: theme.spacing.lg,
      paddingTop: theme.spacing.xl,
      paddingBottom: theme.spacing.xxl,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    headerBanner: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
    },
    title: {
      fontSize: 26,
      fontWeight: '900',
      color: theme.colors.textPrimary,
    },
    subtitle: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    superBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.12)',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: theme.borderRadius.full,
      borderWidth: 1,
      borderColor: 'rgba(245, 158, 11, 0.3)',
    },
    superBadgeText: {
      color: '#F59E0B',
      fontSize: 11,
      fontWeight: '900',
      letterSpacing: 0.5,
    },
    kpiGrid: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.lg,
    },
    kpiCard: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.glassBorder,
      borderWidth: 1,
      borderRadius: theme.borderRadius.lg,
      paddingVertical: 14,
      paddingHorizontal: 6,
      alignItems: 'center',
      ...theme.shadows.card,
    },
    kpiValue: {
      fontSize: 20,
      fontWeight: '900',
      marginTop: 4,
    },
    kpiLabel: {
      fontSize: 9,
      fontWeight: '800',
      color: theme.colors.textMuted,
      marginTop: 2,
      letterSpacing: 0.5,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.glassBorder,
      borderWidth: 1,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: theme.spacing.md,
      height: 48,
      marginBottom: theme.spacing.md,
      ...theme.shadows.card,
    },
    searchIcon: {
      marginRight: theme.spacing.sm,
    },
    searchInput: {
      flex: 1,
      color: theme.colors.textPrimary,
      fontSize: 14,
    },
    filterChipsRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: theme.spacing.lg,
    },
    filterChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.glassBorder,
      borderWidth: 1,
    },
    filterChipActive: {
      backgroundColor: isDark ? 'rgba(0, 212, 255, 0.15)' : 'rgba(2, 132, 199, 0.12)',
      borderColor: theme.colors.cyan,
    },
    filterChipText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.textMuted,
    },
    filterChipTextActive: {
      color: theme.colors.cyan,
      fontWeight: '800',
    },
    companyCard: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.glassBorder,
      borderWidth: 1,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      ...theme.shadows.card,
    },
    companyCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    companyAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.cyan,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing.md,
    },
    companyAvatarText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '800',
    },
    companyMainInfo: {
      flex: 1,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    companyName: {
      fontSize: 15,
      fontWeight: '800',
      color: theme.colors.textPrimary,
    },
    statusPill: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: theme.borderRadius.full,
    },
    statusPillText: {
      fontSize: 10,
      fontWeight: '800',
    },
    companyMeta: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    companyEmail: {
      fontSize: 11,
      color: theme.colors.textMuted,
      marginTop: 1,
    },
    companyFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      borderTopWidth: 1,
      borderTopColor: theme.colors.glassBorder,
      paddingTop: 10,
      marginTop: 10,
    },
    footerMetric: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    footerMetricLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.colors.textMuted,
    },
    footerMetricValue: {
      fontSize: 11,
      fontWeight: '800',
      color: theme.colors.textPrimary,
    },

    // Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.75)',
      justifyContent: 'center',
      padding: theme.spacing.lg,
    },
    modalCard: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.glassBorder,
      borderWidth: 1,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.xl,
      maxHeight: '80%',
      ...theme.shadows.card,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.glassBorder,
      paddingBottom: theme.spacing.md,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '900',
      color: theme.colors.textPrimary,
    },
    modalSubtitle: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    modalBody: {
      marginTop: 4,
    },
    modalSectionLabel: {
      fontSize: 11,
      fontWeight: '800',
      color: theme.colors.textMuted,
      letterSpacing: 0.8,
      marginTop: theme.spacing.lg,
      marginBottom: theme.spacing.sm,
    },
    actionModalBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
    },
    actionModalBtnText: {
      fontSize: 13,
      fontWeight: '800',
    },
    planButtonsRow: {
      flexDirection: 'row',
      gap: 8,
    },
    planSelectBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: theme.borderRadius.md,
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'transparent',
    },
    planSelectBtnActive: {
      borderColor: theme.colors.cyan,
      backgroundColor: isDark ? 'rgba(0,212,255,0.12)' : 'rgba(2,132,199,0.12)',
    },
    planSelectBtnText: {
      fontSize: 11,
      fontWeight: '800',
      color: theme.colors.textSecondary,
    },
    planSelectBtnTextActive: {
      color: theme.colors.cyan,
      fontWeight: '900',
    },
    emailBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: theme.borderRadius.md,
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC',
      borderWidth: 1,
      borderColor: theme.colors.glassBorder,
      marginBottom: 8,
    },
    emailBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
  });
