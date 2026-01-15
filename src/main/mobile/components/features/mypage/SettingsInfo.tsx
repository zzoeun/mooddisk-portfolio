import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Linking } from 'react-native';
import Constants from 'expo-constants';
import DesignTokens from '../../../constants/designTokens';

interface SettingsInfoProps {}

export const SettingsInfo: React.FC<SettingsInfoProps> = () => {
  const appVersion = (Constants as any)?.expoConfig?.version || (Constants as any)?.manifest2?.extra?.version || (Constants as any)?.manifest?.extra?.version || '1.0.0';
  
  const clickableItems = [
    {
      title: '개인정보 처리방침',
      onPress: () => Linking.openURL('https://www.notion.so/Privacy-Policy-2837035cda4f8048b9cccbb5fbd46f58?source=copy_link')
    },
    {
      title: '서비스 이용약관',
      onPress: () => Linking.openURL('https://www.notion.so/2837035cda4f80afa969fe04828c58e3?source=copy_link')
    },
    {
      title: '오픈소스 라이브러리',
      onPress: () => Linking.openURL('https://www.notion.so/2957035cda4f80998b78cb5bf5e38fa3?source=copy_link')
    },
    {
      title: '의견 보내기',
      onPress: () => {
        const subject = encodeURIComponent('feedback.log');
        const body = encodeURIComponent('안녕하세요. mood.disk 개발자입니다.\n\n앱을 사용하며 느낀 생각이나 감정을 들려주세요.\n여러분의 이야기가 업데이트의 영감이 됩니다. 💾\n─────────────────────');
        Linking.openURL(`mailto:mooddisk.app@gmail.com?subject=${subject}&body=${body}`);
      }
    }
  ];
  
  const versionItem = {
    title: '버전 정보',
    version: appVersion
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>앱 정보</Text>
      <View style={styles.sectionContent}>
        {clickableItems.map((item, index) => (
          <TouchableOpacity 
            key={index}
            style={styles.settingItem}
            onPress={item.onPress}
          >
            <Text style={styles.settingItemText}>{item.title}</Text>
            <Text style={styles.settingItemArrow}>›</Text>
          </TouchableOpacity>
        ))}
        
        {/* 버전 정보는 별도로 렌더링 */}
        <View style={styles.settingItem}>
          <Text style={styles.settingItemText}>{versionItem.title}</Text>
          <Text style={styles.settingItemVersion}>{versionItem.version}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginHorizontal: DesignTokens.spacing.sectionPadding,
    backgroundColor: DesignTokens.colors.background,
    borderWidth: DesignTokens.borders.width,
    borderColor: DesignTokens.colors.border,
    padding: DesignTokens.spacing.sectionPadding,
  },
  sectionTitle: {
    ...DesignTokens.typography.sectionTitle,
    color: DesignTokens.colors.secondary,
    backgroundColor: DesignTokens.colors.sectionBackground,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: DesignTokens.spacing.sectionTitleMargin,
    alignSelf: "flex-start",
  },
  sectionContent: {
    backgroundColor: DesignTokens.colors.background,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: DesignTokens.colors.text,
  },
  settingItemText: {
    fontSize: 16,
    color: DesignTokens.colors.text,
    fontWeight: 'bold',
    fontFamily: DesignTokens.fonts.default,
    textTransform: 'uppercase',
  },
  settingItemArrow: {
    fontSize: 18,
    color: DesignTokens.colors.primary,
    fontWeight: 'bold',
    fontFamily: DesignTokens.fonts.default,
  },
  settingItemVersion: {
    fontSize: 14,
    color: DesignTokens.colors.primary,
    fontWeight: 'bold',
    fontFamily: DesignTokens.fonts.default,
  },
});
