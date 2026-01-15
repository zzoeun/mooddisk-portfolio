import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import DesignTokens from '../../../constants/designTokens';

interface FABProps {
  onPress: () => void;
  icon: keyof typeof Feather.glyphMap;
  position?: 'bottom-right' | 'bottom-left';
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary';
}

export const FAB: React.FC<FABProps> = ({
  onPress,
  icon,
  position = 'bottom-right',
  size = 'md',
  color = 'primary',
}) => {
  const sizeStyles = {
    sm: { width: 40, height: 40 },
    md: { width: 56, height: 56 },
    lg: { width: 72, height: 72 },
  };

  const iconSizes = {
    sm: 20,
    md: 28,
    lg: 36,
  };

  const positionStyles = {
    'bottom-right': { bottom: 30, right: 30 }, // 하단 탭바 위로 올림
    'bottom-left': { bottom: 30, left: 30 },
  };

  const colorStyles = {
    primary: { backgroundColor: DesignTokens.colors.alert, borderWidth: 3, borderColor: DesignTokens.colors.text },
    secondary: { backgroundColor: DesignTokens.colors.accent, borderWidth: 3, borderColor: DesignTokens.colors.text },
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.container, 
        positionStyles[position], 
        sizeStyles[size],
        colorStyles[color]
      ]}
    >
      <Feather name={icon} size={iconSizes[size]} color={DesignTokens.colors.text} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
