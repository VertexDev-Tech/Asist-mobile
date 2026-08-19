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
import { schedulesApi } from '../../services/api';
import { Clock } from 'lucide-react-native';

export const AdminSchedulesScreen = () => {
  const { theme, isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [schedules, setSchedules] = useState<any[]>([]);

  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const data = await schedulesApi.list();
      setSchedules(data || []);
    } catch (e) {
      console.log('Error loading schedules:', e);
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
            loadSchedules();
          }}
          tintColor={theme.colors.cyan}
        />
      }
    >
      <Text style={styles.title}>Horarios & Turnos</Text>
      <Text style={styles.subtitle}>Plantillas de trabajo configuradas en UBIX</Text>

      {schedules && schedules.length > 0 ? (
        schedules.map((sched, index) => (
          <MotiView
            key={sched.id || index}
            from={{ opacity: 0, translateY: 15 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: index * 60 }}
            style={styles.scheduleCard}
          >
            <View style={styles.cardHeader}>
              <View style={styles.iconCircle}>
                <Clock color={theme.colors.cyan} size={20} />
              </View>
              <View style={styles.headerInfo}>
                <Text style={styles.scheduleName}>{sched.name || 'Horario General'}</Text>
                <Text style={styles.scheduleType}>
                  Tolerancia: {sched.tolerance_min || 15} minutos
                </Text>
              </View>
              <View style={styles.activePill}>
                <Text style={styles.activePillText}>Activo</Text>
              </View>
            </View>

            {/* Shift List */}
            {sched.shifts && sched.shifts.length > 0 && (
              <View style={styles.shiftsContainer}>
                <Text style={styles.shiftsLabel}>TURNOS PROGRAMADOS:</Text>
                {sched.shifts.map((shift: any, sIdx: number) => (
                  <View key={shift.id || sIdx} style={styles.shiftRow}>
                    <Text style={styles.shiftDay}>{shift.day_of_week}</Text>
                    <Text style={styles.shiftTime}>
                      {shift.start_time ? shift.start_time.slice(0, 5) : '08:00'} -{' '}
                      {shift.end_time ? shift.end_time.slice(0, 5) : '17:00'}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </MotiView>
        ))
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No hay plantillas de horario configuradas.</Text>
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
    scheduleCard: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.glassBorder,
      borderWidth: 1,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      ...theme.shadows.card,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    iconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDark ? 'rgba(0, 212, 255, 0.15)' : 'rgba(2, 132, 199, 0.12)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing.md,
    },
    headerInfo: {
      flex: 1,
    },
    scheduleName: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    scheduleType: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    activePill: {
      backgroundColor: 'rgba(16, 185, 129, 0.15)',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: theme.borderRadius.full,
    },
    activePillText: {
      color: theme.colors.emerald,
      fontSize: 11,
      fontWeight: '800',
    },
    shiftsContainer: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.glassBorder,
      paddingTop: theme.spacing.md,
    },
    shiftsLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: theme.colors.textMuted,
      letterSpacing: 1,
      marginBottom: 8,
    },
    shiftRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 4,
    },
    shiftDay: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.textSecondary,
    },
    shiftTime: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.cyan,
    },
    emptyContainer: {
      padding: theme.spacing.xl,
      alignItems: 'center',
    },
    emptyText: {
      color: theme.colors.textMuted,
      fontSize: 14,
    },
  });
