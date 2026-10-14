import React, { useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { CyberWolfSprite } from './CyberWolfSprite';
import { Sparkles, X, ShieldCheck, Clock } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { secureStorage } from '../services/secureStorage';

const { width } = Dimensions.get('window');

const DAILY_QUOTES = [
  'Cada minuto cuenta para alcanzar tus metas de hoy.',
  'La puntualidad es el reflejo de tu compromiso y profesionalismo.',
  '¡Hoy es un gran día para dar lo mejor de ti!',
  'Recuerda registrar tu asistencia con buena iluminación facial.',
  'La constancia es la clave del éxito en cada jornada.',
  'Tu esfuerzo diario impulsa el crecimiento de todo el equipo.',
  'Organiza tu día y mantén tus turnos al día.',
];

interface DailyGreetingModalProps {
  visible: boolean;
  onClose: () => void;
  userName?: string;
}

export const DailyGreetingModal: React.FC<DailyGreetingModalProps> = ({
  visible,
  onClose,
  userName = 'Compañero',
}) => {
  const { theme, isDark } = useTheme();

  const greetingInfo = useMemo(() => {
    const hour = new Date().getHours();
    let timeGreeting = '¡Buenos días';
    let iconEmoji = '☀️';
    let subMessage = 'Iniciemos esta jornada con la mejor energía.';

    if (hour >= 12 && hour < 19) {
      timeGreeting = '¡Buenas tardes';
      iconEmoji = '🌤️';
      subMessage = 'Continuemos avanzando con éxito en el día.';
    } else if (hour >= 19 || hour < 6) {
      timeGreeting = '¡Buenas noches';
      iconEmoji = '🌙';
      subMessage = 'Excelente labor hoy, no olvides registrar tu salida.';
    }

    const dayIndex = new Date().getDay();
    const quote = DAILY_QUOTES[dayIndex % DAILY_QUOTES.length];

    return {
      title: `${timeGreeting}, ${userName.split(' ')[0]}! ${iconEmoji}`,
      subMessage,
      quote,
    };
  }, [userName]);

  const handleDismiss = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const todayStr = new Date().toISOString().split('T')[0];
    await secureStorage.saveLastDailyGreetingDate(todayStr);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleDismiss}>
      <View style={styles.overlay}>
        <MotiView
          from={{ opacity: 0, scale: 0.88, translateY: 20 }}
          animate={{ opacity: 1, scale: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 15 }}
          style={[
            styles.cardContainer,
            {
              backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
              borderColor: theme.colors.cyan,
            },
          ]}
        >
          {/* Close button */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={handleDismiss}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={20} color={isDark ? '#94A3B8' : '#64748B'} />
          </TouchableOpacity>

          {/* Header Cyber Badge */}
          <View style={styles.badgeRow}>
            <LinearGradient
              colors={['rgba(0, 245, 255, 0.25)', 'rgba(2, 132, 199, 0.15)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.badgeGradient}
            >
              <Sparkles size={13} color={theme.colors.cyan} />
              <Text style={[styles.badgeText, { color: theme.colors.cyan }]}>
                ATLAS • ASISTENTE ASIST-IO
              </Text>
            </LinearGradient>
          </View>

          {/* Cyber Wolf Mascot Display */}
          <View style={styles.mascotArea}>
            <CyberWolfSprite size={150} showAura floating pose="greeting" />
          </View>

          {/* Greeting Text Content */}
          <Text style={[styles.greetingTitle, { color: theme.colors.textPrimary }]}>
            {greetingInfo.title}
          </Text>

          <Text style={[styles.greetingSub, { color: theme.colors.textSecondary }]}>
            {greetingInfo.subMessage}
          </Text>

          {/* Daily Quote Box */}
          <View
            style={[
              styles.quoteBox,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F8FAFC',
                borderColor: isDark ? 'rgba(0, 245, 255, 0.25)' : 'rgba(2, 132, 199, 0.2)',
              },
            ]}
          >
            <Clock size={16} color={theme.colors.cyan} style={styles.quoteIcon} />
            <Text style={[styles.quoteText, { color: isDark ? '#E2E8F0' : '#334155' }]}>
              "{greetingInfo.quote}"
            </Text>
          </View>

          {/* Tips Pill */}
          <View style={styles.tipRow}>
            <ShieldCheck size={14} color="#10B981" />
            <Text style={[styles.tipText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              GPS activo y listo para marcación rápida
            </Text>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleDismiss}
            style={styles.actionBtn}
          >
            <LinearGradient
              colors={['#00F5FF', '#0284C7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.actionBtnGradient}
            >
              <Text style={styles.actionBtnText}>¡EMPEZAR MI JORNADA!</Text>
            </LinearGradient>
          </TouchableOpacity>
        </MotiView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 10, 20, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  cardContainer: {
    width: Math.min(width * 0.88, 360),
    borderRadius: 24,
    borderWidth: 1.5,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#00F5FF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 25,
    elevation: 20,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 6,
    zIndex: 10,
  },
  badgeRow: {
    marginBottom: 10,
  },
  badgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.4)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  mascotArea: {
    marginVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingTitle: {
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 4,
  },
  greetingSub: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 14,
  },
  quoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    width: '100%',
  },
  quoteIcon: {
    marginRight: 10,
  },
  quoteText: {
    flex: 1,
    fontSize: 11.5,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 18,
  },
  tipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actionBtn: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#00F5FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
  },
  actionBtnGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: '#050A14',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
});

export default DailyGreetingModal;
