import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { ChallengeEntry } from '@mooddisk/types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChallengeCard } from '../components/features/challenge/ChallengeCard';
import { ChallengeDetail } from '../components/features/challenge/ChallengeDetail';
import { LoadingOverlay } from '../components/common/loading/LoadingOverlay';
// ErrorModal은 useErrorHandler에서 처리
import { getAllChallenges, getMyChallenges, getChallengeById, joinChallenge } from '@mooddisk/api';
import { useErrorHandler } from '@mooddisk/hooks';
import { mapApiChallengeToChallengeEntry, mapApiMyChallengeToChallengeEntry } from '@mooddisk/mappers';
import Header from '../layouts/Header';
import { NotificationBanner } from '../components/common/NotificationBanner';
import { TravelLogCreateModal } from '../components/features/challenge/TravelLogCreateModal';
import DesignTokens from '../constants/designTokens';
import { useIsTablet } from '../hooks/useDeviceInfo';
import { responsiveSpacing } from '../utils/deviceUtils';

interface ChallengeScreenProps {
  userNickname: string;
  activeTab?: string; // 현재 활성 탭
  onChallengeDetailChange?: (isDetail: boolean, challengeData?: { id: string; isJoined: boolean }) => void;
  onJoinChallenge?: (challengeId: string) => void;
  onRegisterJoinHandler?: (handler: (challengeId: string) => void) => void;
}

