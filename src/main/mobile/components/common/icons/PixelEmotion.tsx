import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface PixelEmotionProps {
  emotion: 'happy' | 'proud' | 'peaceful' | 'depressed' | 'annoyed' | 'furious';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
}

export const PixelEmotion: React.FC<PixelEmotionProps> = ({
  emotion,
  size = 'md',
  className = '',
  onClick
}) => {
  const sizeStyles = {
    sm: { width: 24, height: 24 },
    md: { width: 32, height: 32 },
    lg: { width: 48, height: 48 },
    xl: { width: 64, height: 64 },
  };

  const getEmotionColors = (emotion: string) => {
    switch (emotion) {
      case 'happy':
        return { bg: '#F472B6', border: '#DB2777' };
      case 'proud':
        return { bg: '#FBBF24', border: '#D97706' };
      case 'peaceful':
        return { bg: '#34D399', border: '#059669' };
      case 'depressed':
        return { bg: '#60A5FA', border: '#1D4ED8' };
      case 'annoyed':
        return { bg: '#9CA3AF', border: '#374151' };
      case 'furious':
        return { bg: '#8B5CF6', border: '#6D28D9' };
      default:
        return { bg: '#9CA3AF', border: '#6B7280' };
    }
  };

  const getEmotionPixels = (emotion: string) => {
    switch (emotion) {
      case 'happy':
        return (
          <Svg 
            width="100%" 
            height="100%" 
            viewBox="0 0 32 32" 
            fill="none"
          >
            <Path d="M6 0H12V2H14V4H18V2H20V0H26V2H28V4H30V6H32V12H30V16H28V20H26V22H24V24H22V26H20V28H18V30H16V28H14V26H12V24H10V22H8V20H6V18H4V16H2V12H0V6H2V4H4V2H6V0Z" fill="#FF4D88"/>
            <Path d="M2 20H4V24H2V20Z" fill="#FF4D88"/>
            <Path d="M30 20H32V24H30V20Z" fill="#FF4D88"/>
            <Path d="M4 24H6V26H4V24Z" fill="#FF4D88"/>
            <Path d="M28 24H30V26H28V24Z" fill="#FF4D88"/>
            <Path d="M0 26H2V28H0V26Z" fill="#FF4D88"/>
            <Path d="M6 26H10V28H6V26Z" fill="#FF4D88"/>
            <Path d="M24 26H28V28H24V26Z" fill="#FF4D88"/>
            <Path d="M2 28H4V30H2V28Z" fill="#FF4D88"/>
            <Path d="M30 28H32V30H30V28Z" fill="#FF4D88"/>
            <Path d="M4 30H8V32H4V30Z" fill="#FF4D88"/>
            <Path d="M26 30H30V32H26V30Z" fill="#FF4D88"/>
          </Svg>
        );
      
      case 'proud':
        return (
          <Svg 
            width="100%" 
            height="100%" 
            viewBox="0 0 32 32" 
            fill="none"
          >
            <Path d="M16 0H18V4H20V6H24V4H26V10H28V14H26V12H24V14H22V12H18V10H16V12H14V10H12V14H10V12H8V14H4V12H6V10H8V4H10V6H14V4H16V0Z" fill="#FFC927"/>
            <Path d="M6 2H8V4H6V2Z" fill="#FFC927"/>
            <Path d="M26 2H28V4H26V2Z" fill="#FFC927"/>
            <Path d="M2 14H4V18H2V14Z" fill="#FFC927"/>
            <Path d="M28 14H30V18H28V14Z" fill="#FFC927"/>
            <Path d="M8 16H12V20H8V16Z" fill="#FFC927"/>
            <Path d="M18 16H22V20H18V16Z" fill="#FFC927"/>
            <Path d="M0 18H2V26H0V18Z" fill="#FFC927"/>
            <Path d="M30 18H32V26H30V18Z" fill="#FFC927"/>
            <Path d="M4 20H6V22H4V20Z" fill="#FFC927"/>
            <Path d="M24 20H26V22H24V20Z" fill="#FFC927"/>
            <Path d="M8 22H10V24H8V22Z" fill="#FFC927"/>
            <Path d="M20 22H22V24H20V22Z" fill="#FFC927"/>
            <Path d="M10 24H20V26H10V24Z" fill="#FFC927"/>
            <Path d="M2 26H4V28H2V26Z" fill="#FFC927"/>
            <Path d="M28 26H30V28H28V26Z" fill="#FFC927"/>
            <Path d="M4 28H8V30H4V28Z" fill="#FFC927"/>
            <Path d="M24 28H28V30H24V28Z" fill="#FFC927"/>
            <Path d="M8 30H24V32H8V30Z" fill="#FFC927"/>
          </Svg>
        );
      
      case 'peaceful':
        return (
          <Svg 
            width="100%" 
            height="100%" 
            viewBox="0 0 32 32" 
            fill="none"
          >
            <Path d="M18 0H24V2H20V6H22V8H24V12H26V14H22V12H18V10H16V12H14V10H12V14H10V12H8V10H10V8H12V6H14V4H16V2H18V0Z" fill="#12B981"/>
            <Path d="M6 12H8V14H6V12Z" fill="#12B981"/>
            <Path d="M4 14H6V16H4V14Z" fill="#12B981"/>
            <Path d="M26 14H28V16H26V14Z" fill="#12B981"/>
            <Path d="M2 16H4V18H2V16Z" fill="#12B981"/>
            <Path d="M28 16H30V18H28V16Z" fill="#12B981"/>
            <Path d="M0 18H2V26H0V18Z" fill="#12B981"/>
            <Path d="M8 18H12V20H8V18Z" fill="#12B981"/>
            <Path d="M18 18H22V20H18V18Z" fill="#12B981"/>
            <Path d="M30 18H32V26H30V18Z" fill="#12B981"/>
            <Path d="M4 20H6V22H4V20Z" fill="#12B981"/>
            <Path d="M24 20H26V22H24V20Z" fill="#12B981"/>
            <Path d="M8 22H10V24H8V22Z" fill="#12B981"/>
            <Path d="M20 22H22V24H20V22Z" fill="#12B981"/>
            <Path d="M10 24H20V26H10V24Z" fill="#12B981"/>
            <Path d="M2 26H4V28H2V26Z" fill="#12B981"/>
            <Path d="M28 26H30V28H28V26Z" fill="#12B981"/>
            <Path d="M4 28H8V30H4V28Z" fill="#12B981"/>
            <Path d="M24 28H28V30H24V28Z" fill="#12B981"/>
            <Path d="M8 30H24V32H8V30Z" fill="#12B981"/>
          </Svg>
        );
      
      case 'depressed':
        return (
          <Svg 
            width="100%" 
            height="100%" 
            viewBox="0 0 32 32" 
            fill="none"
          >
            <Path d="M16 0H18V2H20V4H22V6H24V8H26V12H22V10H20V12H18V8H16V10H14V8H12V12H10V10H8V8H10V6H12V4H14V2H16V0Z" fill="#3C82F6"/>
            <Path d="M6 10H8V12H6V10Z" fill="#3C82F6"/>
            <Path d="M4 12H6V14H4V12Z" fill="#3C82F6"/>
            <Path d="M26 12H28V14H26V12Z" fill="#3C82F6"/>
            <Path d="M2 14H4V16H2V14Z" fill="#3C82F6"/>
            <Path d="M10 14H12V16H10V14Z" fill="#3C82F6"/>
            <Path d="M18 14H20V16H18V14Z" fill="#3C82F6"/>
            <Path d="M28 14H30V16H28V14Z" fill="#3C82F6"/>
            <Path d="M0 16H2V24H0V16Z" fill="#3C82F6"/>
            <Path d="M8 16H10V18H8V16Z" fill="#3C82F6"/>
            <Path d="M20 16H22V18H20V16Z" fill="#3C82F6"/>
            <Path d="M30 16H32V24H30V16Z" fill="#3C82F6"/>
            <Path d="M6 18H8V20H6V18Z" fill="#3C82F6"/>
            <Path d="M14 18H16V20H14V18Z" fill="#3C82F6"/>
            <Path d="M22 18H24V20H22V18Z" fill="#3C82F6"/>
            <Path d="M12 20H14V22H12V20Z" fill="#3C82F6"/>
            <Path d="M16 20H18V22H16V20Z" fill="#3C82F6"/>
            <Path d="M10 22H12V24H10V22Z" fill="#3C82F6"/>
            <Path d="M18 22H20V24H18V22Z" fill="#3C82F6"/>
            <Path d="M2 24H4V26H2V24Z" fill="#3C82F6"/>
            <Path d="M28 24H30V26H28V24Z" fill="#3C82F6"/>
            <Path d="M4 26H8V28H4V26Z" fill="#3C82F6"/>
            <Path d="M24 26H28V28H24V26Z" fill="#3C82F6"/>
            <Path d="M8 28H24V30H8V28Z" fill="#3C82F6"/>
          </Svg>
        );
      
      case 'annoyed':
        return (
          <Svg 
            width="100%" 
            height="100%" 
            viewBox="0 0 32 32" 
            fill="none"
          >
            <Path d="M16 0H18V4H20V6H22V8H24V10H26V14H22V12H20V14H18V10H16V12H14V10H12V14H10V12H8V10H10V8H12V6H14V4H16V0Z" fill="#000000"/>
            <Path d="M2 4H4V6H2V4Z" fill="#000000"/>
            <Path d="M30 4H32V6H30V4Z" fill="#000000"/>
            <Path d="M4 6H6V8H4V6Z" fill="#000000"/>
            <Path d="M28 6H30V8H28V6Z" fill="#000000"/>
            <Path d="M6 8H8V10H6V8Z" fill="#000000"/>
            <Path d="M26 8H28V10H26V8Z" fill="#000000"/>
            <Path d="M6 12H8V14H6V12Z" fill="#000000"/>
            <Path d="M4 14H6V16H4V14Z" fill="#000000"/>
            <Path d="M14 14H16V18H14V14Z" fill="#000000"/>
            <Path d="M26 14H28V16H26V14Z" fill="#000000"/>
            <Path d="M2 16H4V18H2V16Z" fill="#000000"/>
            <Path d="M6 16H8V18H6V16Z" fill="#000000"/>
            <Path d="M22 16H24V18H22V16Z" fill="#000000"/>
            <Path d="M28 16H30V18H28V16Z" fill="#000000"/>
            <Path d="M0 18H2V26H0V18Z" fill="#000000"/>
            <Path d="M8 18H12V20H8V18Z" fill="#000000"/>
            <Path d="M18 18H22V20H18V18Z" fill="#000000"/>
            <Path d="M30 18H32V26H30V18Z" fill="#000000"/>
            <Path d="M12 22H18V24H12V22Z" fill="#000000"/>
            <Path d="M10 24H12V26H10V24Z" fill="#000000"/>
            <Path d="M18 24H20V26H18V24Z" fill="#000000"/>
            <Path d="M2 26H4V28H2V26Z" fill="#000000"/>
            <Path d="M28 26H30V28H28V26Z" fill="#000000"/>
            <Path d="M4 28H8V30H4V28Z" fill="#000000"/>
            <Path d="M24 28H28V30H24V28Z" fill="#000000"/>
            <Path d="M8 30H24V32H8V30Z" fill="#000000"/>
          </Svg>
        );
      
      case 'furious':
        return (
          <Svg 
            width="100%" 
            height="100%" 
            viewBox="0 0 121 121" 
            fill="none"
          >
            <Path d="M0 0H7.5625V7.5625H0V0Z" fill="#642E8C"/>
            <Path d="M22.6875 0H30.25V7.5625H22.6875V0Z" fill="#642E8C"/>
            <Path d="M83.1875 0H90.75V15.125H83.1875V0Z" fill="#642E8C"/>
            <Path d="M7.5625 7.5625H15.125V15.125H7.5625V7.5625Z" fill="#642E8C"/>
            <Path d="M30.25 7.5625H37.8125V22.6875H30.25V7.5625Z" fill="#642E8C"/>
            <Path d="M45.375 7.5625H52.9375V15.125H60.5V22.6875H68.0625V30.25H75.625V52.9375H83.1875V45.375H90.75V52.9375H98.3125V68.0625H90.75V75.625H105.875V83.1875H113.438V105.875H105.875V113.438H90.75V121H22.6875V113.438H7.5625V105.875H0V90.75H7.5625V83.1875H22.6875V75.625H15.125V60.5H22.6875V52.9375H37.8125V45.375H30.25V37.8125H37.8125V30.25H45.375V7.5625Z" fill="#642E8C"/>
            <Path d="M0 15.125H7.5625V30.25H0V15.125Z" fill="#642E8C"/>
            <Path d="M90.75 15.125H98.3125V30.25H90.75V15.125Z" fill="#642E8C"/>
            <Path d="M22.6875 22.6875H30.25V30.25H22.6875V22.6875Z" fill="#642E8C"/>
            <Path d="M105.875 22.6875H113.438V37.8125H105.875V22.6875Z" fill="#642E8C"/>
            <Path d="M7.5625 30.25H15.125V37.8125H7.5625V30.25Z" fill="#642E8C"/>
            <Path d="M0 37.8125H7.5625V52.9375H0V37.8125Z" fill="#642E8C"/>
            <Path d="M98.3125 37.8125H105.875V45.375H98.3125V37.8125Z" fill="#642E8C"/>
            <Path d="M105.875 45.375H113.438V52.9375H105.875V45.375Z" fill="#642E8C"/>
            <Path d="M37.8125 68.0625H45.375V75.625H37.8125V68.0625Z" fill="white"/>
            <Path d="M60.5 68.0625H68.0625V75.625H60.5V68.0625Z" fill="white"/>
            <Path d="M37.8125 98.3125H68.0625V105.875H37.8125V98.3125Z" fill="white"/>
          </Svg>
        );
      
      default:
        return null;
    }
  };

  if (onClick) {
    return (
      <TouchableOpacity
        style={[
          styles.container,
          sizeStyles[size],
        ]}
        onPress={onClick}
      >
        {getEmotionPixels(emotion)}
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={[
        styles.container,
        sizeStyles[size],
      ]}
    >
      {getEmotionPixels(emotion)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
