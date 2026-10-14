import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  PanResponder,
  useWindowDimensions,
} from 'react-native';
import { CyberWolfSprite, type CyberWolfPose } from './CyberWolfSprite';
import { X, Sparkles, ChevronRight, MessageSquare } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';

const ASSISTANT_TIPS = [
  '¡Hola! Soy Atlas, tu asistente inteligente de Asist-IO.',
  'Verifica que tu GPS esté calibrado antes de pulsar Marcar Entrada/Salida.',
  'La buena iluminación frontal acelera el reconocimiento facial de tu selfie.',
  'Si estás fuera de sede por visita a cliente, puedes ingresar una justificación directa.',
  'Consulta tu historial para revisar marcaciones y estado de aprobación.',
  'Recuerda marcar tu refrigerio si tu turno lo contempla.',
  'El módulo de solicitudes te permite gestionar permisos y descansos.',
  'Mantén tu sesión segura y tus datos biométricos actualizados.',
  '¡Excelente puntualidad hoy! Sigamos con el buen ritmo.',
];

interface WolfWidgetProps {
  isDark?: boolean;
  onPressCelebration?: boolean;
  onOpenDailyGreeting?: () => void;
}

export const WolfWidget: React.FC<WolfWidgetProps> = ({
  isDark = true,
  onPressCelebration = false,
  onOpenDailyGreeting,
}) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const [pose, setPose] = useState<CyberWolfPose>('idle');
  const [facing, setFacing] = useState<boolean>(false);

  const pan = useRef(
    new Animated.ValueXY({
      x: Math.max(16, screenWidth - 105),
      y: Math.max(80, screenHeight - 230),
    })
  ).current;

  // Reacción cuando se dispara una celebración
  useEffect(() => {
    if (onPressCelebration) {
      setPose('celebrating');
      setOpen(true);
      const timer = setTimeout(() => {
        setPose('idle');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [onPressCelebration]);

  // Micro-animaciones periódicas aleatorias de reposo
  useEffect(() => {
    const interval = setInterval(() => {
      if (!open && pose !== 'celebrating') {
        const poses: CyberWolfPose[] = ['idle', 'alert', 'idle'];
        const randomPose = poses[Math.floor(Math.random() * poses.length)];
        setPose(randomPose);
        setFacing(Math.random() > 0.5);
        setTimeout(() => setPose('idle'), 2500);
      }
    }, 11000);
    return () => clearInterval(interval);
  }, [open, pose]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value || 0,
          y: (pan.y as any)._value || 0,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: () => {
        pan.flattenOffset();
      },
    })
  ).current;

  const handleNextTip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTipIndex((prev) => (prev + 1) % ASSISTANT_TIPS.length);
  };

  const handleToggleOpen = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setOpen((prev) => !prev);
  };

  const currentPose: CyberWolfPose = open ? 'guide' : pose;

  return (
    <Animated.View
      style={[
        styles.widgetContainer,
        {
          transform: [{ translateX: pan.x }, { translateY: pan.y }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      {/* Burbuja de diálogo de Atlas */}
      {open && (
        <View
          style={[
            styles.bubble,
            {
              backgroundColor: isDark ? '#0B132B' : '#FFFFFF',
              borderColor: theme.colors.cyan,
            },
          ]}
        >
          <View style={styles.bubbleHeader}>
            <View style={styles.bubbleTitleRow}>
              <Sparkles size={14} color={theme.colors.cyan} />
              <Text style={[styles.bubbleTitle, { color: theme.colors.cyan }]}>
                Atlas Asistente
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setOpen(false)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={15} color={isDark ? '#94A3B8' : '#64748B'} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.bubbleText, { color: isDark ? '#F1F5F9' : '#1E293B' }]}>
            {ASSISTANT_TIPS[tipIndex]}
          </Text>

          <View style={styles.bubbleActionsRow}>
            <TouchableOpacity
              style={[
                styles.nextTipButton,
                { backgroundColor: isDark ? 'rgba(0, 245, 255, 0.15)' : '#E0F2FE' },
              ]}
              onPress={handleNextTip}
              activeOpacity={0.7}
            >
              <Text style={[styles.nextTipText, { color: theme.colors.cyan }]}>
                Otro consejo
              </Text>
              <ChevronRight size={13} color={theme.colors.cyan} />
            </TouchableOpacity>

            {onOpenDailyGreeting && (
              <TouchableOpacity
                style={[styles.greetingBtn, { backgroundColor: theme.colors.cyan }]}
                onPress={() => {
                  setOpen(false);
                  onOpenDailyGreeting();
                }}
                activeOpacity={0.7}
              >
                <MessageSquare size={12} color="#050A14" />
                <Text style={styles.greetingBtnText}>Saludo</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Mascota Cyber Wolf interactiva */}
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={handleToggleOpen}
        style={styles.mascotWrapper}
      >
        <CyberWolfSprite
          size={76}
          pose={currentPose}
          showAura
          floating={!open}
          flipHorizontal={facing}
        />
        <View
          style={[
            styles.badge,
            {
              backgroundColor: isDark ? 'rgba(11, 19, 43, 0.92)' : 'rgba(255, 255, 255, 0.95)',
              borderColor: theme.colors.cyan,
            },
          ]}
        >
          <Text style={[styles.badgeText, { color: theme.colors.cyan }]}>ATLAS</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  widgetContainer: {
    position: 'absolute',
    zIndex: 9999,
    alignItems: 'center',
  },
  bubble: {
    position: 'absolute',
    bottom: 98,
    right: -10,
    width: 230,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 12,
    shadowColor: '#00F5FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 12,
  },
  bubbleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  bubbleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  bubbleTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  bubbleText: {
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '500',
  },
  bubbleActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 6,
  },
  nextTipButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    gap: 2,
  },
  nextTipText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  greetingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 4,
  },
  greetingBtnText: {
    color: '#050A14',
    fontSize: 10.5,
    fontWeight: '800',
  },
  mascotWrapper: {
    alignItems: 'center',
    padding: 2,
  },
  badge: {
    marginTop: -4,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    shadowColor: '#00F5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeText: {
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 1,
  },
});

export default WolfWidget;
