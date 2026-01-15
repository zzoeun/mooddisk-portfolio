import React, { useEffect, useMemo, useState, useRef } from 'react';
import { View, Text, FlatList } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getMyChallenges, getDiariesByChallenge } from '@mooddisk/api';
import { ChallengeEntry, MyChallengeEntry } from '@mooddisk/types';
// import { ChallengeDiaryResponse } from '@mooddisk/types/api/challenge';
import { 
  ActiveChallengeCard,
  CompletedChallengeCard,
  UpcomingChallengeCard,
  challengeStyles
} from '../components/features/disk';
import EmotionBitmap from '../components/features/disk/EmotionBitmap';
import {
  getChallengePeriodInfo, 
  getChallengeProgress,
  getActiveChallenges,
  getCompletedChallenges,
  getUpcomingChallenges,
  getTotalDiaries
} from '../utils';
import ChallengeTimelineScreen from '../components/features/disk/ChallengeTimeline';
import Header from '../layouts/Header';
import { LoadingOverlay } from '../components/common/loading/LoadingOverlay';
import { useQuery, useQueries, useQueryClient } from '@tanstack/react-query';
import { useDiaryYear } from '../hooks/useQueries';
import DesignTokens from '../constants/designTokens';
import { useIsTablet } from '../hooks/useDeviceInfo';
import { NotificationBanner } from '../components/common/NotificationBanner';
import { ChallengeCompletionModal } from '../components/features/challenge/ChallengeCompletionModal';

interface DiskScreenProps {
  challengeTimelineState: { challenge: any, onBack: () => void } | null;
  setChallengeTimelineState: (state: { challenge: any, onBack: () => void } | null) => void;
  userNickname: string;
  activeTab?: string; // 현재 활성 탭
  onWriteDiaryWithChallenge?: (challenge: MyChallengeEntry) => void;
  showDiaryCompleteNotification?: boolean; // 일기 작성 완료 알림 표시 여부
  setShowDiaryCompleteNotification?: (show: boolean) => void; // 일기 작성 완료 알림 표시 여부 설정
}

