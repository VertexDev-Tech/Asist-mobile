import React, { useEffect, useRef } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Animated,
  Easing,
  StyleProp,
  ViewStyle,
  ImageSourcePropType,
} from 'react-native';

export type CyberWolfPose =
  | 'idle'
  | 'greeting'
  | 'alert'
  | 'celebrating'
  | 'guide'
  | 'running'
  | 'sleeping';

interface CyberWolfSpriteProps {
  size?: number;
  pose?: CyberWolfPose;
  showAura?: boolean;
  floating?: boolean;
  flipHorizontal?: boolean;
  style?: StyleProp<ViewStyle>;
}

const POSE_ASSETS: Record<string, ImageSourcePropType> = {
  idle: require('../../assets/mascot/cyberwolf.png'),
  greeting: require('../../assets/mascot/cyberwolf_greeting.png'),
  celebrating: require('../../assets/mascot/cyberwolf_celebrate.png'),
  alert: require('../../assets/mascot/cyberwolf_guide.png'),
  guide: require('../../assets/mascot/cyberwolf_guide.png'),
  running: require('../../assets/mascot/cyberwolf_celebrate.png'),
  sleeping: require('../../assets/mascot/cyberwolf.png'),
};

export const CyberWolfSprite: React.FC<CyberWolfSpriteProps> = ({
  size = 110,
  pose = 'idle',
  showAura = true,
  floating = true,
  flipHorizontal = false,
  style,
}) => {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const jumpAnim = useRef(new Animated.Value(0)).current;

  // Animación de respiración / flotación continua
  useEffect(() => {
    if (!floating) return;
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -6,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    floatLoop.start();
    return () => floatLoop.stop();
  }, [floating, floatAnim]);

  // Animación de pulso del aura cian
  useEffect(() => {
    if (!showAura) return;
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.95,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [showAura, pulseAnim]);

  // Reacción según la pose
  useEffect(() => {
    if (pose === 'celebrating' || pose === 'greeting') {
      const jumpLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(jumpAnim, {
            toValue: -12,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(jumpAnim, {
            toValue: 0,
            duration: 350,
            easing: Easing.bounce,
            useNativeDriver: true,
          }),
        ]),
        { iterations: 3 }
      );
      jumpLoop.start();
      return () => jumpLoop.stop();
    } else if (pose === 'alert' || pose === 'guide') {
      Animated.sequence([
        Animated.timing(jumpAnim, {
          toValue: -6,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(jumpAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [pose, jumpAnim]);

  const width = size;
  const height = size * 1.35;
  const imageSource = POSE_ASSETS[pose] || POSE_ASSETS.idle;

  return (
    <View style={[styles.container, { width, height }, style]}>
      {/* Halo y aura cibernética brillante */}
      {showAura && (
        <Animated.View
          style={[
            styles.auraCircle,
            {
              width: width * 1.05,
              height: width * 1.05,
              borderRadius: (width * 1.05) / 2,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />
      )}

      {/* Plataforma tecnológica en la base */}
      {showAura && (
        <View
          style={[
            styles.platformBase,
            {
              width: width * 0.75,
              bottom: 4,
            },
          ]}
        />
      )}

      {/* Imagen de Atlas Cyber Wolf según pose */}
      <Animated.View
        style={[
          styles.spriteWrapper,
          {
            transform: [
              { translateY: Animated.add(floatAnim, jumpAnim) },
              { scaleX: flipHorizontal ? -1 : 1 },
            ],
          },
        ]}
      >
        <Image
          source={imageSource}
          style={{
            width,
            height,
            resizeMode: 'contain',
          }}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  auraCircle: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 245, 255, 0.12)',
    borderColor: 'rgba(0, 245, 255, 0.35)',
    borderWidth: 1.5,
    shadowColor: '#00F5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 18,
    elevation: 8,
  },
  platformBase: {
    position: 'absolute',
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(0, 245, 255, 0.25)',
    borderWidth: 1,
    borderColor: '#00F5FF',
    shadowColor: '#00F5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
  },
  spriteWrapper: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CyberWolfSprite;
