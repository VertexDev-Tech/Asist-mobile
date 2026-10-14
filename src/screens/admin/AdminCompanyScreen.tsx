import React, { useEffect, useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Linking,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { MotiView } from 'moti';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Theme } from '../../theme/theme';
import { useTheme } from '../../context/ThemeContext';
import { useAlert } from '../../context/AlertContext';
import { companiesApi, employeesApi, assetUrl } from '../../services/api';
import { CompanyInfo, SubscriptionInfo } from '../../types';
import { MenuRow } from '../../components/MenuRow';
import {
  Building2,
  Hash,
  Briefcase,
  Phone,
  Mail,
  MapPin,
  Palette,
  CreditCard,
  Crosshair,
  Save,
  CheckCircle2,
  Sparkles,
  ImagePlus,
} from 'lucide-react-native';

type CompanyTab = 'subscription' | 'geofence' | 'branding';

export const AdminCompanyScreen = () => {
  const { theme, isDark } = useTheme();
  const { showConfirm, showSuccess, showError } = useAlert();

  const [activeTab, setActiveTab] = useState<CompanyTab>('subscription');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [employeeCount, setEmployeeCount] = useState<number>(0);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [forbidden, setForbidden] = useState(false);

  // ── Geofence State ────────────────────────────────────────────────────────
  const [latitude, setLatitude] = useState('-7.16233');
  const [longitude, setLongitude] = useState('-78.51477');
  const [radiusM, setRadiusM] = useState('150');
  const [gettingLocation, setGettingLocation] = useState(false);

  // ── Branding State ────────────────────────────────────────────────────────
  const [primaryColor, setPrimaryColor] = useState('#00D4FF');
  const [secondaryColor, setSecondaryColor] = useState('#050A14');

  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  useEffect(() => {
    loadCompanyData();
  }, []);

  const loadCompanyData = async () => {
    try {
      setLoading(true);
      const [compData, empList, subData] = await Promise.all([
        companiesApi.getMe().catch((e) => {
          if (e.response?.status === 403) setForbidden(true);
          return null;
        }),
        employeesApi.list().catch(() => []),
        companiesApi.getSubscription().catch(() => null),
      ]);
      setSubscription(subData);

      if (compData) {
        setCompany(compData);
        if (compData.latitude) setLatitude(String(compData.latitude));
        if (compData.longitude) setLongitude(String(compData.longitude));
        if (compData.geofence_radius_m) setRadiusM(String(compData.geofence_radius_m));
        if (compData.primary_color || compData.brand_color) {
          setPrimaryColor(compData.primary_color || compData.brand_color || '#00D4FF');
        }
        if (compData.secondary_color) setSecondaryColor(compData.secondary_color);
      }
      setEmployeeCount(empList ? empList.length : 0);
    } catch (e: any) {
      console.log('Error loading company:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleUseMyLocation = async () => {
    try {
      setGettingLocation(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showError('Permiso denegado', 'Se requiere acceso al GPS para capturar tu posición.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLatitude(loc.coords.latitude.toFixed(6));
      setLongitude(loc.coords.longitude.toFixed(6));
      showSuccess('Ubicación Capturada', 'Se cargaron tus coordenadas GPS actuales.');
    } catch (e) {
      showError('Error', 'No se pudo obtener la ubicación actual.');
    } finally {
      setGettingLocation(false);
    }
  };

  const handleSaveGeofence = async () => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const rad = parseInt(radiusM, 10);

    if (isNaN(lat) || isNaN(lng) || isNaN(rad)) {
      showError('Datos Inválidos', 'Verifica que la latitud, longitud y radio sean números válidos.');
      return;
    }

    try {
      setIsSaving(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await companiesApi.updateGeofence({
        latitude: lat,
        longitude: lng,
        radius_m: rad,
      });
      showSuccess('Geocerca Guardada', 'Los colaboradores ahora marcarán dentro de este perímetro.');
    } catch (e) {
      showError('Error', 'No se pudo guardar la configuración de geocerca.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBranding = async () => {
    try {
      setIsSaving(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await companiesApi.updateBranding({
        primary_color: primaryColor,
        secondary_color: secondaryColor,
      });
      showSuccess('Branding Guardado', 'Los colores corporativos fueron actualizados.');
    } catch (e) {
      showError('Error', 'No se pudo actualizar el branding.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePickLogo = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        showError('Permiso denegado', 'Se requiere acceso a tus fotos para elegir el logo.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      setIsUploadingLogo(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const updated = await companiesApi.uploadLogo(asset.uri, asset.mimeType);
      setCompany((prev) => (prev ? { ...prev, logo_url: updated?.logo_url ?? prev.logo_url } : prev));
      showSuccess('Logo Actualizado', 'El logo de tu empresa fue guardado.');
    } catch (e: any) {
      const msg = e.response?.data?.message;
      showError('Error', typeof msg === 'string' ? msg : 'No se pudo subir el logo.');
    } finally {
      setIsUploadingLogo(false);
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
  const PLAN_LABELS: Record<string, string> = {
    TRIAL: 'Prueba Gratuita',
    STARTER: 'Starter',
    BUSINESS: 'Business',
    ENTERPRISE: 'Enterprise',
    PRO: 'Pro',
  };
  const rawPlan = (subscription?.plan_name || sub?.plan || company.plan || 'TRIAL').toUpperCase();
  const planName = PLAN_LABELS[rawPlan] || rawPlan;
  const isExpired = !!sub?.is_expired;
  const isTrial = !!subscription?.trial || rawPlan === 'TRIAL';
  const maxLimit = subscription?.max_employees ?? (rawPlan === 'PRO' || rawPlan === 'ENTERPRISE' ? 9999 : 10);
  const isUnlimited = maxLimit >= 9999;
  const usedEmployees = subscription?.used_employees ?? employeeCount;
  const usedPct = isUnlimited
    ? Math.min(100, Math.max(15, (usedEmployees / 100) * 100))
    : Math.min(100, (usedEmployees / Math.max(1, maxLimit)) * 100);
  const atLimit = !isUnlimited && usedEmployees >= maxLimit;
  const expiryRaw = sub?.current_period_end || subscription?.expires_at || null;
  const expiryDate = expiryRaw ? new Date(expiryRaw) : null;
  const expiryStr =
    expiryDate && !isNaN(expiryDate.getTime())
      ? expiryDate.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
      : null;
  const statusText = isExpired
    ? 'Expirada'
    : expiryStr
      ? `Activa · vence ${expiryStr}${sub?.days_remaining != null ? ` (${sub.days_remaining} días)` : ''}`
      : 'Activa';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Configuración Empresa</Text>
      <Text style={styles.subtitle}>{company.name} · Panel de Administración</Text>

      {/* Top Sub Tabs */}
      <View style={styles.navTabsWrapper}>
        <TouchableOpacity
          style={[styles.navTabBtn, activeTab === 'subscription' && styles.navTabBtnActive]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTab('subscription');
          }}
        >
          <CreditCard
            color={activeTab === 'subscription' ? '#FFF' : theme.colors.textMuted}
            size={15}
          />
          <Text
            style={[
              styles.navTabBtnText,
              activeTab === 'subscription' && styles.navTabBtnTextActive,
            ]}
          >
            Suscripción
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navTabBtn, activeTab === 'geofence' && styles.navTabBtnActive]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTab('geofence');
          }}
        >
          <MapPin color={activeTab === 'geofence' ? '#FFF' : theme.colors.textMuted} size={15} />
          <Text
            style={[
              styles.navTabBtnText,
              activeTab === 'geofence' && styles.navTabBtnTextActive,
            ]}
          >
            Geocerca
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navTabBtn, activeTab === 'branding' && styles.navTabBtnActive]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTab('branding');
          }}
        >
          <Palette color={activeTab === 'branding' ? '#FFF' : theme.colors.textMuted} size={15} />
          <Text
            style={[
              styles.navTabBtnText,
              activeTab === 'branding' && styles.navTabBtnTextActive,
            ]}
          >
            Branding
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── SUB TAB 1: Suscripción & Datos Corporativos ────────────────────── */}
      {activeTab === 'subscription' && (
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 350 }}
        >
          {/* Hero Subscription Card */}
          <View style={styles.subHeroCard}>
            <View style={styles.planActivePill}>
              <Text style={styles.planActiveText}>
                {isExpired ? 'Plan Expirado' : isTrial ? 'Prueba Activa' : 'Plan Activo'}
              </Text>
            </View>

            <Text style={styles.subPlanTitle}>{planName}</Text>

            <View style={styles.subMetaGrid}>
              <View style={styles.subMetaCol}>
                <Text style={styles.subMetaLabel}>ESTADO</Text>
                <Text style={[styles.subMetaValue, isExpired && { color: theme.colors.rose }]}>
                  {statusText}
                </Text>
              </View>

              <View style={styles.subMetaCol}>
                <Text style={styles.subMetaLabel}>LÍMITE DE COLABORADORES</Text>
                <Text style={styles.subMetaValue}>
                  {isUnlimited ? 'Ilimitados' : `${maxLimit} colaboradores`}
                </Text>
              </View>
            </View>

            <View style={styles.progressSection}>
              <View style={styles.progressLabelRow}>
                <Text style={styles.progressTitle}>Colaboradores utilizados</Text>
                <Text style={styles.progressCount}>
                  {usedEmployees} de {isUnlimited ? '∞' : maxLimit}
                </Text>
              </View>

              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${usedPct}%` },
                    atLimit && { backgroundColor: theme.colors.rose },
                  ]}
                />
              </View>
              {atLimit && (
                <Text style={{ color: theme.colors.rose, fontSize: 12, fontWeight: '600', marginTop: 8 }}>
                  Has alcanzado el límite de colaboradores. Actualiza tu plan.
                </Text>
              )}
            </View>
          </View>

          {/* Support Card */}
          <View style={styles.needMoreCard}>
            <Text style={styles.needMoreTitle}>¿Necesitas más?</Text>
            <Text style={styles.needMoreSubtitle}>
              Contacta a nuestro equipo para renovar, cambiar de plan o ampliar el límite de tu equipo.
            </Text>

            <TouchableOpacity
              style={styles.contactSupportBtn}
              onPress={handleContactSupport}
              activeOpacity={0.8}
            >
              <Text style={styles.contactSupportBtnText}>Contactar al Soporte</Text>
            </TouchableOpacity>
          </View>

          {/* Corporate Details */}
          <Text style={styles.sectionLabel}>DATOS CORPORATIVOS</Text>
          <View style={styles.group}>
            <MenuRow
              icon={<Building2 color={theme.colors.cyan} size={20} />}
              label="Nombre"
              value={company.name}
              delay={50}
            />
            <MenuRow
              icon={<Hash color={theme.colors.violet} size={20} />}
              label="RUC"
              value={company.ruc || 'No registrado'}
              delay={100}
            />
            <MenuRow
              icon={<Briefcase color={theme.colors.emerald} size={20} />}
              label="Sector"
              value={company.sector || 'General'}
              delay={150}
            />
            <MenuRow
              icon={<Phone color={theme.colors.amber} size={20} />}
              label="Teléfono"
              value={company.phone || 'No registrado'}
              delay={200}
            />
            <MenuRow
              icon={<Mail color={theme.colors.cyan} size={20} />}
              label="Correo admin"
              value={company.email_admin}
              delay={250}
              last
            />
          </View>
        </MotiView>
      )}

      {/* ── SUB TAB 2: Geocerca GPS & Perímetro ────────────────────────────── */}
      {activeTab === 'geofence' && (
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 350 }}
        >
          <View style={styles.geoInfoCard}>
            <MapPin color={theme.colors.cyan} size={24} />
            <View style={{ flex: 1 }}>
              <Text style={styles.geoInfoTitle}>Perímetro de Asistencia GPS</Text>
              <Text style={styles.geoInfoSubtitle}>
                Los colaboradores solo podrán marcar entrada y salida si están dentro del radio configurado.
              </Text>
            </View>
          </View>

          <View style={styles.formCard}>
            <TouchableOpacity
              style={styles.useLocationBtn}
              onPress={handleUseMyLocation}
              disabled={gettingLocation}
              activeOpacity={0.8}
            >
              {gettingLocation ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <>
                  <Crosshair color="#FFF" size={17} />
                  <Text style={styles.useLocationBtnText}>
                    USAR MI UBICACIÓN GPS ACTUAL
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.formRow}>
              <View style={styles.formCol}>
                <Text style={styles.fieldLabel}>LATITUD *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="-7.16233"
                  placeholderTextColor={theme.colors.textMuted}
                  value={latitude}
                  onChangeText={setLatitude}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formCol}>
                <Text style={styles.fieldLabel}>LONGITUD *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="-78.51477"
                  placeholderTextColor={theme.colors.textMuted}
                  value={longitude}
                  onChangeText={setLongitude}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <Text style={styles.fieldLabel}>RADIO PERMITIDO (METROS) *</Text>
            <TextInput
              style={styles.input}
              placeholder="150"
              placeholderTextColor={theme.colors.textMuted}
              value={radiusM}
              onChangeText={setRadiusM}
              keyboardType="number-pad"
            />
            <Text style={styles.helperText}>
              Radio recomendado: 100m a 250m para absorber imprecisiones del GPS de teléfonos.
            </Text>

            <TouchableOpacity
              style={styles.saveActionBtn}
              onPress={handleSaveGeofence}
              disabled={isSaving}
              activeOpacity={0.85}
            >
              {isSaving ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Save color="#FFF" size={18} />
                  <Text style={styles.saveActionBtnText}>Guardar Geocerca</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </MotiView>
      )}

      {/* ── SUB TAB 3: Branding & Identidad ───────────────────────────────── */}
      {activeTab === 'branding' && (
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 350 }}
        >
          <View style={styles.formCard}>
            <Text style={styles.fieldLabel}>LOGO DE LA EMPRESA</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 }}>
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 16,
                  overflow: 'hidden',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: theme.colors.glassBorder,
                  backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                }}
              >
                {company.logo_url ? (
                  <Image
                    source={{ uri: assetUrl(company.logo_url) as string }}
                    style={{ width: 72, height: 72 }}
                    resizeMode="contain"
                  />
                ) : (
                  <Building2 color={theme.colors.textMuted} size={28} />
                )}
              </View>
              <TouchableOpacity
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  paddingVertical: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: theme.colors.cyan,
                }}
                onPress={handlePickLogo}
                disabled={isUploadingLogo}
                activeOpacity={0.8}
              >
                {isUploadingLogo ? (
                  <ActivityIndicator size="small" color={theme.colors.cyan} />
                ) : (
                  <>
                    <ImagePlus color={theme.colors.cyan} size={18} />
                    <Text style={{ color: theme.colors.cyan, fontWeight: '800', fontSize: 12 }}>
                      {company.logo_url ? 'CAMBIAR LOGO' : 'SUBIR LOGO'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>COLOR PRIMARIO (HEX)</Text>
            <View style={styles.colorInputRow}>
              <View style={[styles.colorSquare, { backgroundColor: primaryColor }]} />
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                value={primaryColor}
                onChangeText={setPrimaryColor}
                placeholder="#00D4FF"
                placeholderTextColor={theme.colors.textMuted}
                autoCapitalize="characters"
                maxLength={7}
              />
            </View>

            {/* Presets Row */}
            <View style={styles.presetsRow}>
              {['#00D4FF', '#10B981', '#F59E0B', '#8B5CF6', '#3B82F6', '#EC4899'].map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.presetDot, { backgroundColor: c }]}
                  onPress={() => setPrimaryColor(c)}
                />
              ))}
            </View>

            <Text style={styles.fieldLabel}>COLOR SECUNDARIO (HEX)</Text>
            <View style={styles.colorInputRow}>
              <View style={[styles.colorSquare, { backgroundColor: secondaryColor }]} />
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                value={secondaryColor}
                onChangeText={setSecondaryColor}
                placeholder="#050A14"
                placeholderTextColor={theme.colors.textMuted}
                autoCapitalize="characters"
                maxLength={7}
              />
            </View>

            {/* Preview Banner */}
            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>VISTA PREVIA</Text>
            <View
              style={[
                styles.brandPreviewCard,
                { borderColor: primaryColor, backgroundColor: isDark ? '#0F172A' : '#F8FAFC' },
              ]}
            >
              <View style={[styles.brandPreviewBadge, { backgroundColor: primaryColor }]}>
                <Sparkles color="#050A14" size={14} />
                <Text style={styles.brandPreviewBadgeText}>{company.name}</Text>
              </View>
              <Text style={styles.brandPreviewTitle}>Identidad Corporativa</Text>
              <Text style={styles.brandPreviewSubtitle}>
                Este color destacará en el panel web y la app móvil de tus colaboradores.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.saveActionBtn, { backgroundColor: primaryColor, marginTop: 20 }]}
              onPress={handleSaveBranding}
              disabled={isSaving}
              activeOpacity={0.85}
            >
              {isSaving ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Save color="#FFF" size={18} />
                  <Text style={styles.saveActionBtnText}>Guardar Personalización</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </MotiView>
      )}
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

    // Sub Tabs
    navTabsWrapper: {
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
    navTabBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: theme.borderRadius.md,
    },
    navTabBtnActive: {
      backgroundColor: theme.colors.cyan,
    },
    navTabBtnText: {
      fontSize: 12,
      fontWeight: '800',
      color: theme.colors.textMuted,
    },
    navTabBtnTextActive: {
      color: '#FFFFFF',
    },

    // Sub Hero Card
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

    // Geofence & Branding Form Cards
    geoInfoCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.glassBorder,
      borderWidth: 1,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      ...theme.shadows.card,
    },
    geoInfoTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: theme.colors.textPrimary,
    },
    geoInfoSubtitle: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    formCard: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.glassBorder,
      borderWidth: 1,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
      ...theme.shadows.card,
    },
    useLocationBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: theme.colors.cyan,
      paddingVertical: 12,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.lg,
    },
    useLocationBtnText: {
      color: '#050A14',
      fontSize: 11.5,
      fontWeight: '900',
      letterSpacing: 0.5,
    },
    formRow: {
      flexDirection: 'row',
      gap: 10,
    },
    formCol: {
      flex: 1,
    },
    fieldLabel: {
      fontSize: 10.5,
      fontWeight: '800',
      color: theme.colors.textMuted,
      letterSpacing: 0.8,
      marginBottom: 6,
    },
    input: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F8FAFC',
      borderColor: theme.colors.glassBorder,
      borderWidth: 1,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: theme.colors.textPrimary,
      fontSize: 14,
      marginBottom: 12,
    },
    helperText: {
      fontSize: 11,
      color: theme.colors.textMuted,
      marginBottom: 16,
      lineHeight: 16,
    },
    saveActionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: theme.colors.emerald,
      paddingVertical: 13,
      borderRadius: theme.borderRadius.md,
    },
    saveActionBtnText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '800',
    },

    // Branding Elements
    colorInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 10,
    },
    colorSquare: {
      width: 42,
      height: 42,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
    },
    presetsRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 16,
    },
    presetDot: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.3)',
    },
    brandPreviewCard: {
      borderWidth: 1.5,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.lg,
      marginTop: 4,
    },
    brandPreviewBadge: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: theme.borderRadius.full,
      marginBottom: 8,
    },
    brandPreviewBadgeText: {
      color: '#050A14',
      fontSize: 11,
      fontWeight: '900',
    },
    brandPreviewTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.colors.textPrimary,
    },
    brandPreviewSubtitle: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 4,
    },

    emptyText: {
      color: theme.colors.textMuted,
      fontSize: 14,
      textAlign: 'center',
    },
  });
