import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TabType } from '../layouts';
import TabBar from '../layouts/TabBar';
import { LoadingOverlay } from '../components/common/loading';
import { useUserInfo } from '../hooks/useQueries';
import { useAuth } from '../context/AuthContext';
import { useDeviceInfo } from '../hooks/useDeviceInfo';
import { getMaxWidth } from '../utils/deviceUtils';
import DesignTokens from '../constants/designTokens';

// 탭 컴포넌트들을 직접 import (React Native에서는 dynamic import 지원 안함)
import DiaryScreen from './DiaryScreen';
import ChallengeScreen from './ChallengeScreen';
import DiskScreen from './DiskScreen';
import MyPageScreen from './MyPageScreen';

interface MainScreenProps {
  startTime?: number;
  updateHeaderTitle?: (nickname: string) => void;
}


// 로딩 컴포넌트
const TabLoadingFallback: React.FC = () => (
  <LoadingOverlay />
);

const MainScreen: React.FC<MainScreenProps> = ({ startTime, updateHeaderTitle }) => {
  const { user: authUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('diary');
  const [loadedTabs, setLoadedTabs] = useState<Set<TabType>>(new Set(['diary'] as TabType[])); // 첫 번째 탭은 미리 로드
  const [challengeTimelineState, setChallengeTimelineState] = useState<{ challenge: any, onBack: () => void } | null>(null);
  const [userNickname, setUserNickname] = useState<string>('');
  const [parsedUserId, setParsedUserId] = useState<string | null>(null);
  
  // 챌린지 상세페이지 상태 관리
  const [isChallengeDetail, setIsChallengeDetail] = useState(false);
  const [challengeData, setChallengeData] = useState<{ id: string; isJoined: boolean } | undefined>(undefined);
  
  // 일기 작성 모드 상태 관리
  const [isWritingMode, setIsWritingMode] = useState(false);
  
  // 챌린지와 함께 일기 작성하기 위한 상태
  const [initialChallengeIdx, setInitialChallengeIdx] = useState<number | undefined>(undefined);
  const [challengeFromTimeline, setChallengeFromTimeline] = useState<any | null>(null);
  const [showDiaryCompleteNotification, setShowDiaryCompleteNotification] = useState(false);
  
  // 실제 챌린지 참여 로직 저장
  const [actualJoinHandler, setActualJoinHandler] = useState<((challengeId: string) => void) | null>(null);
  
  // 디바이스 정보
  const { isTablet } = useDeviceInfo();
  
  // AuthContext에서 직접 사용자 ID 가져오기 (atob 사용 안함)
  const userId = authUser?.id;

  // AuthContext에서 직접 닉네임 가져오기 (atob 사용 안함)
  const authUserNickname = authUser?.name || '';

  // AuthContext에서 직접 사용자 정보 가져오기 (JWT 디코딩 불필요)
  useEffect(() => {
    if (authUser?.id) {
      setParsedUserId(authUser.id);
    }
  }, [authUser]);

  // React Query로 사용자 정보 캐시 - 중앙화된 훅 사용
  const { data: userInfo, isLoading: userInfoLoading } = useUserInfo(parsedUserId);

  // 사용자 닉네임 설정 (AuthContext 우선 사용)
  useEffect(() => {
    // 우선순위: API 닉네임 > authUser.name
    if (userInfo) {
      const nicknameFromApi = (userInfo as any)?.data?.data?.nickname || 
                               (userInfo as any)?.data?.nickname || 
                               userInfo?.nickname || '';
      if (nicknameFromApi) {
        setUserNickname(nicknameFromApi);
      }
    } else if (authUserNickname) {
      setUserNickname(authUserNickname);
    }
  }, [userInfo, authUserNickname]);

  // 사용자 닉네임 업데이트 함수
  const updateUserNickname = (nickname: string) => {
    setUserNickname(nickname);
  };


  // 챌린지 상세페이지 상태 변경 처리
  const handleChallengeDetailChange = useCallback((isDetail: boolean, challengeData?: { id: string; isJoined: boolean }) => {
    setIsChallengeDetail(isDetail);
    setChallengeData(challengeData);
  }, []);

  // 챌린지 참여 처리 - ChallengeScreen의 실제 참여 로직을 호출
  const handleJoinChallenge = useCallback((challengeId: string) => {
    if (actualJoinHandler) {
      actualJoinHandler(challengeId);
    } else {
    }
  }, [actualJoinHandler]);

  // ChallengeScreen에서 실제 참여 로직 등록
  const registerJoinHandler = useCallback((handler: (challengeId: string) => void) => {
    setActualJoinHandler(() => handler);
  }, []);

  // 탭 전환 시 로딩 상태 관리
  const handleTabPress = useCallback((tabId: TabType) => {
    if (!loadedTabs.has(tabId)) {
      setLoadedTabs(prev => new Set(prev).add(tabId));
    }
    
    // 디스크 탭으로 이동하면서 챌린지 타임라인 복원이 필요한 경우
    if (tabId === 'diskbook' && challengeFromTimeline) {
      const challenge = challengeFromTimeline;
      setChallengeFromTimeline(null);
      // 챌린지 타임라인 상태를 먼저 설정 (탭 전환 전)
      setChallengeTimelineState({
        challenge,
        onBack: () => {
          setChallengeTimelineState(null);
        }
      });
      // 알림 플래그는 onBackToDisk에서 showNotification 파라미터로 제어됨
    } else if (tabId !== 'diskbook') {
      // 디스크 탭이 아닌 다른 탭으로 이동 시 챌린지 타임라인 상태 리셋 (기본 디스크 탭으로 돌아가도록)
      setChallengeTimelineState(null);
    }
    
    // 다른 탭으로 이동 시 챌린지 상세페이지 상태 리셋
    if (tabId !== 'challenge') {
      setIsChallengeDetail(false);
      setChallengeData(undefined);
    }
    
    setActiveTab(tabId);
  }, [loadedTabs, challengeTimelineState, setChallengeTimelineState, challengeFromTimeline]);

  // 챌린지 타임라인에서 일기 작성 버튼 클릭 시 처리
  const handleWriteDiaryWithChallenge = useCallback((challenge: any) => {
    // 챌린지 정보 저장 (뒤로가기 시 타임라인으로 돌아가기 위해)
    setChallengeFromTimeline(challenge);
    // 챌린지 인덱스 설정 (challengeIdx 사용) - 탭 전환 전에 먼저 설정하여 타임라인 번쩍임 방지
    setInitialChallengeIdx(challenge.challengeIdx);
    // 일기 탭으로 이동 (React의 상태 업데이트는 배치 처리되므로 다음 렌더링에서 모두 반영됨)
    handleTabPress('diary');
    // 일기 작성 모드 활성화는 DiaryScreen에서 initialChallengeIdx를 받아서 처리
  }, [handleTabPress]);

  // 디스크 탭으로 이동했을 때 챌린지 타임라인 복원 (useEffect 제거 - handleTabPress에서 직접 처리)

  // 탭을 한 번 로드한 뒤에는 언마운트하지 않고 숨김 처리로 전환 속도 최적화
  const renderTabs = useMemo(() => {
    const isLoaded = (tab: TabType) => loadedTabs.has(tab);
    const hidden = (tab: TabType) => ({ display: activeTab === tab ? 'flex' : 'none', flex: 1 } as const);

    return (
      <>
        {/* Diary */}
        {isLoaded('diary') ? (
          <View style={hidden('diary')}>
            <DiaryScreen 
              userNickname={userNickname}
              activeTab={activeTab}
              onWritingModeChange={setIsWritingMode}
              initialChallengeIdx={initialChallengeIdx}
              onChallengeSelected={() => setInitialChallengeIdx(undefined)}
              onBackToDisk={(showNotification = false) => {
                setInitialChallengeIdx(undefined);
                // 일기 작성 완료 알림 표시 플래그 설정 (일기 작성 완료 시에만)
                if (showNotification) {
                  setShowDiaryCompleteNotification(true);
                }
                // 디스크 탭으로 이동 (challengeFromTimeline은 useEffect에서 처리)
                handleTabPress('diskbook');
              }}
              initialView={initialChallengeIdx !== undefined ? 'write' : 'calendar'}
            />
          </View>
        ) : activeTab === 'diary' ? (
          <TabLoadingFallback />
        ) : null}

        {/* Challenge */}
        {isLoaded('challenge') ? (
          <View style={hidden('challenge')}>
            <ChallengeScreen 
              userNickname={userNickname}
              activeTab={activeTab}
              onChallengeDetailChange={handleChallengeDetailChange}
              onJoinChallenge={handleJoinChallenge}
              onRegisterJoinHandler={registerJoinHandler}
            />
          </View>
        ) : activeTab === 'challenge' ? (
          <TabLoadingFallback />
        ) : null}

        {/* Diskbook */}
        {isLoaded('diskbook') ? (
          <View style={hidden('diskbook')}>
            <DiskScreen 
              challengeTimelineState={challengeTimelineState} 
              setChallengeTimelineState={setChallengeTimelineState} 
              userNickname={userNickname}
              activeTab={activeTab}
              onWriteDiaryWithChallenge={handleWriteDiaryWithChallenge}
              showDiaryCompleteNotification={showDiaryCompleteNotification}
              setShowDiaryCompleteNotification={setShowDiaryCompleteNotification}
            />
          </View>
        ) : activeTab === 'diskbook' ? (
          <TabLoadingFallback />
        ) : null}

        {/* MyPage */}
        {isLoaded('mypage') ? (
          <View style={hidden('mypage')}>
            <MyPageScreen 
              userNickname={userNickname}
              activeTab={activeTab}
              updateHeaderTitle={updateHeaderTitle}
              updateUserNickname={updateUserNickname}
            />
          </View>
        ) : activeTab === 'mypage' ? (
          <TabLoadingFallback />
        ) : null}
      </>
    );
  }, [activeTab, loadedTabs, challengeTimelineState, userNickname]);

  const dynamicStyles = getMainScreenStyles(isTablet);

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]}>
      <StatusBar style="dark" backgroundColor={DesignTokens.colors.background} />
      <View style={[styles.content, dynamicStyles.content]}>
        {renderTabs}
      </View>
      {!isWritingMode && (
        <TabBar 
          activeTab={activeTab} 
          onTabPress={handleTabPress}
          isChallengeDetail={isChallengeDetail}
          challengeData={challengeData}
          onJoinChallenge={challengeData ? handleJoinChallenge : undefined}
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
    backgroundColor: DesignTokens.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: DesignTokens.colors.background,
  },
});

// 반응형 MainScreen 스타일
const getMainScreenStyles = (isTablet: boolean) => StyleSheet.create({
  container: {
    paddingHorizontal: isTablet ? 40 : 0, // 모바일: 0, 태블릿: 40px padding
  },
  content: {
    maxWidth: isTablet ? getMaxWidth() : '100%',
    alignSelf: 'center',
    width: '100%',
  },
});


export default MainScreen;
