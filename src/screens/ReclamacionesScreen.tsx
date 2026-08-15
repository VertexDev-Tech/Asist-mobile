import React, { useState } from 'react';
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
import { theme } from '../theme/theme';
import { reclamacionesApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FileText, Send, CheckCircle2 } from 'lucide-react-native';

const TIPOS_DOC = ['DNI', 'CE', 'Pasaporte'] as const;

export const ReclamacionesScreen = () => {
  const { user } = useAuth();
  const [tipo, setTipo] = useState<'reclamo' | 'queja'>('queja');
  const [nombreCompleto, setNombreCompleto] = useState(user?.full_name || '');
  const [tipoDocumento, setTipoDocumento] = useState<typeof TIPOS_DOC[number]>('DNI');
  const [numeroDocumento, setNumeroDocumento] = useState(user?.dni || '');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [descripcionServicio, setDescripcionServicio] = useState('');
  const [descripcionDetallada, setDescripcionDetallada] = useState('');
  const [pedidoConsumidor, setPedidoConsumidor] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [correlativo, setCorrelativo] = useState('');

  const handleSubmit = async () => {
    if (
      !nombreCompleto.trim() ||
      !numeroDocumento.trim() ||
      !email.trim() ||
      !descripcionServicio.trim() ||
      !descripcionDetallada.trim() ||
      !pedidoConsumidor.trim()
    ) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Campos requeridos', 'Completa nombre, documento, email, servicio, descripción y pedido.');
      return;
    }

    try {
      setIsSubmitting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const result = await reclamacionesApi.create({
        nombre_completo: nombreCompleto.trim(),
        tipo_documento: tipoDocumento,
        numero_documento: numeroDocumento.trim(),
        telefono: telefono.trim() || undefined,
        email: email.trim(),
        tipo,
        descripcion_servicio: descripcionServicio.trim(),
        descripcion_detallada: descripcionDetallada.trim(),
        pedido_consumidor: pedidoConsumidor.trim(),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCorrelativo(result?.numero_correlativo || '');
      setSent(true);
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'No se pudo registrar la reclamación. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (sent) {
    return (
      <View style={[styles.container, styles.successContainer]}>
        <CheckCircle2 color={theme.colors.emerald} size={56} />
        <Text style={styles.successTitle}>Reclamación registrada</Text>
        {correlativo ? <Text style={styles.successCorrelativo}>N° {correlativo}</Text> : null}
        <Text style={styles.successSubtitle}>
          Recibirás respuesta en máximo 30 días calendario, conforme a la Ley 29571.
        </Text>
        <TouchableOpacity
          style={styles.submitBtnWrapper}
          onPress={() => {
            setSent(false);
            setDescripcionServicio('');
            setDescripcionDetallada('');
            setPedidoConsumidor('');
          }}
        >
          <LinearGradient colors={theme.colors.gradients.cyan} style={styles.submitBtn}>
            <Text style={styles.submitBtnText}>REGISTRAR OTRA</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

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
          <Text style={styles.subtitle}>
            Conforme al Código de Protección y Defensa del Consumidor - Ley 29571
          </Text>
        </MotiView>

        {/* Tipo Selector */}
        <View style={styles.typeSelectorRow}>
          {(['queja', 'reclamo'] as const).map((t) => (
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
                {t.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <MotiView
          from={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 450, delay: 100 }}
          style={styles.card}
        >
          <Text style={styles.label}>Nombre completo</Text>
          <TextInput
            style={styles.input}
            placeholderTextColor={theme.colors.textMuted}
            value={nombreCompleto}
            onChangeText={setNombreCompleto}
          />

          <View style={styles.docRow}>
            <View style={styles.docTypeCol}>
              <Text style={styles.label}>Tipo doc.</Text>
              <View style={styles.docTypeSelector}>
                {TIPOS_DOC.map((td) => (
                  <TouchableOpacity
                    key={td}
                    style={[styles.docTypeBtn, tipoDocumento === td && styles.docTypeBtnActive]}
                    onPress={() => setTipoDocumento(td)}
                  >
                    <Text
                      style={[
                        styles.docTypeBtnText,
                        tipoDocumento === td && styles.docTypeBtnTextActive,
                      ]}
                    >
                      {td}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.docNumberCol}>
              <Text style={styles.label}>N° de documento</Text>
              <TextInput
                style={styles.input}
                placeholderTextColor={theme.colors.textMuted}
                value={numeroDocumento}
                onChangeText={setNumeroDocumento}
                keyboardType="number-pad"
              />
            </View>
          </View>

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="tucorreo@ejemplo.com"
            placeholderTextColor={theme.colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Teléfono (opcional)</Text>
          <TextInput
            style={styles.input}
            placeholderTextColor={theme.colors.textMuted}
            value={telefono}
            onChangeText={setTelefono}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Bien o servicio contratado</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Suscripción UBIX Control"
            placeholderTextColor={theme.colors.textMuted}
            value={descripcionServicio}
            onChangeText={setDescripcionServicio}
          />

          <Text style={styles.label}>Descripción detallada</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Describe los hechos con el mayor detalle posible..."
            placeholderTextColor={theme.colors.textMuted}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={descripcionDetallada}
            onChangeText={setDescripcionDetallada}
          />

          <Text style={styles.label}>Pedido del consumidor</Text>
          <TextInput
            style={styles.textArea}
            placeholder="¿Qué solicitas como solución?"
            placeholderTextColor={theme.colors.textMuted}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            value={pedidoConsumidor}
            onChangeText={setPedidoConsumidor}
          />

          <TouchableOpacity
            style={styles.submitBtnWrapper}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            <LinearGradient colors={theme.colors.gradients.cyan} style={styles.submitBtn}>
              {isSubmitting ? (
                <ActivityIndicator color="#050A14" />
              ) : (
                <>
                  <Send color="#050A14" size={18} />
                  <Text style={styles.submitBtnText}>ENVIAR RECLAMACIÓN</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </MotiView>
      </ScrollView>
    </KeyboardAvoidingView>
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
  successContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  successCorrelativo: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.cyan,
  },
  successSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
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
    marginBottom: theme.spacing.lg,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
  },
  typeBtnActive: {
    backgroundColor: theme.colors.cyan,
  },
  typeBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.textMuted,
  },
  typeBtnTextActive: {
    color: '#050A14',
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.glassBorder,
    borderWidth: 1,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    ...theme.shadows.card,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.glassBorder,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    height: 48,
    color: theme.colors.textPrimary,
    fontSize: 14,
    marginBottom: theme.spacing.md,
  },
  docRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  docTypeCol: {
    width: 130,
  },
  docNumberCol: {
    flex: 1,
  },
  docTypeSelector: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: theme.spacing.md,
  },
  docTypeBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.glassBorder,
    borderWidth: 1,
  },
  docTypeBtnActive: {
    backgroundColor: theme.colors.cyan,
    borderColor: theme.colors.cyan,
  },
  docTypeBtnText: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.colors.textMuted,
  },
  docTypeBtnTextActive: {
    color: '#050A14',
  },
  textArea: {
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.glassBorder,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    color: theme.colors.textPrimary,
    fontSize: 14,
    minHeight: 90,
    marginBottom: theme.spacing.md,
  },
  submitBtnWrapper: {
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    marginTop: theme.spacing.sm,
  },
  submitBtn: {
    height: 52,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: theme.spacing.lg,
  },
  submitBtnText: {
    color: '#050A14',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
