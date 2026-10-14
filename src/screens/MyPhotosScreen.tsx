import React, { useState, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { Theme } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';
import { useAlert } from '../context/AlertContext';
import { myPhotosApi, assetUrl } from '../services/api';
import { MyPhotoItem } from '../types';
import { ChevronLeft, ChevronRight, ImageOff, X } from 'lucide-react-native';

const TZ = 'America/Lima';

const currentYearMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const shiftMonth = (ym: string, delta: number) => {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const monthLabel = (ym: string) => {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });
};

export const MyPhotosScreen = () => {
  const { theme, isDark } = useTheme();
  const { showError } = useAlert();
  const navigation = useNavigation<any>();

  const [month, setMonth] = useState(currentYearMonth);
  const [photos, setPhotos] = useState<MyPhotoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<MyPhotoItem | null>(null);

  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const isCurrentMonth = month >= currentYearMonth();

  const load = useCallback(async (ym: string, silent = false) => {
    try {
      if (!silent) setLoading(true);
      setPhotos(await myPhotosApi.list(ym));
    } catch (e) {
      showError('Error', 'No se pudieron cargar tus fotos.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(month);
    }, [load, month]),
  );

  const changeMonth = (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMonth((m) => shiftMonth(m, delta));
  };

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('es-PE', { timeZone: TZ, day: '2-digit', month: 'short' });
  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('es-PE', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });

  const renderItem = ({ item }: { item: MyPhotoItem }) => {
    const isEntrada = item.type === 'ENTRADA';
    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => setSelected(item)}>
        <Image source={{ uri: assetUrl(item.selfie_url) as string }} style={styles.thumb} resizeMode="cover" />
        <View
          style={[
            styles.badge,
            { backgroundColor: isEntrada ? theme.colors.emerald : theme.colors.rose },
          ]}
        >
          <Text style={styles.badgeText}>{item.type}</Text>
        </View>
        <View style={styles.cardFooter}>
          <Text style={styles.cardDate}>{fmtDate(item.timestamp)}</Text>
          <Text style={styles.cardTime}>{fmtTime(item.timestamp)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.circleBtn}>
          <ChevronLeft color={theme.colors.textPrimary} size={22} />
        </TouchableOpacity>
        <Text style={styles.title}>Mis Fotos</Text>
      </View>

      <View style={styles.monthRow}>
        <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.circleBtn}>
          <ChevronLeft color={theme.colors.textPrimary} size={20} />
        </TouchableOpacity>
        <Text style={styles.monthText}>{monthLabel(month)}</Text>
        <TouchableOpacity
          onPress={() => changeMonth(1)}
          disabled={isCurrentMonth}
          style={[styles.circleBtn, isCurrentMonth && { opacity: 0.35 }]}
        >
          <ChevronRight color={theme.colors.textPrimary} size={20} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.cyan} />
        </View>
      ) : (
        <FlatList
          data={photos}
          keyExtractor={(p) => String(p.id)}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={{ gap: 12 }}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load(month, true);
              }}
              tintColor={theme.colors.cyan}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <ImageOff color={theme.colors.textMuted} size={40} />
              <Text style={styles.empty}>Sin fotos este mes.</Text>
            </View>
          }
        />
      )}

      <Modal visible={!!selected} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
        <View style={styles.lightbox}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => setSelected(null)}>
            <X color="#FFF" size={24} />
          </TouchableOpacity>
          {selected && (
            <>
              <Image
                source={{ uri: assetUrl(selected.selfie_url) as string }}
                style={styles.fullImage}
                resizeMode="contain"
              />
              <Text style={styles.lightboxCaption}>
                {fmtDate(selected.timestamp)} {fmtTime(selected.timestamp)} — {selected.type}
              </Text>
            </>
          )}
        </View>
      </Modal>
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
      paddingBottom: theme.spacing.sm,
    },
    circleBtn: {
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
    monthRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
    },
    monthText: { fontSize: 15, fontWeight: '800', color: theme.colors.textPrimary, textTransform: 'capitalize' },
    list: { padding: theme.spacing.lg, paddingTop: theme.spacing.xs, flexGrow: 1 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 60 },
    empty: { color: theme.colors.textMuted, fontSize: 14 },
    card: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.glassBorder,
      borderWidth: 1,
      borderRadius: theme.borderRadius.lg,
      overflow: 'hidden',
      marginBottom: 12,
    },
    thumb: { width: '100%', aspectRatio: 3 / 4, backgroundColor: isDark ? '#0F172A' : '#E2E8F0' },
    badge: { position: 'absolute', top: 8, right: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
    badgeText: { color: '#FFF', fontSize: 9, fontWeight: '900' },
    cardFooter: { padding: 8, alignItems: 'center' },
    cardDate: { fontSize: 12, fontWeight: '800', color: theme.colors.textPrimary },
    cardTime: { fontSize: 11, color: theme.colors.textMuted },
    lightbox: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center' },
    closeBtn: { position: 'absolute', top: 54, right: 20, zIndex: 2, padding: 8 },
    fullImage: { width: '100%', height: '75%' },
    lightboxCaption: { color: '#FFF', fontSize: 14, fontWeight: '700', marginTop: 16 },
  });
