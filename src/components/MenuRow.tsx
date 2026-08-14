import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { theme } from '../theme/theme';
import { ChevronRight } from 'lucide-react-native';

export interface MenuRowProps {
  title?: string;
  subtitle?: string;
  label?: string;
  value?: string;
  icon: React.ReactNode;
  onPress?: () => void;
  badge?: string;
  badgeColor?: string;
  delay?: number;
  last?: boolean;
}

export const MenuRow: React.FC<MenuRowProps> = ({
  title,
  subtitle,
  label,
  value,
  icon,
  onPress,
  badge,
  badgeColor = theme.colors.cyan,
  last = false,
}) => {
  const displayTitle = title || label || '';
  const displaySubtitle = subtitle || value || '';

  const content = (
    <View style={[styles.row, last && { borderBottomWidth: 0 }]}>
      <View style={styles.iconCircle}>{icon}</View>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{displayTitle}</Text>
        {displaySubtitle ? <Text style={styles.subtitle}>{displaySubtitle}</Text> : null}
      </View>
      {badge && (
        <View style={[styles.badge, { backgroundColor: `${badgeColor}18` }]}>
          <Text style={[styles.badgeText, { color: badgeColor }]}>{badge}</Text>
        </View>
      )}
      {onPress && <ChevronRight color={theme.colors.textMuted} size={18} />}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.full,
    marginRight: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
});