const DiskScreen: React.FC<DiskScreenProps> = ({ challengeTimelineState, setChallengeTimelineState, userNickname, activeTab, onWriteDiaryWithChallenge, showDiaryCompleteNotification, setShowDiaryCompleteNotification }) => {
  const { user: authUser } = useAuth();
  const isTablet = useIsTablet();
  const queryClient = useQueryClient();
  
  // 이전 날짜 추적용 ref
  const previousDateRef = useRef<string | null>(null);
  
  // 헤더 상태를 useMemo로 계산하여 번쩍임 방지
  const headerState = useMemo(() => {
    if (challengeTimelineState) {
      const challenge = challengeTimelineState.challenge;
      // 트래블로그인 경우 {logName}.LOG 형태로 표시
      if (challenge.type === 'TRAVEL' && challenge.logName) {
        return {
          title: `${challenge.logName}.LOG`,
          showBackButton: true,
        };
      }
      // 일반 챌린지는 기존대로 title 사용
      return {
        title: challenge.title,
        showBackButton: true,
      };
    }
    return {
      title: `${userNickname || 'user'}.disk`,
      showBackButton: false,
    };
  }, [challengeTimelineState, userNickname]);

  const headerTitle = headerState.title;
  const showBackButton = headerState.showBackButton;

  // 알림 배너 상태
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'info' | 'warning' | 'error'>('success');
  const notificationTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // 챌린지 완료 모달 상태
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completedChallenge, setCompletedChallenge] = useState<MyChallengeEntry | null>(null);
  const challengeCheckTimerRef = useRef<NodeJS.Timeout | null>(null);
  // 이전 챌린지 상태를 추적하여 상태 변경 시에만 모달 표시 (일기 탭과 동일)
  const previousChallengeStatusRef = useRef<string | null>(null);
  const previousChallengeIdxRef = useRef<number | null>(null);

  // 챌린지 완료 상태 확인 함수 (일기 탭과 동일한 로직)
  const checkChallengeCompletion = async (challengeIdx?: number): Promise<boolean> => {
    if (!challengeIdx) return false;
    
    try {
      const challenges = await getMyChallenges();
      const targetChallenge = challenges.find((c: any) => c.challengeIdx === challengeIdx);
      
      if (targetChallenge) {
        const currentStatus = targetChallenge.status;
        const previousStatus = previousChallengeStatusRef.current;
        
        // 상태가 변경되었고, 현재 상태가 COMPLETED 또는 FAILED인 경우에만 모달 표시
        if (previousStatus !== currentStatus && (currentStatus === 'COMPLETED' || currentStatus === 'FAILED')) {
          setCompletedChallenge(targetChallenge as unknown as MyChallengeEntry);
          setShowCompletionModal(true);
          // 현재 상태를 이전 상태로 저장
          previousChallengeStatusRef.current = currentStatus;
          return true; // 모달이 표시됨
        }
        
        // 현재 상태를 이전 상태로 저장 (상태 변경이 없어도)
        previousChallengeStatusRef.current = currentStatus;
      }
      return false; // 모달이 표시되지 않음
    } catch (error) {
      console.error('챌린지 완료 상태 확인 실패:', error);
      return false;
    }
  };

  // 일기 작성 완료 알림 표시 및 챌린지 완료 확인 (챌린지 타임라인으로 돌아온 경우)
  useEffect(() => {
    if (showDiaryCompleteNotification && challengeTimelineState && activeTab === 'diskbook') {
      // 챌린지 타임라인으로 돌아온 경우 알림 배너 표시
      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
        notificationTimerRef.current = null;
      }
      setNotificationMessage("기록이 완료되었습니다.");
      setNotificationType('success');
      setShowNotification(true);
      
      // 알림 표시 플래그 리셋
      setShowDiaryCompleteNotification?.(false);
      
      // 3초 후 자동으로 알림 닫기
      notificationTimerRef.current = setTimeout(() => {
        setShowNotification(false);
        notificationTimerRef.current = null;
      }, 3000);
      
      // 챌린지 완료 상태 확인 (일기 탭과 동일한 로직 - 상태 변경 시에만 모달 표시)
      const challengeIdx = challengeTimelineState.challenge.challengeIdx;
      
      // 약간의 지연 후 챌린지 상태 확인 (백엔드 처리 시간 고려)
      if (challengeCheckTimerRef.current) {
        clearTimeout(challengeCheckTimerRef.current);
      }
      challengeCheckTimerRef.current = setTimeout(async () => {
        await checkChallengeCompletion(challengeIdx);
        challengeCheckTimerRef.current = null;
      }, 1000);
    }
  }, [showDiaryCompleteNotification, challengeTimelineState, activeTab, setShowDiaryCompleteNotification]);

  // 챌린지 타임라인 상태가 변경될 때 이전 상태 및 모달 상태 초기화 (새로운 챌린지로 전환 시)
  useEffect(() => {
    if (challengeTimelineState) {
      // 새로운 챌린지로 전환될 때 이전 상태 초기화
      const currentChallengeIdx = challengeTimelineState.challenge.challengeIdx;
      
      if (previousChallengeIdxRef.current !== currentChallengeIdx) {
        // 다른 챌린지로 전환되었을 때 모달 상태 및 타이머 초기화
        if (challengeCheckTimerRef.current) {
          clearTimeout(challengeCheckTimerRef.current);
          challengeCheckTimerRef.current = null;
        }
        setShowCompletionModal(false);
        setCompletedChallenge(null);
        previousChallengeStatusRef.current = null;
        previousChallengeIdxRef.current = currentChallengeIdx;
      }
    } else {
      // 챌린지 타임라인 상태가 없을 때 초기화
      if (challengeCheckTimerRef.current) {
        clearTimeout(challengeCheckTimerRef.current);
        challengeCheckTimerRef.current = null;
      }
      setShowCompletionModal(false);
      setCompletedChallenge(null);
      previousChallengeStatusRef.current = null;
      previousChallengeIdxRef.current = null;
    }
  }, [challengeTimelineState]);

  // activeTab이 변경될 때 알림 배너만 초기화 (챌린지 타임라인 상태는 유지)
  useEffect(() => {
    if (activeTab !== 'diskbook') {
      // 알림 배너만 초기화 (챌린지 타임라인 상태는 유지하여 다시 돌아왔을 때 표시)
      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
        notificationTimerRef.current = null;
      }
      setShowNotification(false);
    }
  }, [activeTab]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
        notificationTimerRef.current = null;
      }
      if (challengeCheckTimerRef.current) {
        clearTimeout(challengeCheckTimerRef.current);
        challengeCheckTimerRef.current = null;
      }
    };
  }, []);

  // 탭 포커스/재진입 시 날짜 체크 및 쿼리 무효화
  useEffect(() => {
    if (activeTab === 'diskbook') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD 형식
      
      const previousDate = previousDateRef.current;
      
      // 날짜가 변경되었으면 쿼리 무효화
      if (previousDate && previousDate !== todayStr) {
        console.log('📅 날짜 변경 감지: 챌린지 쿼리 무효화', { previousDate, todayStr });
        queryClient.invalidateQueries({ queryKey: ['myChallenges'] });
        queryClient.invalidateQueries({ queryKey: ['challengeDiaries'], exact: false });
      }
      
      // 현재 날짜를 이전 날짜로 저장
      previousDateRef.current = todayStr;
    }
  }, [activeTab, queryClient]);

  // 내 챌린지 목록 쿼리 - 전역 5분 캐시 사용
  const { data: myChallengesData, isLoading: myChallengesLoading } = useQuery({
    queryKey: ['myChallenges'],
    queryFn: async () => (await getMyChallenges()) as unknown as MyChallengeEntry[],
  });
  const challenges = (myChallengesData || []) as MyChallengeEntry[];

  // 참여 챌린지별 일기 병렬 쿼리 (참여중/완료 모두) - 전역 5분 캐시 사용
  const diaryQueries = useQueries({
    queries: (challenges || []).map((c) => ({
      queryKey: ['challengeDiaries', c.participationIdx],
      queryFn: async () => await getDiariesByChallenge(c.participationIdx),
    })),
  });
  const challengeDiaries = useMemo(() => {
    const map: Record<number, any[]> = {};
    (challenges || []).forEach((c, idx) => {
      map[c.participationIdx] = (diaryQueries[idx]?.data as any[]) || [];
    });
    return map;
  }, [challenges, diaryQueries]);

  // 감정 비트맵 데이터 쿼리 - 통합 로딩 관리
  // 비트맵은 "오늘부터 과거 1년"을 표시하므로 현재 년도와 이전 년도 모두 조회
  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;
  const { data: currentYearDiaries = [], isLoading: currentYearLoading } = useDiaryYear(currentYear);
  const { data: previousYearDiaries = [], isLoading: previousYearLoading } = useDiaryYear(previousYear);
  
  // 두 년도 데이터 합치기
  const yearDiaries = useMemo(() => {
    return [...previousYearDiaries, ...currentYearDiaries];
  }, [previousYearDiaries, currentYearDiaries]);
  
  const bitmapLoading = currentYearLoading || previousYearLoading;

  // 통합 로딩 상태 - 모든 쿼리 중 하나라도 로딩 중이면 표시
  const isDiaryQueriesLoading = diaryQueries.some(query => query.isLoading);
  const isLoading = myChallengesLoading || isDiaryQueriesLoading || bitmapLoading;

  // 성능 측정: 탭 활성화 시점
  useEffect(() => {
    console.log(`🔄 Tab Switch: ${activeTab} → diskbook completed`);
    console.log('💾 Disk Tab Load started');
  }, [activeTab]);

  // React Query가 로드/캐시 관리

  // 탭 변경 시 상태 리셋 (다른 탭에서 디스크 탭으로 돌아올 때)
  // 주의: 챌린지 타임라인에서 일기 작성 후 돌아올 때는 challengeTimelineState를 유지해야 하므로
  // 이 useEffect는 제거하거나 조건을 수정해야 함

  // 성능 측정: 데이터 로딩 완료 시점
  useEffect(() => {
    if (!isLoading) {
      console.log('💾 Disk Tab Load completed');
    }
  }, [isLoading]);


  const totalDiaries = useMemo(() => getTotalDiaries(challengeDiaries), [challengeDiaries]);
  const completedChallenges = useMemo(() => getCompletedChallenges(challenges), [challenges]);
  const activeChallenges = useMemo(() => {
    // 활성 로그는 현재 진행 중인 것만 (미래 로그 제외)
    const allActive = getActiveChallenges(challenges);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    return allActive.filter((c) => {
      // TRAVEL 로그의 경우 출발일이 오늘 이전이거나 오늘인 것만
      if (c.type === "TRAVEL" && c.startedAt) {
        const startDate = new Date(c.startedAt);
        startDate.setHours(0, 0, 0, 0);
        return startDate <= now;
      }
      // 일반 로그는 모두 포함
      return true;
    });
  }, [challenges]);
  const upcomingChallenges = useMemo(() => getUpcomingChallenges(challenges), [challenges]);

  // 챌린지 타임라인 모드로 전환하는 공통 함수
  const handleChallengePress = (challenge: MyChallengeEntry) => {
    // 모든 챌린지는 타임라인으로 이동 (다가오는 로그도 포함)
    // ChallengeTimelineScreen에서 다가오는 로그인지 확인하여 안내 메시지 표시
    setChallengeTimelineState({
      challenge,
      onBack: () => {
        setChallengeTimelineState(null);
        // 헤더 상태는 useMemo에서 자동으로 업데이트됨
      }
    });
  };

  // 타임라인 화면이 선택된 경우
  if (challengeTimelineState) {
    return (
      <View style={{ flex: 1 }}>
        <Header 
          title={headerTitle}
          activeSection="diskbook"
          isDetailMode={true}
          showBackButton={showBackButton}
          onBack={challengeTimelineState.onBack}
        />
        {/* 알림 배너 */}
        <NotificationBanner
          isVisible={showNotification}
          message={notificationMessage}
          onClose={() => {
            setShowNotification(false);
            if (notificationTimerRef.current) {
              clearTimeout(notificationTimerRef.current);
              notificationTimerRef.current = null;
            }
          }}
          type={notificationType}
          duration={3000}
          icon={notificationType === 'success' ? '💾' : '💾'}
        />
        <ChallengeTimelineScreen
          challenge={challengeTimelineState.challenge}
          onBack={challengeTimelineState.onBack}
          onWriteDiary={onWriteDiaryWithChallenge}
        />
        {/* 챌린지 완료 모달 */}
        <ChallengeCompletionModal
          visible={showCompletionModal}
          challenge={completedChallenge}
          onClose={() => {
            setShowCompletionModal(false);
            setCompletedChallenge(null);
          }}
        />
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1 }}>
        <Header 
          title={headerTitle}
          activeSection="diskbook"
          isDetailMode={false}
          showBackButton={showBackButton}
        />
        <LoadingOverlay />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Header 
        title={headerTitle}
        activeSection="diskbook"
        isDetailMode={false}
        showBackButton={showBackButton}
      />
      <FlatList
        style={challengeStyles.container}
        data={[]}
        keyExtractor={() => ''}
        renderItem={() => null}
        ListHeaderComponent={(
          <View>
            {/* 감정 비트맵 섹션 */}
            <View style={challengeStyles.section}>
              <Text style={[challengeStyles.sectionTitle, isTablet && { fontSize: 18, paddingHorizontal: 16, paddingVertical: 8 }]}>감정 비트맵</Text>
              <EmotionBitmap yearDiaries={yearDiaries} />
            </View>

            {/* 진행중인 챌린지들 - 스탬프 형식 */}
            <View style={challengeStyles.section}>
              <Text style={[challengeStyles.sectionTitle, isTablet && { fontSize: 18, paddingHorizontal: 16, paddingVertical: 8 }]}>활성 로그</Text>
              {activeChallenges.length > 0 ? (
                activeChallenges.map((challenge) => {
                  const periodInfo = getChallengePeriodInfo(challenge);
                  const progress = getChallengeProgress(challenge, challengeDiaries);
                  
                  return (
                    <ActiveChallengeCard
                      key={challenge.participationIdx}
                      challenge={challenge}
                      progress={progress}
                      periodInfo={periodInfo}
                      onPress={() => handleChallengePress(challenge)}
                    />
                  );
                })
              ) : (
                <View style={challengeStyles.emptyState}>
                  <Text style={challengeStyles.emptyText}>진행중인 로그가 없습니다</Text>
                </View>
              )}
            </View>

            {/* 다가오는 로그 섹션 (미래 TRAVEL 로그) */}
            {upcomingChallenges.length > 0 && (
              <View style={challengeStyles.section}>
                <Text style={[challengeStyles.sectionTitle, isTablet && { fontSize: 18, paddingHorizontal: 16, paddingVertical: 8 }]}>다가오는 로그</Text>
                {upcomingChallenges.map((challenge) => (
                  <UpcomingChallengeCard
                    key={challenge.participationIdx}
                    challenge={challenge}
                    onPress={() => handleChallengePress(challenge)}
                  />
                ))}
              </View>
            )}

            {/* 지난 챌린지 섹션 */}
            <View style={challengeStyles.section}>
              <Text style={[challengeStyles.sectionTitle, isTablet && { fontSize: 18, paddingHorizontal: 16, paddingVertical: 8 }]}>로그 히스토리</Text>
              {completedChallenges.length > 0 ? (
                completedChallenges.map((challenge) => (
                  <CompletedChallengeCard
                    key={challenge.participationIdx}
                    challenge={challenge}
                    periodInfo={getChallengePeriodInfo(challenge)}
                    onPress={() => handleChallengePress(challenge)}
                  />
                ))
              ) : (
                <View style={challengeStyles.emptyState}>
                  <Text style={challengeStyles.emptyText}>완료된 로그가 없습니다</Text>
                </View>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={null}
        initialNumToRender={6}
        windowSize={5}
        removeClippedSubviews
        maxToRenderPerBatch={8}
        updateCellsBatchingPeriod={50}
        />
    </View>
  );
};

export default React.memo(DiskScreen);