const ChallengeScreen: React.FC<ChallengeScreenProps> = ({ userNickname, activeTab, onChallengeDetailChange, onJoinChallenge, onRegisterJoinHandler }) => {
  const { handleError } = useErrorHandler();
  const queryClient = useQueryClient();
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeEntry | null>(null);
  const isTablet = useIsTablet();
  
  // 헤더 상태 관리
  const [headerTitle, setHeaderTitle] = useState(`${userNickname || 'user'}.disk`);
  const [showBackButton, setShowBackButton] = useState(false);

  // userNickname이 변경될 때 헤더 제목 업데이트
  useEffect(() => {
    if (userNickname && userNickname !== '' && !showBackButton) {
      setHeaderTitle(`${userNickname}.disk`);
    }
  }, [userNickname, showBackButton]);

  // activeTab이 변경될 때 헤더 상태 및 뷰 상태 리셋 (다른 탭에서 돌아올 때)
  useEffect(() => {
    if (activeTab !== 'challenge') {
      // 다른 탭으로 이동할 때 헤더 상태 및 뷰 상태 리셋
      setHeaderTitle(`${userNickname || 'user'}.disk`);
      setShowBackButton(false);
      setView('list'); // 리스트 뷰로 리셋
      setSelectedChallenge(null); // 선택된 챌린지 초기화
      
      // 챌린지 상세페이지 상태를 MainScreen에 알림
      onChallengeDetailChange?.(false);
    }
  }, [activeTab, userNickname, onChallengeDetailChange]);

  // 성능 측정: 탭 활성화 시점
  useEffect(() => {
    console.log(`🔄 Tab Switch: ${activeTab} → challenge completed`);
    console.log('🏆 Challenge Tab Load started');
  }, [activeTab]);

  const { data: challengesData, isLoading: challengesLoading, refetch: refetchChallenges } = useQuery({
    queryKey: ['challenges'],
    queryFn: async () => {
      const raw = await getAllChallenges();
      return raw.map(ch => ({ ...ch, progress: ch.progressDays || 0 }));
    },
  });
  const challenges = useMemo(() => (challengesData || []) as ChallengeEntry[], [challengesData]);
  
  // 알림 배너 상태
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'info' | 'warning' | 'error'>('success');
  
  // 여행 로그 모달 상태
  const [showTravelLogModal, setShowTravelLogModal] = useState(false);
  const [selectedTravelChallenge, setSelectedTravelChallenge] = useState<ChallengeEntry | null>(null);
  
  // useErrorHandler 훅을 사용하여 에러 처리

  // 탭 변경 시 상태 리셋 제거 - 상세페이지에서 목록으로 돌아가지 않도록 함

  // mappers 패키지를 사용하여 API 응답을 변환
  const convertChallengeEntryToChallengeListEntry = useCallback((challenge: any): ChallengeEntry => {
    // MyChallenge인 경우 mapApiMyChallengeToChallengeEntry 사용
    if (challenge.participationIdx || challenge.myStatus) {
      const myChallenge = mapApiMyChallengeToChallengeEntry(challenge);
      
      // durationDays가 null인 경우 처리 (안전을 위해 체크)
      const durationDays = myChallenge.durationDays ?? 0;
      
      // MyChallengeEntry를 ChallengeEntry로 변환
      const challengeListEntry: ChallengeEntry = {
        id: myChallenge.challengeIdx.toString(),
        title: myChallenge.title,
        description: myChallenge.description,
        duration: myChallenge.durationDays,
        participants: 0, // MyChallenge에는 참가자 수 정보가 없음
        progress: myChallenge.progressDays,
        isJoined: true, // MyChallenge은 이미 참여한 챌린지
        startDate: myChallenge.startedAt,
        endDate: durationDays > 0 
          ? new Date(new Date(myChallenge.startedAt).getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          : '',
        challengeIdx: myChallenge.challengeIdx,
        isActive: true,
        imageUrl: challenge.imageUrl, // 원본 데이터에서 이미지 URL 가져오기
        progressDays: myChallenge.progressDays,
        completionRate: durationDays > 0 
          ? (myChallenge.progressDays / durationDays) * 100 
          : 0,
        consecutiveDays: 0, // MyChallenge에는 연속 일수 정보가 없음
        status: myChallenge.status,
      };
      
      return challengeListEntry;
    }
    // 일반 Challenge인 경우 mapApiChallengeToChallengeEntry 사용
    return mapApiChallengeToChallengeEntry(challenge);
  }, []);

  // 에러 핸들링
  // useErrorHandler 훅을 사용하여 에러 처리

  // React Query가 로드/캐시 관리

  // 성능 측정: 데이터 로딩 완료 시점
  useEffect(() => {
    if (!challengesLoading && challenges.length >= 0) {
      console.log('🏆 Challenge Tab Load completed');
    }
  }, [challengesLoading, challenges.length]);


  const handleJoinChallenge = useCallback(async (challengeId: string) => {
    try {
      const challenge = challenges.find(c => c.id === challengeId);
      if (!challenge?.challengeIdx) return;

      // TRAVEL 타입 챌린지인 경우 모달 표시
      if (challenge.type === 'TRAVEL') {
        setSelectedTravelChallenge(challenge);
        setShowTravelLogModal(true);
        return;
      }

      // 일반 챌린지는 기존 로직대로 진행
      Alert.alert(
        '로그 시작',
        `${challenge.title}를 시작하시겠습니까?`,
        [
          { text: '취소', style: 'cancel' },
          { 
            text: '시작하기', 
            onPress: async () => {
              try {
                const result = await joinChallenge(challenge.challengeIdx);
                
                if (result) {
                  // 챌린지 참여 성공 알림 표시
                  setNotificationMessage("로그가 시작되었습니다.");
                  setNotificationType('success');
                  setShowNotification(true);
                  
                  // 참여 상태 업데이트
                  await refetchChallenges();
                  // 디스크 탭의 내 챌린지 목록도 함께 최신화
                  queryClient.invalidateQueries({ queryKey: ['myChallenges'] });
                  
                  // 선택된 챌린지가 있다면 상태 업데이트
                  if (selectedChallenge && selectedChallenge.id === challengeId) {
                    const updatedChallenge = { ...selectedChallenge, isJoined: true };
                    setSelectedChallenge(updatedChallenge);
                    
                    // MainScreen에 상태 변경 알림
                    onChallengeDetailChange?.(true, {
                      id: challengeId,
                      isJoined: true
                    });
                  }
                  
                  // 참여 완료 - MainScreen 콜백 호출 제거 (중복 모달 방지)
                }
              } catch (err) {
                handleError(err as any);
              }
            }
          }
        ]
      );
    } catch (err) {
      handleError(err as any);
    }
  }, [challenges, handleError, refetchChallenges, selectedChallenge, onChallengeDetailChange, onJoinChallenge, queryClient]);

  // MainScreen에 실제 참여 로직 등록
  useEffect(() => {
    if (onRegisterJoinHandler) {
      onRegisterJoinHandler(handleJoinChallenge);
    }
  }, [onRegisterJoinHandler, handleJoinChallenge]);

  // 여행 로그 모달 성공 핸들러
  const handleTravelLogSuccess = useCallback(async () => {
    // 챌린지 목록 새로고침
    await refetchChallenges();
    // 디스크 탭의 내 챌린지 목록도 함께 최신화
    queryClient.invalidateQueries({ queryKey: ['myChallenges'] });
    
    // 성공 알림 표시
    setNotificationMessage("로그가 시작되었습니다.");
    setNotificationType('success');
    setShowNotification(true);
    
    // 상세페이지에서 시작한 경우에만 상태 업데이트 (일반 로그와 동일한 로직)
    if (selectedTravelChallenge && view === 'detail' && selectedChallenge && selectedChallenge.id === selectedTravelChallenge.id) {
      const updatedChallenge = { ...selectedTravelChallenge, isJoined: true };
      setSelectedChallenge(updatedChallenge);
      
      // MainScreen에 상태 변경 알림
      onChallengeDetailChange?.(true, {
        id: selectedTravelChallenge.id,
        isJoined: true
      });
    }
    
    setSelectedTravelChallenge(null);
  }, [refetchChallenges, queryClient, selectedTravelChallenge, view, selectedChallenge, onChallengeDetailChange]);


  const handleChallengeSelect = useCallback((challenge: ChallengeEntry) => {
    setSelectedChallenge(challenge);
    setView('detail');

    // 헤더 상태 업데이트 - 챌린지 상세보기 모드
    setHeaderTitle(challenge.title);
    setShowBackButton(true);

    // 챌린지 상세페이지 상태를 MainScreen에 알림
    onChallengeDetailChange?.(true, {
      id: challenge.id,
      isJoined: challenge.isJoined
    });
  }, [onChallengeDetailChange]);

  const handleBackFromDetail = useCallback(async () => {
    setView('list');
    setSelectedChallenge(null);
    
    // 헤더 상태를 기본으로 리셋
    setHeaderTitle(`${userNickname || 'user'}.disk`);
    setShowBackButton(false);
    
    // 챌린지 상세페이지 상태를 MainScreen에 알림
    onChallengeDetailChange?.(false);
    
    // 챌린지 목록 새로고침
    await refetchChallenges();
  }, [refetchChallenges, userNickname, onChallengeDetailChange]);

  if (challengesLoading) {
    return <LoadingOverlay />;
  }

  // 에러 처리는 useErrorHandler에서 자동으로 처리됨

  if (view === 'detail' && selectedChallenge) {
    return (
      <View style={styles.container}>
        <Header 
          title={headerTitle}
          activeSection="challenge"
          isDetailMode={true}
          showBackButton={showBackButton}
          onBack={handleBackFromDetail}
        />
        {/* 알림 배너 */}
        <NotificationBanner
          isVisible={showNotification}
          message={notificationMessage}
          onClose={() => setShowNotification(false)}
          type={notificationType}
          duration={3000}
          icon="🕹️"
        />
        <ChallengeDetail
          challenge={selectedChallenge}
          onBack={handleBackFromDetail}
          onJoin={handleJoinChallenge}
          loading={false}
        />
        
        {/* 여행 로그 생성 모달 */}
        <TravelLogCreateModal
          visible={showTravelLogModal}
          onClose={() => {
            setShowTravelLogModal(false);
            setSelectedTravelChallenge(null);
          }}
          onSuccess={handleTravelLogSuccess}
        />
      </View>
    );
  }

  // 진행 중인 챌린지와 전체 챌린지 분리 (프론트엔드와 같은 방식)
  const participatingChallenges = challenges.filter(challenge => challenge.isJoined);
  const availableChallenges = challenges.filter(challenge => !challenge.isJoined);

  return (
    <View style={styles.container}>
      <Header 
        title={headerTitle}
        activeSection="challenge"
        isDetailMode={false}
        showBackButton={showBackButton}
        onBack={showBackButton ? handleBackFromDetail : undefined}
      />
      {/* 알림 배너 */}
      <NotificationBanner
        isVisible={showNotification}
        message={notificationMessage}
        onClose={() => setShowNotification(false)}
        type={notificationType}
        duration={3000}
        icon="🕹️"
      />
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={isTablet ? styles.scrollViewContentTablet : styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 진행중인 챌린지 섹션 */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isTablet && styles.sectionTitleTablet]}>진행 로그</Text>
        {participatingChallenges.length > 0 ? (
          <View style={styles.challengeGrid}>
            {participatingChallenges.map((challenge, index) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                onClick={() => handleChallengeSelect(challenge)}
                onJoin={() => handleJoinChallenge(challenge.id)}
                isLastInRow={index % 2 === 1 || index === participatingChallenges.length - 1}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>진행 로그가 없습니다.</Text>
            <Text style={styles.emptyStateSubText}>새로운 로그를 시작해보세요!</Text>
          </View>
        )}
      </View>
      
      {/* 전체 챌린지 섹션 */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isTablet && styles.sectionTitleTablet]}>모든 로그</Text>
        {availableChallenges.length > 0 ? (
          <View style={styles.challengeGrid}>
            {availableChallenges.map((challenge, index) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                onClick={() => handleChallengeSelect(challenge)}
                onJoin={() => handleJoinChallenge(challenge.id)}
                isLastInRow={index % 2 === 1 || index === availableChallenges.length - 1}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>새로운 로그가 없습니다</Text>
            <Text style={styles.emptyStateSubText}>새로운 로그가 곧 추가될 예정입니다!</Text>
          </View>
        )}
      </View>
      </ScrollView>
      
      {/* 여행 로그 생성 모달 */}
      <TravelLogCreateModal
        visible={showTravelLogModal}
        onClose={() => {
          setShowTravelLogModal(false);
          setSelectedTravelChallenge(null);
        }}
        onSuccess={handleTravelLogSuccess}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignTokens.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: 16, // 원래 padding 복구
  },
  scrollViewContentTablet: {
    paddingHorizontal: 16, // 태블릿도 동일
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: DesignTokens.colors.cardBackground,
  },
  errorText: {
    fontSize: 16,
    color: DesignTokens.colors.primary,
    fontFamily: DesignTokens.fonts.default,
  },
  section: {
    marginBottom: DesignTokens.spacing.sectionMargin,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: DesignTokens.colors.secondary,
    backgroundColor: DesignTokens.colors.sectionBackground,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: DesignTokens.spacing.sectionTitleMargin,
    fontFamily: DesignTokens.fonts.default,
    textTransform: 'uppercase',
    alignSelf: 'flex-start',
  },
  sectionTitleTablet: {
    fontSize: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 20,
  },
  challengeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    ...(Platform.OS === 'android' ? {} : { justifyContent: 'space-between' }),
  },
  emptyState: {
    backgroundColor: DesignTokens.colors.background,
    padding: 32,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: DesignTokens.colors.border,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: DesignTokens.colors.primary,
    marginBottom: 4,
    textAlign: 'center',
    fontFamily: DesignTokens.fonts.default,
    textTransform: 'uppercase',
  },
  emptyStateSubText: {
    fontSize: 14,
    color: DesignTokens.colors.text,
    textAlign: 'center',
    fontFamily: DesignTokens.fonts.default,
  },
});

export default React.memo(ChallengeScreen);
