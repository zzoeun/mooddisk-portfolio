import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import DesignTokens from '../../../constants/designTokens';

interface AppLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'header';
  style?: any;
  onPress?: () => void;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 'md',
  style,
  onPress
}) => {
  const sizeMap = {
    xs: 16,
    sm: 28,
    md: 32,
    lg: 48,
    xl: 64,
    header: 24
  };

  const iconSize = sizeMap[size];

  const LogoComponent = () => (
    <Svg 
      width={iconSize} 
      height={iconSize} 
      viewBox="0 0 13 14"
      fill="none"
    >
      <Path 
        d="M10 0C11.6569 0 13 1.34315 13 3V10.8096C13 12.4664 11.6569 13.8096 10 13.8096H3C1.34315 13.8096 0 12.4664 0 10.8096V3C5.52114e-07 1.34315 1.34315 8.0532e-09 3 0H4V4H9V0H10Z" 
        fill={DesignTokens.colors.secondary}
      />
    </Svg>
  );

  if (onPress) {
    return (
      <TouchableOpacity 
        style={[styles.container, style]} 
        onPress={onPress}
        activeOpacity={0.8}
      >
        <LogoComponent />
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <LogoComponent />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

