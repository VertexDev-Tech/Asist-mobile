import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  TextInput,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from './ThemeContext';
import { Theme } from '../theme/theme';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  HelpCircle,
  KeyRound,
  Sparkles,
  X,
} from 'lucide-react-native';

export type AlertType = 'info' | 'success' | 'warning' | 'error' | 'confirm' | 'prompt';

export interface AlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

export interface AlertOptions {
  title: string;
  message?: string;
  type?: AlertType;
  buttons?: AlertButton[];
  // Prompt specific
  isPrompt?: boolean;
  promptPlaceholder?: string;
  promptInitialValue?: string;
  promptKeyboardType?: 'default' | 'number-pad' | 'numeric' | 'email-address';
  promptMaxLength?: number;
  onPromptSubmit?: (value: string) => void;
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => void;
  showSuccess: (title: string, message?: string, onOk?: () => void) => void;
  showError: (title: string, message?: string, onOk?: () => void) => void;
  showConfirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText?: string,
    isDestructive?: boolean,
  ) => void;
  showPrompt: (
    title: string,
    message: string,
    onSubmit: (value: string) => void,
    placeholder?: string,
    keyboardType?: 'default' | 'number-pad' | 'numeric',
  ) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const { theme, isDark } = useTheme();
  const [visible, setVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<AlertOptions | null>(null);
  const [promptInput, setPromptInput] = useState('');

  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const showAlert = (options: AlertOptions) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAlertConfig(options);
    if (options.isPrompt) {
      setPromptInput(options.promptInitialValue || '');
    }
    setVisible(true);
  };

  const showSuccess = (title: string, message?: string, onOk?: () => void) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showAlert({
      title,
      message,
      type: 'success',
      buttons: [{ text: 'Entendido', style: 'default', onPress: onOk }],
    });
  };

  const showError = (title: string, message?: string, onOk?: () => void) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    showAlert({
      title,
      message,
      type: 'error',
      buttons: [{ text: 'Cerrar', style: 'cancel', onPress: onOk }],
    });
  };

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText: string = 'Confirmar',
    isDestructive: boolean = false,
  ) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    showAlert({
      title,
      message,
      type: isDestructive ? 'warning' : 'confirm',
      buttons: [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: confirmText,
          style: isDestructive ? 'destructive' : 'default',
          onPress: onConfirm,
        },
      ],
    });
  };

  const showPrompt = (
    title: string,
    message: string,
    onSubmit: (value: string) => void,
    placeholder?: string,
    keyboardType: 'default' | 'number-pad' | 'numeric' = 'default',
  ) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    showAlert({
      title,
      message,
      type: 'prompt',
      isPrompt: true,
      promptPlaceholder: placeholder,
      promptKeyboardType: keyboardType,
      onPromptSubmit: onSubmit,
      buttons: [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Aceptar', style: 'default' },
      ],
    });
  };

  const hideAlert = () => {
    setVisible(false);
    setAlertConfig(null);
    setPromptInput('');
  };

  const handleButtonPress = (button: AlertButton) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (alertConfig?.isPrompt && button.style !== 'cancel') {
      if (alertConfig.onPromptSubmit) {
        alertConfig.onPromptSubmit(promptInput);
      }
    } else if (button.onPress) {
      button.onPress();
    }
    hideAlert();
  };

  const renderIcon = () => {
    const type = alertConfig?.type || 'info';
    switch (type) {
      case 'success':
        return (
          <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
            <CheckCircle2 color={theme.colors.emerald} size={32} />
          </View>
        );
      case 'warning':
        return (
          <View style={[styles.iconBox, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
            <AlertTriangle color={theme.colors.amber} size={32} />
          </View>
        );
      case 'error':
        return (
          <View style={[styles.iconBox, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
            <XCircle color={theme.colors.rose} size={32} />
          </View>
        );
      case 'prompt':
        return (
          <View style={[styles.iconBox, { backgroundColor: 'rgba(0, 212, 255, 0.15)' }]}>
            <KeyRound color={theme.colors.cyan} size={32} />
          </View>
        );
      case 'confirm':
        return (
          <View style={[styles.iconBox, { backgroundColor: 'rgba(0, 212, 255, 0.15)' }]}>
            <HelpCircle color={theme.colors.cyan} size={32} />
          </View>
        );
      default:
        return (
          <View style={[styles.iconBox, { backgroundColor: 'rgba(0, 212, 255, 0.15)' }]}>
            <Info color={theme.colors.cyan} size={32} />
          </View>
        );
    }
  };

  const defaultButtons: AlertButton[] = [{ text: 'Aceptar', style: 'default' }];
  const buttonsToRender = alertConfig?.buttons || defaultButtons;

  return (
    <AlertContext.Provider
      value={{
        showAlert,
        showSuccess,
        showError,
        showConfirm,
        showPrompt,
        hideAlert,
      }}
    >
      {children}

      <Modal visible={visible} transparent animationType="fade" onRequestClose={hideAlert}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.overlay}
        >
          <TouchableWithoutFeedback onPress={hideAlert}>
            <View style={styles.backdrop} />
          </TouchableWithoutFeedback>

          <MotiView
            from={{ opacity: 0, scale: 0.88, translateY: 15 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 18 }}
            style={styles.card}
          >
            {/* Top Glowing Ambient Line */}
            <View style={styles.topAmbientLine} />

            {/* Icon Header */}
            <View style={styles.iconContainer}>{renderIcon()}</View>

            {/* Title & Message */}
            <Text style={styles.title}>{alertConfig?.title}</Text>
            {!!alertConfig?.message && (
              <Text style={styles.message}>{alertConfig.message}</Text>
            )}

            {/* Optional Prompt Input */}
            {alertConfig?.isPrompt && (
              <TextInput
                style={styles.promptInput}
                placeholder={alertConfig.promptPlaceholder || 'Ingresa el valor...'}
                placeholderTextColor={theme.colors.textMuted}
                value={promptInput}
                onChangeText={setPromptInput}
                keyboardType={alertConfig.promptKeyboardType || 'default'}
                maxLength={alertConfig.promptMaxLength}
                autoFocus
              />
            )}

            {/* Buttons Row */}
            <View style={styles.buttonRow}>
              {buttonsToRender.map((btn, idx) => {
                const isCancel = btn.style === 'cancel';
                const isDestructive = btn.style === 'destructive';

                if (isCancel) {
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.btn, styles.cancelBtn]}
                      onPress={() => handleButtonPress(btn)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.cancelBtnText}>{btn.text}</Text>
                    </TouchableOpacity>
                  );
                }

                if (isDestructive) {
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.btn, styles.destructiveBtn]}
                      onPress={() => handleButtonPress(btn)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.destructiveBtnText}>{btn.text}</Text>
                    </TouchableOpacity>
                  );
                }

                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.btn, styles.primaryBtnWrapper]}
                    onPress={() => handleButtonPress(btn)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={theme.colors.gradients.cyan}
                      style={styles.primaryBtnGradient}
                    >
                      <Text style={styles.primaryBtnText}>{btn.text}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </View>
          </MotiView>
        </KeyboardAvoidingView>
      </Modal>
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

const createStyles = (theme: Theme, isDark: boolean) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.lg,
    },
    backdrop: {
      ...StyleSheet.absoluteFill,
    },
    card: {
      width: '100%',
      maxWidth: 360,
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.glassBorder,
      borderWidth: 1.5,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.xl,
      alignItems: 'center',
      overflow: 'hidden',
      ...theme.shadows.card,
    },
    topAmbientLine: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 3,
      backgroundColor: theme.colors.cyan,
    },
    iconContainer: {
      marginBottom: theme.spacing.md,
      marginTop: 4,
    },
    iconBox: {
      width: 64,
      height: 64,
      borderRadius: 32,
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      fontSize: 18,
      fontWeight: '900',
      color: theme.colors.textPrimary,
      textAlign: 'center',
      marginBottom: 6,
    },
    message: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 19,
      marginBottom: theme.spacing.lg,
      paddingHorizontal: 8,
    },
    promptInput: {
      width: '100%',
      backgroundColor: isDark ? theme.colors.surfaceHover : '#F8FAFC',
      borderColor: theme.colors.glassBorder,
      borderWidth: 1.5,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: theme.spacing.md,
      height: 48,
      color: theme.colors.textPrimary,
      fontSize: 15,
      fontWeight: '700',
      marginBottom: theme.spacing.lg,
      textAlign: 'center',
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 10,
      width: '100%',
      marginTop: 4,
    },
    btn: {
      flex: 1,
      height: 46,
      borderRadius: theme.borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cancelBtn: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
      borderWidth: 1,
      borderColor: theme.colors.glassBorder,
    },
    cancelBtnText: {
      color: theme.colors.textSecondary,
      fontSize: 13,
      fontWeight: '800',
    },
    destructiveBtn: {
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.18)' : 'rgba(239, 68, 68, 0.12)',
      borderWidth: 1.5,
      borderColor: theme.colors.rose,
    },
    destructiveBtnText: {
      color: theme.colors.rose,
      fontSize: 13,
      fontWeight: '900',
    },
    primaryBtnWrapper: {
      overflow: 'hidden',
      ...theme.shadows.glowPrimary,
    },
    primaryBtnGradient: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    primaryBtnText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '900',
      letterSpacing: 0.5,
    },
  });
