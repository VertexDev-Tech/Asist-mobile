import React, { useEffect, useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MotiView } from 'moti';
import { Theme } from '../../theme/theme';
import { useTheme } from '../../context/ThemeContext';
import { attendanceApi } from '../../services/api';
import { AlertTriangle, CheckCircle } from 'lucide-react-native';

export const AdminAlertsScreen = () => {
  const { theme, isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alertsList, setAlertsList] = useState<any[]>([]);

  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const data = await attendanceApi.getAlerts();
      setAlertsList(data || []);
    } catch (e) {
      console.log('Error loading alerts:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
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
            loadAlerts();
          }}
          tintColor={theme.colors.cyan}
        />
      }
    >
      <Text style={styles.title}>Alertas & Incidencias</Text>
      <Text style={styles.subtitle}>Supervisión de anomalías de geocerca y asistencia</Text>

      {alertsList && alertsList.length > 0 ? (
        alertsList.map((alertItem, index) => (
          <MotiView
            key={alertItem.id || index}
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 350, delay: index * 50 }}
            style={styles.alertCard}
          >
            <View style={styles.alertIconCircle}>
              <AlertTriangle color={theme.colors.orange} size={22} />
            </View>

            <View style={styles.alertInfo}>
              <Text style={styles.employeeName}>
                {alertItem.employee?.full_name || alertItem.employee_name || 'Empleado'}
              </Text>
              <Text style={styles.alertDetail}>
                {alertItem.detail || alertItem.type || 'Alerta de geocerca fuera de zona'}
              </Text>
              <Text style={styles.alertDate}>
                {alertItem.created_at
                  ? new Date(alertItem.created_at).toLocaleString('es-PE')
                  : 'Reciente'}
              </Text>
            </View>
          </MotiView>
        ))
      ) : (
        <View style={styles.emptyContainer}>
          <CheckCircle color={theme.colors.emerald} size={36} />
          <Text style={styles.emptyText}>¡Todo en orden! No hay alertas pendientes por revisar.</Text>
        </View>
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
    alertCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderColor: 'rgba(249, 115, 22, 0.3)',
      borderWidth: 1,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      ...theme.shadows.card,
    },
    alertIconCircle: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: isDark ? 'rgba(249, 115, 22, 0.15)' : 'rgba(249, 115, 22, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing.md,
    },
    alertInfo: {
      flex: 1,
    },
    employeeName: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    alertDetail: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    alertDate: {
      fontSize: 11,
      color: theme.colors.textMuted,
      marginTop: 4,
    },
    emptyContainer: {
      padding: theme.spacing.xxl,
      alignItems: 'center',
      gap: 12,
    },
    emptyText: {
      color: theme.colors.textMuted,
      fontSize: 14,
      textAlign: 'center',
    },
  });
