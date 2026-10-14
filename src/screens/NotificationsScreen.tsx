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
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Theme } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';
import { useAlert } from '../context/AlertContext';
import { notificationsApi } from '../services/api';
import { NotificationItem } from '../types';
import { Bell, BellOff, CheckCheck, ChevronLeft } from 'lucide-react-native';

const formatSentAt = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('es-PE', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const NotificationsScreen = () => {
  const { theme, isDark } = useTheme();
  const { showError } = useAlert();
  const navigation = useNavigation<any>();

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const load = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setItems(await notificationsApi.getMine());
    } catch (e) {
      showError('Error', 'No se pudieron cargar tus notificaciones.');
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

  const markRead = async (id: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // El servidor solo devuelve las no leídas: al marcar, la quitamos de la lista.
    setItems((prev) => prev.filter((n) => n.id !== id));
    try {
      await notificationsApi.markRead(id);
    } catch (e) {
      showError('Error', 'No se pudo marcar la notificación como leída.');
      load(true);
    }
  };

  const markAllRead = async () => {
    const pending = items;
    if (pending.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setItems([]);
    const results = await Promise.allSettled(pending.map((n) => notificationsApi.markRead(n.id)));
    if (results.some((r) => r.status === 'rejected')) {
      showError('Error', 'Algunas notificaciones no se pudieron marcar como leídas.');
      load(true);
    }
  };

  const renderItem = ({ item, index }: { item: NotificationItem; index: number }) => (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 300, delay: Math.min(index, 8) * 30 }}
      style={styles.card}
    >
      <View style={styles.iconWrap}>
        <Bell color={theme.colors.cyan} size={18} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.message}>{item.message}</Text>
        <Text style={styles.time}>{formatSentAt(item.sentAt)}</Text>
      </View>
      <TouchableOpacity style={styles.readBtn} onPress={() => markRead(item.id)} activeOpacity={0.7}>
        <CheckCheck color={theme.colors.emerald} size={18} />
      </TouchableOpacity>
    </MotiView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft color={theme.colors.textPrimary} size={22} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Notificaciones</Text>
          <Text style={styles.subtitle}>
            {items.length > 0 ? `${items.length} sin leer` : 'Estás al día'}
          </Text>
        </View>
        {items.length > 0 && (
          <TouchableOpacity onPress={markAllRead} style={styles.markAllBtn} activeOpacity={0.8}>
            <Text style={styles.markAllText}>MARCAR TODAS</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.cyan} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(n) => String(n.id)}
          renderItem={renderItem}
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
          ListEmptyComponent={
            <View style={styles.center}>
              <BellOff color={theme.colors.textMuted} size={40} />
              <Text style={styles.emptyText}>No tienes notificaciones pendientes.</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const createStyles = (theme: Theme, isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: {
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
    title: { fontSize: 22, fontWeight: '800', color: theme.colors.textPrimary },
    subtitle: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
    markAllBtn: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.cyan,
    },
    markAllText: { color: theme.colors.cyan, fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
    list: { padding: theme.spacing.lg, paddingTop: theme.spacing.sm, flexGrow: 1 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 80 },
    emptyText: { color: theme.colors.textMuted, fontSize: 14, textAlign: 'center' },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.glassBorder,
      borderWidth: 1,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
      ...theme.shadows.card,
    },
    iconWrap: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? 'rgba(0, 212, 255, 0.12)' : 'rgba(2, 132, 199, 0.1)',
    },
    message: { fontSize: 14, fontWeight: '600', color: theme.colors.textPrimary },
    time: { fontSize: 11, color: theme.colors.textMuted, marginTop: 3 },
    readBtn: { padding: 8 },
  });
