import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { Theme } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';
import { reclamacionesApi } from '../services/api';
import { Send, Mail } from 'lucide-react-native';

export const ReclamacionesScreen = () => {
  const { theme, isDark } = useTheme();
  const [tipo, setTipo] = useState<'RECLAMO' | 'JUSTIFICACION' | 'CONSULTA'>('JUSTIFICACION');
  const [detalle, setDetalle] = useState('');
  const [contacto, setContacto] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const handleSubmit = async () => {
    if (!detalle.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Campo requerido', 'Por favor describe la incidencia o justificación.');
      return;
    }

    try {
      setIsSubmitting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await reclamacionesApi.create({
        tipo,
        detalle: detalle.trim(),
        contacto: contacto.trim() || undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Enviado con Éxito', 'Tu solicitud ha sido registrada para revisión por el equipo de RRHH.');
      setDetalle('');
      setContacto('');
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'No se pudo enviar la solicitud. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <MotiView
          from={{ opacity: 0, translateY: -15 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400 }}
        >
          <Text style={styles.title}>Libro de Reclamaciones</Text>
          <Text style={styles.subtitle}>Envía justificaciones de tardanza o consultas a RRHH</Text>
        </MotiView>

        {/* Tipo Selector */}
        <View style={styles.typeSelectorRow}>
          {(['JUSTIFICACION', 'RECLAMO', 'CONSULTA'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.typeBtn, tipo === t && styles.typeBtnActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setTipo(t);
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.typeBtnText, tipo === t && styles.typeBtnTextActive]}>
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Form Card */}
        <MotiView
          from={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 450, delay: 100 }}
          style={styles.card}
        >
          <Text style={styles.label}>Detalle de la Solicitud / Incidencia:</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Escribe aquí los motivos o la justificación detallada..."
            placeholderTextColor={theme.colors.textMuted}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            value={detalle}
            onChangeText={setDetalle}
          />

          <Text style={styles.label}>Correo o Teléfono de Contacto (Opcional):</Text>
          <View style={styles.inputContainer}>
            <Mail color={theme.colors.textMuted} size={18} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="contacto@ejemplo.com"
              placeholderTextColor={theme.colors.textMuted}
              value={contacto}
              onChangeText={setContacto}
            />
          </View>

          <TouchableOpacity
            style={styles.submitBtnWrapper}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={theme.colors.gradients.cyan}
              style={styles.submitBtn}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Send color="#FFF" size={18} />
                  <Text style={styles.submitBtnText}>ENVIAR A REVISIÓN</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </MotiView>
      </ScrollView>
    </KeyboardAvoidingView>
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
    typeSelectorRow: {
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
    typeBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
    },
    typeBtnActive: {
      backgroundColor: theme.colors.cyan,
    },
    typeBtnText: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.textMuted,
    },
    typeBtnTextActive: {
      color: '#FFF',
      fontWeight: '800',
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.glassBorder,
      borderWidth: 1,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.xl,
      ...theme.shadows.card,
    },
    label: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.sm,
      marginTop: theme.spacing.sm,
    },
    textArea: {
      backgroundColor: isDark ? theme.colors.surfaceHover : '#F8FAFC',
      borderColor: theme.colors.glassBorder,
      borderWidth: 1,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      color: theme.colors.textPrimary,
      fontSize: 14,
      minHeight: 120,
      marginBottom: theme.spacing.md,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? theme.colors.surfaceHover : '#F8FAFC',
      borderColor: theme.colors.glassBorder,
      borderWidth: 1,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: theme.spacing.md,
      height: 50,
      marginBottom: theme.spacing.xl,
    },
    inputIcon: {
      marginRight: theme.spacing.sm,
    },
    input: {
      flex: 1,
      color: theme.colors.textPrimary,
      fontSize: 14,
    },
    submitBtnWrapper: {
      borderRadius: theme.borderRadius.md,
      overflow: 'hidden',
      ...theme.shadows.glowPrimary,
    },
    submitBtn: {
      flexDirection: 'row',
      height: 52,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
    },
    submitBtnText: {
      color: '#FFF',
      fontSize: 14,
      fontWeight: '800',
      letterSpacing: 1,
    },
  });
