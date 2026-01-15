import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import DesignTokens from '../../../constants/designTokens';

interface ActionButtonProps {
  icon: keyof typeof Feather.glyphMap;
  text: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  badge?: string | number;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  text,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  style,
  badge,
}) => {
  const variantStyles = styles[variant];
  const sizeStyles = styles[size];
  const iconSize = iconSizes[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        variantStyles,
        sizeStyles,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Feather name={icon} size={iconSize} color={variantStyles.color} />
      <Text style={[styles.text, { color: variantStyles.color }]}>{text}</Text>
      {badge && (
        <Text style={[styles.badge, { color: variantStyles.color }]}>
          ({badge})
        </Text>
      )}
    </TouchableOpacity>
  );
};

const iconSizes = {
  sm: 12,
  md: 16,
  lg: 20,
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  text: {
    fontWeight: '500',
  },
  badge: {
    marginLeft: 'auto',
    fontSize: 12,
    fontWeight: '500',
  },
  disabled: {
    opacity: 0.5,
  },
  primary: {
    color: DesignTokens.colors.primary,
    borderColor: 'transparent',
  },
  secondary: {
    color: DesignTokens.colors.primary,
    borderColor: 'transparent',
  },
  success: {
    backgroundColor: DesignTokens.colors.sectionBackground,
    color: DesignTokens.colors.emotionPeaceful,
    borderColor: DesignTokens.colors.emotionPeaceful,
  },
  danger: {
    backgroundColor: DesignTokens.colors.sectionBackground,
    color: DesignTokens.colors.alert,
    borderColor: DesignTokens.colors.alert,
  },
  warning: {
    backgroundColor: DesignTokens.colors.sectionBackground,
    color: DesignTokens.colors.emotionProud,
    borderColor: DesignTokens.colors.emotionProud,
  },
  sm: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 12,
  },
  md: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
  },
  lg: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    fontSize: 16,
  },
});
