import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions } from 'react-native';
import DesignTokens from '../../constants/designTokens';

interface NotificationBannerProps {
  isVisible: boolean;
  message: string;
  onClose: () => void;
  duration?: number; // 자동 닫기 시간 (ms), 0이면 자동 닫기 안함
  type?: 'success' | 'info' | 'warning' | 'error';
  icon?: string; // 커스텀 아이콘
  containerStyle?: object; // 컨테이너 스타일 오버라이드
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  isVisible,
  message,
  onClose,
  duration = 3000,
  type = 'success',
  icon,
  containerStyle
}) => {
  const [slideAnim] = useState(new Animated.Value(-100));
  const [opacityAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (isVisible) {
      // 슬라이드 인 애니메이션
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // 자동 닫기 설정
      if (duration > 0) {
        const timer = setTimeout(() => {
          handleClose();
        }, duration);
        
        return () => clearTimeout(timer);
      }
    } else {
      // 슬라이드 아웃 애니메이션
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible, duration]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  if (!isVisible) {
    return null;
  }

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: DesignTokens.colors.accent,
          borderColor: DesignTokens.colors.text,
          iconColor: DesignTokens.colors.text,
          textColor: DesignTokens.colors.text
        };
      case 'info':
        return {
          backgroundColor: DesignTokens.colors.primary,
          borderColor: DesignTokens.colors.text,
          iconColor: DesignTokens.colors.background,
          textColor: DesignTokens.colors.background
        };
      case 'warning':
        return {
          backgroundColor: DesignTokens.colors.alert,
          borderColor: DesignTokens.colors.text,
          iconColor: DesignTokens.colors.text,
          textColor: DesignTokens.colors.text
        };
      case 'error':
        return {
          backgroundColor: DesignTokens.colors.alert,
          borderColor: DesignTokens.colors.text,
          iconColor: DesignTokens.colors.text,
          textColor: DesignTokens.colors.text
        };
      default:
        return {
          backgroundColor: DesignTokens.colors.accent,
          borderColor: DesignTokens.colors.text,
          iconColor: DesignTokens.colors.text,
          textColor: DesignTokens.colors.text
        };
    }
  };

  const typeStyles = getTypeStyles();

  return (
    <Animated.View
      style={[
        componentStyles.container,
        containerStyle, // 커스텀 스타일 오버라이드
        {
          backgroundColor: typeStyles.backgroundColor,
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.9], // 약간의 투명도 추가
          }),
        }
      ]}
    >
      <View style={componentStyles.content}>
        <View style={componentStyles.messageContainer}>
          <Text style={[componentStyles.icon, { color: typeStyles.iconColor }]}>{icon || '💾'}</Text>
          <Text style={[componentStyles.message, { color: typeStyles.textColor }]}>
            {message}
          </Text>
        </View>
        <TouchableOpacity onPress={handleClose} style={componentStyles.closeButton}>
          <Text style={[componentStyles.closeIcon, { color: typeStyles.textColor }]}>×</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const { width } = Dimensions.get('window');

const componentStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 52, // 헤더 높이(52px)만큼 아래로 이동
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: width,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 12,
  },
  message: {
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
    fontFamily: DesignTokens.fonts.default,
    textTransform: 'uppercase',
  },
  closeButton: {
    padding: 4,
  },
  closeIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: DesignTokens.fonts.default,
  },
});
