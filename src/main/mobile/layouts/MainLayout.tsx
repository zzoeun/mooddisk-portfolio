import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from './Header';
import TabBar, { TabType } from './TabBar';
import { useAuth } from '../context/AuthContext';
import { useUserInfo } from '../hooks/useQueries';
import DesignTokens from '../constants/designTokens';

interface HeaderState {
  title: string;
  showBackButton: boolean;
  isDetailMode: boolean;
  onBack?: () => void;
}

interface MainLayoutProps {
  children: (activeTab: TabType, setActiveTab: (tab: TabType) => void, challengeTimelineState: { challenge: any, onBack: () => void } | null, setChallengeTimelineState: (state: { challenge: any, onBack: () => void } | null) => void, headerState: HeaderState, setHeaderState: (state: HeaderState) => void, updateHeaderTitle: (nickname: string) => void) => React.ReactNode;
  initialTab?: TabType;
  hideTabBar?: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({ 
  children, 
  initialTab = 'diary',
  hideTabBar = false
}) => {
  const { user: authUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [challengeTimelineState, setChallengeTimelineState] = useState<{ challenge: any, onBack: () => void } | null>(null);
  const [userNickname, setUserNickname] = useState<string>('');
  const [headerState, setHeaderState] = useState<HeaderState>({
    title: '',
    showBackButton: false,
    isDetailMode: false,
  });

  // JWT 토큰에서 사용자 ID 추출
  const [userId, setUserId] = useState<string | null>(null);
  
  const parsedUserId = useMemo(() => {
    return userId ? parseInt(userId) : null;
  }, [userId]);

  // React Query로 사용자 정보 가져오기
  const { data: userInfo } = useUserInfo(parsedUserId);

  // AuthContext에서 직접 사용자 정보 가져오기 (JWT 디코딩 불필요)
  useEffect(() => {
    if (authUser?.id) {
      setUserId(authUser.id);
    }
  }, [authUser]);

  // 사용자 정보가 변경될 때마다 닉네임과 헤더 업데이트
  useEffect(() => {
    const updateNicknameAndHeader = async () => {
      try {
        // React Query에서 가져온 사용자 정보 우선 사용
        let finalNickname = '';
        
        if (userInfo) {
          // API 응답 구조에 맞게 닉네임 추출
          finalNickname = (userInfo as any)?.data?.data?.nickname || 
                         (userInfo as any)?.data?.nickname || 
                         userInfo?.nickname || '';
        }
        
        // React Query 데이터가 없으면 AuthContext에서 닉네임 사용
        if (!finalNickname) {
          finalNickname = authUser?.name || 'user';
        }
        
        setUserNickname(finalNickname);
        
        // 헤더 상태 업데이트
        setHeaderState(prev => ({
          ...prev,
          title: `${finalNickname}.disk`,
        }));
        
      } catch (error) {
        console.error('닉네임 업데이트 실패:', error);
        setUserNickname('user');
        setHeaderState(prev => ({
          ...prev,
          title: 'user.disk',
        }));
      }
    };

    updateNicknameAndHeader();
  }, [userInfo, authUser?.name]);

  // 탭별 헤더 제목 설정 함수 - 모든 탭에서 {닉네임}.disk로 통일
  const getTabHeaderTitle = (tab: TabType, nickname: string) => {
    return `${nickname}.disk`;
  };

  // 헤더 제목 업데이트 함수
  const updateHeaderTitle = (nickname: string) => {
    const newTitle = `${nickname}.disk`;
    setHeaderState(prev => ({
      ...prev,
      title: newTitle,
    }));
    setUserNickname(nickname);
  };

  // 탭 변경 시 헤더 업데이트 (상세 모드에서도 탭 변경 시 기본 헤더로 리셋)
  useEffect(() => {
    if (userNickname) {
      const tabTitle = getTabHeaderTitle(activeTab, userNickname);
      
      // 챌린지 타임라인 모드가 활성화되어 있으면 타임라인 상태도 함께 리셋
      if (challengeTimelineState) {
        setChallengeTimelineState(null);
      }
      
      setHeaderState({
        title: tabTitle,
        showBackButton: false,
        isDetailMode: false,
      });
    }
  }, [activeTab, userNickname, setChallengeTimelineState]);



  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor={DesignTokens.colors.background} />
      <Header 
        title={headerState.title || `${userNickname}.disk`}
        activeSection={activeTab}
        showBackButton={headerState.showBackButton}
        onBack={headerState.onBack}
        isDetailMode={headerState.isDetailMode}
      />
      
      <View style={styles.content}>
        {children(activeTab, setActiveTab, challengeTimelineState, setChallengeTimelineState, headerState, setHeaderState, updateHeaderTitle)}
      </View>
      
      {!hideTabBar && (
        <TabBar 
          activeTab={activeTab} 
          onTabPress={setActiveTab}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignTokens.colors.background,
  },
  content: {
    flex: 1,
    backgroundColor: DesignTokens.colors.cardBackground,
  },
});

export default MainLayout;
