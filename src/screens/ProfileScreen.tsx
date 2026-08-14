import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { theme } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import { attendanceApi } from '../services/api';
import { MenuRow } from '../components/MenuRow';
import { User, ShieldCheck, Smartphone, LogOut, Award, FileText } from 'lucide-react-native';

export const ProfileScreen = ({ navigation }: any) => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await attendanceApi.getMyStats();
      setStats(data);
    } catch (e) {
      console.log('Error loading profile stats:', e);
    }
  };

  const calculateScore = () => {
    if (!stats) return '100%';
    const onTime = stats.onTime || 0;
    const late = stats.late || 0;
    const missed = stats.missed || 0;
    const total = onTime + late + missed;
    if (total === 0) return '100%';
    const score = Math.round((onTime / total) * 100);
    return `${score}%`;
  };

  const handleLogout = () => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro de que deseas salir de tu cuenta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar Sesión', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <MotiView
        from={{ opacity: 0, translateY: -15 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400 }}
      >
        <Text style={styles.title}>Mi Perfil</Text>
        <Text style={styles.subtitle}>Información personal y estado del dispositivo UBIX</Text>
      </MotiView>

      {/* User Hero Card */}
      <MotiView
        from={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'timing', duration: 450, delay: 100 }}
        style={styles.cardHero}
      >
        <LinearGradient
          colors={theme.colors.gradients.primary}
          style={styles.heroGradient}
        >
          <View style={styles.heroAvatar}>
            <User color={theme.colors.cyan} size={32} />
          </View>
          <Text style={styles.heroName}>{user?.full_name || 'Empleado'}</Text>
          <Text style={styles.heroRole}>Empleado Autorizado UBIX</Text>
        </LinearGradient>
      </MotiView>

      {/* Employee Options Menu */}
      <Text style={styles.sectionHeader}>OPCIONES DE COLABORADOR</Text>
      <View style={styles.menuGroup}>
        <MenuRow
          title="Libro de Reclamaciones"
          subtitle="Enviar justificaciones de tardanza o incidencias a RRHH"
          icon={<FileText color={theme.colors.cyan} size={20} />}
          onPress={() => navigation.navigate('Reclamaciones')}
        />
      </View>

      {/* Info Details List */}
      <Text style={styles.sectionHeader}>ESTADO DE CUENTA Y DISPOSITIVO</Text>
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 500, delay: 200 }}
        style={styles.infoGroup}
      >
        <View style={styles.infoRow}>
          <View style={styles.rowIcon}>
            <Award color={theme.colors.emerald} size={20} />
          </View>
          <View style={styles.rowContent}>
            <Text style={styles.rowLabel}>Score de Puntualidad</Text>
            <Text style={styles.rowValue}>{calculateScore()} Puntualidad</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.rowIcon}>
            <Smartphone color={theme.colors.cyan} size={20} />
          </View>
          <View style={styles.rowContent}>
            <Text style={styles.rowLabel}>Dispositivo Autorizado</Text>
            <Text style={styles.rowValue}>Registrado e inmutable</Text>
          </View>
          <ShieldCheck color={theme.colors.emerald} size={18} />
        </View>

        <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
          <View style={styles.rowIcon}>
            <ShieldCheck color={theme.colors.violet} size={20} />
          </View>
          <View style={styles.rowContent}>
            <Text style={styles.rowLabel}>DNI de Registro</Text>
            <Text style={styles.rowValue}>{user?.dni || '71484635'}</Text>
          </View>
        </View>
      </MotiView>

      {/* Logout Action */}
      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <LogOut color={theme.colors.rose} size={20} />
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>
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
  cardHero: {
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    marginBottom: theme.spacing.lg,
    ...theme.shadows.glowPrimary,
  },
  heroGradient: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  heroAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#050A14',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  heroName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
  },
  heroRole: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
    letterSpacing: 1,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.textMuted,
    letterSpacing: 1,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  menuGroup: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.glassBorder,
    borderWidth: 1,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  infoGroup: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.glassBorder,
    borderWidth: 1,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  rowContent: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderColor: 'rgba(244, 63, 94, 0.3)',
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  logoutText: {
    color: theme.colors.rose,
    fontSize: 15,
    fontWeight: '700',
  },
});
