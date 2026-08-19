import React, { useEffect, useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { Theme } from '../../theme/theme';
import { useTheme } from '../../context/ThemeContext';
import { dashboardApi, API_BASE_URL } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { RankingItem, TopLateItem, WeeklyStat } from '../../types';
import { SimpleBarChart } from '../../components/SimpleBarChart';
import { Award, Clock, TrendingUp, AlertTriangle, FileSpreadsheet } from 'lucide-react-native';

export const AdminReportsScreen = () => {
  const { token } = useAuth();
  const { theme, isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [topLate, setTopLate] = useState<TopLateItem[]>([]);
  const [monthlyChart, setMonthlyChart] = useState<WeeklyStat[]>([]);

  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const [rData, tData, mData] = await Promise.all([
        dashboardApi.getRanking().catch(() => []),
        dashboardApi.getTopLate().catch(() => []),
        dashboardApi.getMonthlyPunctuality().catch(() => []),
      ]);
      setRanking(rData || []);
      setTopLate(tData || []);
      setMonthlyChart(mData || []);
    } catch (e) {
      console.log('Error loading reports:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleExportReport = async () => {
    if (exporting) return;
    try {
      setExporting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const to = now.toISOString().slice(0, 10);

      const fileUri = `${FileSystem.documentDirectory}reporte-asistencia-${to}.xlsx`;
      const result = await FileSystem.downloadAsync(
        `${API_BASE_URL}/dashboard/report/export?from=${from}&to=${to}`,
        fileUri,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
      );

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(result.uri, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: 'Reporte de Asistencia',
        });
      } else {
        Alert.alert('Reporte descargado', `Guardado en: ${result.uri}`);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'No se pudo generar el reporte en Excel. Verifica tu plan/suscripción.');
    } finally {
      setExporting(false);
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.cyan} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadReports();
          }}
          tintColor={theme.colors.cyan}
        />
      }
    >
      <MotiView
        from={{ opacity: 0, translateY: -10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400 }}
      >
        <Text style={styles.title}>Reportes & Métricas</Text>
        <Text style={styles.subtitle}>Análisis consolidado de asistencia y puntualidad</Text>
      </MotiView>

      {/* Export to Excel CTA Button */}
      <TouchableOpacity
        style={styles.exportBtnWrapper}
        onPress={handleExportReport}
        disabled={exporting}
        activeOpacity={0.85}
      >
        <LinearGradient colors={theme.colors.gradients.cyan} style={styles.exportBtn}>
          {exporting ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <>
              <FileSpreadsheet color="#FFF" size={18} />
              <Text style={styles.exportBtnText}>EXPORTAR AUDITORÍA EN EXCEL (.XLSX)</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>

      {/* Monthly Chart */}
      <View style={styles.sectionHeader}>
        <TrendingUp color={theme.colors.cyan} size={18} />
        <Text style={styles.sectionTitle}>TENDENCIA MENSUAL DE PUNTUALIDAD</Text>
      </View>
      <SimpleBarChart data={monthlyChart} height={160} />

      {/* Top 5 Ranking of Punctual Employees */}
      <View style={styles.sectionHeader}>
        <Award color={theme.colors.emerald} size={18} />
        <Text style={styles.sectionTitle}>TOP 5 COLABORADORES DESTACADOS</Text>
      </View>

      {ranking && ranking.length > 0 ? (
        ranking.slice(0, 5).map((item, i) => {
          const score = item.score ?? item.punctuality_percent ?? 100;
          const badgeColors = ['#F59E0B', '#94A3B8', '#B45309', theme.colors.cyan, theme.colors.cyan];

          return (
            <MotiView
              key={item.id || i}
              from={{ opacity: 0, translateX: -10 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: 'timing', duration: 350, delay: i * 60 }}
              style={styles.rankingCard}
            >
              <View style={[styles.rankBadge, { backgroundColor: badgeColors[i] || theme.colors.cyan }]}>
                <Text style={styles.rankBadgeText}>#{i + 1}</Text>
              </View>

              <View style={styles.rankInfo}>
                <Text style={styles.rankName}>{item.full_name || item.name}</Text>
                <Text style={styles.rankDetails}>
                  {item.position || 'Colaborador'} | {item.onTimeCount ?? item.punctual ?? 0} asistencias perfectas
                </Text>
              </View>

              <View style={styles.scorePill}>
                <Text style={styles.scoreText}>{score}%</Text>
              </View>
            </MotiView>
          );
        })
      ) : (
        <Text style={styles.emptyText}>Sin datos de ranking disponibles este mes.</Text>
      )}

      {/* Top Late Employees List */}
      {topLate && topLate.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Clock color={theme.colors.amber} size={18} />
            <Text style={styles.sectionTitle}>RECURRENTES EN TARDANZA</Text>
          </View>

          {topLate.slice(0, 5).map((item, i) => (
            <MotiView
              key={item.id || i}
              from={{ opacity: 0, translateX: 10 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: 'timing', duration: 350, delay: i * 60 }}
              style={styles.topLateCard}
            >
              <AlertTriangle color={theme.colors.amber} size={20} />
              <View style={styles.topLateInfo}>
                <Text style={styles.topLateName}>{item.employee_name || item.full_name}</Text>
                <Text style={styles.topLateDetails}>
                  {item.late_count ?? item.lateCount ?? 0} tardanzas
                  {item.minutesLateTotal ? ` (${item.minutesLateTotal} min acumulados)` : ''}
                </Text>
              </View>
            </MotiView>
          ))}
        </>
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
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginVertical: theme.spacing.md,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: '800',
      color: theme.colors.textMuted,
      letterSpacing: 1,
    },
    rankingCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.glassBorder,
      borderWidth: 1,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      ...theme.shadows.card,
    },
    rankBadge: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing.md,
    },
    rankBadgeText: {
      color: '#FFF',
      fontWeight: '800',
      fontSize: 12,
    },
    rankInfo: {
      flex: 1,
    },
    rankName: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    rankDetails: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    scorePill: {
      backgroundColor: 'rgba(16, 185, 129, 0.15)',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: theme.borderRadius.full,
    },
    scoreText: {
      color: theme.colors.emerald,
      fontSize: 12,
      fontWeight: '800',
    },
    topLateCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderColor: 'rgba(245, 158, 11, 0.3)',
      borderWidth: 1,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      ...theme.shadows.card,
    },
    topLateInfo: {
      flex: 1,
    },
    topLateName: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    topLateDetails: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    emptyText: {
      color: theme.colors.textMuted,
      fontSize: 13,
      marginBottom: theme.spacing.md,
    },
    exportBtnWrapper: {
      borderRadius: theme.borderRadius.md,
      overflow: 'hidden',
      marginBottom: theme.spacing.lg,
      ...theme.shadows.glowPrimary,
    },
    exportBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      height: 50,
    },
    exportBtnText: {
      color: '#FFF',
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
  });
