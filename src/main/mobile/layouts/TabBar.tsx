import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ViewStyle } from 'react-native';
import { DiaryIcon, ChallengeIcon, DiskbookIcon, MyPageIcon } from '../components/common/icons/MenuIcons';
import { useIsTablet } from '../hooks/useDeviceInfo';
import { responsiveValue, getMaxWidth } from '../utils/deviceUtils';
import DesignTokens from '../constants/designTokens';

export type TabType = 'diary' | 'challenge' | 'diskbook' | 'mypage';

interface Tab {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string; style?: any }>;
}

interface TabBarProps {
  activeTab: TabType;
  onTabPress: (tab: TabType) => void;
  // 챌린지 상세페이지 관련 props
  isChallengeDetail?: boolean;
  challengeData?: {
    id: string;
    isJoined: boolean;
  };
  onJoinChallenge?: (challengeId: string) => void;
}

const TabBar: React.FC<TabBarProps> = ({ 
  activeTab, 
  onTabPress, 
  isChallengeDetail = false, 
  challengeData, 
  onJoinChallenge 
}) => {
  const isTablet = useIsTablet();
  const tabs: Tab[] = useMemo(() => [
    { id: 'diary', label: '일기장', icon: DiaryIcon },
    { id: 'challenge', label: '로그', icon: ChallengeIcon },
    { id: 'diskbook', label: '디스크', icon: DiskbookIcon },
    { id: 'mypage', label: '내 정보', icon: MyPageIcon },
  ], []);

  const handleTabPress = useCallback((tabId: TabType) => {
    const startTime = Date.now();
    console.log(`🔄 Tab Switch: ${activeTab} → ${tabId} started`);
    onTabPress(tabId);
    // 탭 전환 완료는 각 화면에서 측정
  }, [activeTab, onTabPress]);

  const dynamicStyles = getTabBarStyles(isTablet, isChallengeDetail);
  const tabletStyles: ViewStyle | undefined = isTablet ? {
    paddingHorizontal: 40,
    maxWidth: getMaxWidth(),
    alignSelf: 'center',
    width: '100%' as ViewStyle['width'],
  } : undefined;

  return (
    <View style={[styles.tabBar, dynamicStyles.tabBar, tabletStyles]}>
      {isChallengeDetail && challengeData && onJoinChallenge ? (
        // 챌린지 상세페이지일 때 참여하기 버튼 표시
        <TouchableOpacity
          style={[
            styles.joinButton,
            challengeData.isJoined && styles.joinedButton
          ]}
          onPress={() => onJoinChallenge(challengeData.id)}
          disabled={challengeData.isJoined}
          activeOpacity={0.8}
        >
          <Text style={[
            styles.joinButtonText,
            challengeData.isJoined && styles.joinedButtonText
          ]}>
            {challengeData.isJoined ? '기록 중' : '시작하기'}
          </Text>
        </TouchableOpacity>
      ) : (
        // 일반 탭바 표시
        tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tabItem,
              dynamicStyles.tabItem,
              activeTab === tab.id && styles.tabItemActive
            ]}
            onPress={() => handleTabPress(tab.id)}
          >
            <tab.icon 
              size={isTablet ? 24 : 20}
              color={activeTab === tab.id ? DesignTokens.colors.secondary : DesignTokens.colors.gray}
              style={[
                styles.tabIcon,
                activeTab === tab.id && styles.tabIconActive
              ]}
            />
            <Text style={[
              styles.tabLabel,
              dynamicStyles.tabLabel,
              activeTab === tab.id && styles.tabLabelActive
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: DesignTokens.colors.background,
    paddingHorizontal: 0, // 동적 스타일에서 처리
    paddingTop: 6,
    paddingBottom: 0,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 0,
  },
  tabItemActive: {
    // 활성 탭 스타일은 아이콘과 라벨에서 처리
  },
  tabIcon: {
    marginBottom: 4,
    opacity: 0.6,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 12,
    color: DesignTokens.colors.gray,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: DesignTokens.colors.secondary,
    fontWeight: 'bold',
  },
  // 참여하기 버튼 스타일
  joinButton: {
    flex: 1,
    backgroundColor: DesignTokens.colors.accent,
    marginHorizontal: 20,
    marginVertical: 10,
    paddingVertical: 14,
    borderWidth: 3,
    borderColor: DesignTokens.colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinedButton: {
    backgroundColor: DesignTokens.colors.alert,
    borderColor: DesignTokens.colors.text,
  },
  joinButtonText: {
    color: DesignTokens.colors.text,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: DesignTokens.fonts.default,
    textTransform: 'uppercase',
  },
  joinedButtonText: {
    color: DesignTokens.colors.text,
  },
});

// 반응형 TabBar 스타일
const getTabBarStyles = (isTablet: boolean, isChallengeDetail: boolean) => StyleSheet.create({
  tabBar: {
    paddingHorizontal: 16, // 원래 padding 복구
    paddingTop: 6,
    // 챌린지 상세 전용 탭에서는 기존(iOS 기준) 설정 유지: iOS=0, Android는 소폭 축소(12)
    // 일반 탭에서는 이전 요청에 따라 0으로 유지
    paddingBottom: isChallengeDetail ? (Platform.OS === 'ios' ? 0 : 8) : 0,
    borderTopWidth: 0, // 선 제거
    borderTopColor: 'transparent',
  },
  tabItem: {
    paddingVertical: isTablet ? 8 : 0,
    marginHorizontal: isTablet ? 8 : 0,
  },
  tabLabel: {
    fontSize: isTablet ? 14 : 12,
  },
});

export default React.memo(TabBar);
