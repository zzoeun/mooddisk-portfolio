import React from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { AppLogo } from '../components/common/brand/AppLogo';
import { useIsTablet } from '../hooks/useDeviceInfo';
import DesignTokens from '../constants/designTokens';

interface HeaderProps {
  title: string;
  activeSection?: string;
  isDetailMode?: boolean;
  onBack?: () => void;
  showBackButton?: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  title, 
  activeSection = 'diary',
  isDetailMode = false,
  onBack,
  showBackButton = false
}) => {
  const isTablet = useIsTablet();
  
  // HeaderMenu 컴포넌트 - 피그마 디자인에 맞춰 3색 아이콘
  const HeaderMenu = () => {
    return (
      <View style={styles.headerMenu}>
        {/* 청록색 아이콘 */}
        <View style={[styles.menuIcon, { backgroundColor: DesignTokens.colors.menuIcon1 }]} />
        {/* 보라색 아이콘 */}
        <View style={[styles.menuIcon, { backgroundColor: DesignTokens.colors.menuIcon2 }]} />
        {/* 빨간색 아이콘 */}
        <View style={[styles.menuIcon, { backgroundColor: DesignTokens.colors.menuIcon3 }]} />
      </View>
    );
  };


  return (
    <View style={styles.header}>
      <View style={[styles.headerContent, isTablet && styles.headerContentTablet]}>
        {/* 왼쪽 영역 - 로고와 텍스트 */}
        <View style={styles.leftSection}>
          {showBackButton ? (
            <TouchableOpacity 
              style={styles.backButton}
              onPress={onBack}
              hitSlop={{ top: 24, bottom: 24, left: 24, right: 24 }}
            >
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
          ) : (
            <AppLogo size="header" />
          )}
          
          <Text style={styles.headerTitle}>
            {title}
          </Text>
        </View>
        
        {/* 오른쪽 영역 - 헤더 메뉴 */}
        <View style={styles.rightSection}>
          <HeaderMenu />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: DesignTokens.colors.background,
    height: 52,
    minHeight: 52,
    paddingTop: Platform.OS === 'ios' ? 0 : 0, // 안드로이드에서도 paddingTop 제거
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, // 원래 padding 복구
    height: '100%',
  },
  headerContentTablet: {
    paddingHorizontal: 16, // 태블릿도 동일
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButton: {
    width: 24,
    height: 24,
    backgroundColor: DesignTokens.colors.secondary,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: DesignTokens.colors.background,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    ...Platform.select({
      ios: {
        lineHeight: 24,
      },
      android: {
        lineHeight: 20,
        includeFontPadding: false,
        marginTop: -1,
      },
    }),
  },
  headerTitle: {
    fontSize: 18,
    lineHeight: 21.78,
    fontFamily: DesignTokens.fonts.default,
    fontWeight: '700',
    color: DesignTokens.colors.secondary,
  },
  headerMenu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  menuIcon: {
    width: 8,
    height: 8,
    borderRadius: 1,
    borderWidth: 1,
    borderColor: DesignTokens.colors.headerBorder,
  },
});

export default Header;
