import React, { useState, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Theme } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { rankingApi } from '../services/api';
import { EmployeeRankingRow, MyRanking } from '../types';
import { ChevronLeft, Trophy } from 'lucide-react-native';

const MEDALS = ['🥇', '🥈', '🥉'];

export const RankingScreen = () => {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const { showError } = useAlert();
  const navigation = useNavigation<any>();

  const [rows, setRows] = useState<EmployeeRankingRow[]>([]);
  const [mine, setMine] = useState<MyRanking | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const load = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [all, me] = await Promise.all([rankingApi.getAll(), rankingApi.getMine()]);
      setRows(all);
      setMine(me);
    } catch (e) {
      showError('Error', 'No se pudo cargar el ranking.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const score = typeof mine?.score === 'number' ? mine.score : 0;
  const myId = (user as any)?.employee_id ?? user?.id;

  const header = (
    <View>
      <LinearGradient colors={theme.colors.gradients.cyan} style={styles.heroCard}>
        <Text style={styles.heroLabel}>TU PUNTAJE DE PUNTUALIDAD</Text>
        <Text style={styles.heroScore}>
          {score.toFixed(1)}
          <Text style={styles.heroPct}>%</Text>
        </Text>
        <View style={styles.heroBarTrack}>
          <View style={[styles.heroBarFill, { width: `${Math.max(0, Math.min(100, score))}%` }]} />
        </View>
        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{mine?.position ?? '—'}</Text>
            <Text style={styles.heroStatLabel}>POSICIÓN</Text>
          </View>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{mine?.totalEmployees ?? '—'}</Text>
            <Text style={styles.heroStatLabel}>EQUIPO</Text>
          </View>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{mine?.onTime ?? 0}</Text>
            <Text style={styles.heroStatLabel}>PUNTUALES</Text>
          </View>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{mine?.late ?? 0}</Text>
            <Text style={styles.heroStatLabel}>TARDES</Text>
          </View>
        </View>
      </LinearGradient>
      <Text style={styles.sectionHeader}>CLASIFICACIÓN GENERAL</Text>
    </View>
  );

  const renderItem = ({ item, index }: { item: EmployeeRankingRow; index: number }) => {
    const isMe = item.employeeId === myId;
    return (
      <View style={[styles.row, isMe && styles.rowMe]}>
        <Text style={styles.rowPos}>{index < 3 ? MEDALS[index] : `#${index + 1}`}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.rowName, isMe && { color: theme.colors.cyan }]} numberOfLines={1}>
            {item.name}
            {isMe ? ' (Tú)' : ''}
          </Text>
          <Text style={styles.rowMeta}>
            {item.onTime} puntuales · {item.late} tardes
          </Text>
        </View>
        <Text style={styles.rowScore}>{item.score.toFixed(1)}%</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft color={theme.colors.textPrimary} size={22} />
        </TouchableOpacity>
        <Text style={styles.title}>Ranking</Text>
        <Trophy color={theme.colors.amber} size={22} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.cyan} />
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(r) => String(r.employeeId)}
          renderItem={renderItem}
          ListHeaderComponent={header}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load(true);
              }}
              tintColor={theme.colors.cyan}
            />
          }
          ListEmptyComponent={<Text style={styles.empty}>Sin datos de ranking todavía.</Text>}
        />
      )}
    </View>
  );
};

const createStyles = (theme: Theme, isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.xl + 8,
      paddingBottom: theme.spacing.md,
    },
    backBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.glassBorder,
    },
    title: { flex: 1, fontSize: 22, fontWeight: '800', color: theme.colors.textPrimary },
    list: { padding: theme.spacing.lg, paddingTop: theme.spacing.sm, paddingBottom: theme.spacing.xxl },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    empty: { color: theme.colors.textMuted, textAlign: 'center', marginTop: 24 },
    heroCard: { borderRadius: theme.borderRadius.xl, padding: theme.spacing.lg, marginBottom: theme.spacing.lg },
    heroLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
    heroScore: { color: '#FFF', fontSize: 52, fontWeight: '900', marginTop: 4 },
    heroPct: { fontSize: 24, color: 'rgba(255,255,255,0.7)' },
    heroBarTrack: {
      height: 8,
      borderRadius: 4,
      backgroundColor: 'rgba(0,0,0,0.25)',
      overflow: 'hidden',
      marginTop: 6,
    },
    heroBarFill: { height: '100%', backgroundColor: '#FFF', borderRadius: 4 },
    heroStats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 },
    heroStat: { alignItems: 'center', flex: 1 },
    heroStatValue: { color: '#FFF', fontSize: 20, fontWeight: '800' },
    heroStatLabel: {
      color: 'rgba(255,255,255,0.8)',
      fontSize: 9,
      fontWeight: '800',
      marginTop: 2,
      letterSpacing: 0.6,
    },
    sectionHeader: {
      fontSize: 11,
      fontWeight: '800',
      color: theme.colors.textMuted,
      letterSpacing: 1,
      marginBottom: theme.spacing.sm,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.glassBorder,
      borderWidth: 1,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    rowMe: {
      borderColor: theme.colors.cyan,
      borderWidth: 2,
      backgroundColor: isDark ? 'rgba(0, 212, 255, 0.08)' : 'rgba(2, 132, 199, 0.06)',
    },
    rowPos: { width: 36, textAlign: 'center', fontSize: 16, fontWeight: '800', color: theme.colors.textMuted },
    rowName: { fontSize: 14, fontWeight: '700', color: theme.colors.textPrimary },
    rowMeta: { fontSize: 11, color: theme.colors.textMuted, marginTop: 2 },
    rowScore: { fontSize: 16, fontWeight: '900', color: theme.colors.textPrimary },
  });
