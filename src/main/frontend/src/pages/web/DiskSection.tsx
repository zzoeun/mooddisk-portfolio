import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useUser } from '../../context/UserContext';
import { getMyChallenges, getDiariesByChallenge, getDiaryYear } from '@mooddisk/api';
import { DiaryEntry, MyChallengeEntry } from '@mooddisk/types';
import EmotionBitmap from '../../components/features/disk/EmotionBitmap';
import { ActiveChallengeCard } from '../../components/features/disk/ActiveChallengeCard';
import { CompletedChallengeCard } from '../../components/features/disk/CompletedChallengeCard';
import ChallengeTimeline from '../../components/features/disk/ChallengeTimeline';
import {
  getChallengePeriodInfo,
  getChallengeProgress,
  getActiveChallenges,
  getCompletedChallenges,
} from '../../utils/challengeUtils';
import DesignTokens from '../../constants/designTokens';
import { ChallengeCompletionModal } from '../../components/features/challenge';
import { NotificationBanner } from '../../components/common/NotificationBanner';

// API에서 실제로 반환하는 MyChallengeEntry 타입
interface MyChallenge {
  participationIdx: number;
  challengeIdx: number;
  title: string;
  description: string;
  status: string;
  progressDays: number;
  durationDays: number;
  isCompleted: boolean;
  startedAt: string;
}

interface DiskSectionProps {
  onTitleChange?: (title: string) => void;
  onDetailModeChange?: (isDetail: boolean) => void;
  shouldGoBack?: boolean;
  setShouldGoBack?: (value: boolean) => void;
  onWriteDiaryWithChallenge?: (challenge: MyChallengeEntry) => void;
  showDiaryCompleteNotification?: boolean;
  setShowDiaryCompleteNotification?: (show: boolean) => void;
  activeTab?: string;
  challengeFromTimeline?: MyChallengeEntry | null;
  onChallengeTimelineBack?: () => void;
  initialSelectedChallenge?: MyChallengeEntry | null;
}

export default function DiskSection({
  onTitleChange,
  onDetailModeChange,
  shouldGoBack,
  setShouldGoBack,
  onWriteDiaryWithChallenge,
  showDiaryCompleteNotification,
  setShowDiaryCompleteNotification,
  activeTab,
  challengeFromTimeline,
  onChallengeTimelineBack,
  initialSelectedChallenge
}: DiskSectionProps) {
  console.log('🔍 DiskSection 렌더링:', {
    hasOnWriteDiaryWithChallenge: !!onWriteDiaryWithChallenge,
    onWriteDiaryWithChallengeType: typeof onWriteDiaryWithChallenge,
    onWriteDiaryWithChallengeValue: onWriteDiaryWithChallenge
  });
  const { userIdx, nickname } = useUser();
  const [challenges, setChallenges] = useState<MyChallenge[]>([]);
  const [challengeDiaries, setChallengeDiaries] = useState<Record<number, any[]>>({});
  const [yearDiaries, setYearDiaries] = useState<DiaryEntry[]>([]);
  // initialSelectedChallenge가 있으면 loading을 false로 시작하여 타임라인을 즉시 표시
  const [loading, setLoading] = useState(!initialSelectedChallenge);
  // initialSelectedChallenge가 있으면 즉시 타임라인으로 이동
  const [selectedChallenge, setSelectedChallenge] = useState<MyChallenge | null>(() => {
    if (initialSelectedChallenge) {
      const challenge = {
        participationIdx: (initialSelectedChallenge as any).participationIdx || 0,
        challengeIdx: initialSelectedChallenge.challengeIdx,
        title: initialSelectedChallenge.title,
        description: (initialSelectedChallenge as any).description || '',
        status: (initialSelectedChallenge as any).status || 'ACTIVE',
        progressDays: (initialSelectedChallenge as any).progressDays || 0,
        durationDays: (initialSelectedChallenge as any).durationDays || 0,
        isCompleted: (initialSelectedChallenge as any).isCompleted || false,
        startedAt: (initialSelectedChallenge as any).startedAt || new Date().toISOString()
      };
      // 초기화 시점에 즉시 타임라인 모드로 설정
      onDetailModeChange?.(true);
      onTitleChange?.(challenge.title);
      return challenge;
    }
    return null;
  });
  
  // 알림 배너 상태
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'info' | 'warning' | 'error'>('success');
  const notificationTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // 챌린지 완료 모달 상태
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completedChallenge, setCompletedChallenge] = useState<MyChallengeEntry | null>(null);
  const challengeCheckTimerRef = useRef<NodeJS.Timeout | null>(null);
  const previousChallengeStatusRef = useRef<string | null>(null);
  const previousChallengeIdxRef = useRef<number | null>(null);
  const initialDiariesLoadedRef = useRef<boolean>(false);

  // 챌린지 일기는 지연 로딩 (클릭 시 또는 필요할 때만 로드) - 먼저 정의
  const loadChallengeDiaries = useCallback(async (participationIdx: number) => {
    // 이미 로드된 일기가 있으면 스킵
    if (challengeDiaries[participationIdx]) {
      return challengeDiaries[participationIdx];
    }

    try {
      const diaries = await getDiariesByChallenge(participationIdx);
      setChallengeDiaries(prev => ({
        ...prev,
        [participationIdx]: diaries
      }));
      return diaries;
    } catch (error) {
      console.error(`챌린지 ${participationIdx} 일기 로드 실패:`, error);
      setChallengeDiaries(prev => ({
        ...prev,
        [participationIdx]: []
      }));
      return [];
    }
  }, [challengeDiaries]);

  // initialSelectedChallenge가 있으면 해당 챌린지의 일기를 먼저 로드 (타임라인 즉시 표시를 위해)
  useEffect(() => {
    if (initialSelectedChallenge && selectedChallenge && !initialDiariesLoadedRef.current) {
      const participationIdx = selectedChallenge.participationIdx || (initialSelectedChallenge as any).participationIdx || 0;
          console.log('🚀 DiskSection - initialSelectedChallenge 일기 즉시 로드 시작:', participationIdx);
          initialDiariesLoadedRef.current = true;
      loadChallengeDiaries(participationIdx).then(() => {
        console.log('✅ DiskSection - initialSelectedChallenge 일기 즉시 로드 완료:', participationIdx);
          });
    }
  }, [initialSelectedChallenge, selectedChallenge, loadChallengeDiaries]);

  // 챌린지 목록, 감정 비트맵, 활성 챌린지 일기 데이터를 동시에 로드 (데이터가 준비될 때까지 로딩 상태 유지)
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const currentYear = new Date().getFullYear();
        const previousYear = currentYear - 1;
        
        // 챌린지 목록과 감정 비트맵 데이터를 병렬로 로드
        // 비트맵은 "오늘부터 과거 1년"을 표시하므로 현재 년도와 이전 년도 모두 조회
        const [myChallenges, currentYearData, previousYearData] = await Promise.all([
          getMyChallenges(),
          getDiaryYear(currentYear),
          getDiaryYear(previousYear)
        ]);
        
        setChallenges(myChallenges as any);
        // 두 년도 데이터 합치기
        setYearDiaries([...previousYearData, ...currentYearData]);
        
        // 활성 챌린지의 일기도 초기 로딩에 포함
        const activeChallenges = getActiveChallenges(myChallenges as any);
        if (activeChallenges.length > 0) {
          // 병렬로 활성 챌린지 일기 로드 (최대 3개)
          const diaryPromises = activeChallenges.slice(0, 3).map(async (challenge: MyChallenge) => {
            try {
              const diaries = await getDiariesByChallenge(challenge.participationIdx);
              return { participationIdx: challenge.participationIdx, diaries };
            } catch (error) {
              console.error(`챌린지 ${challenge.participationIdx} 일기 로드 실패:`, error);
              return { participationIdx: challenge.participationIdx, diaries: [] };
            }
          });
          
          const diaryResults = await Promise.all(diaryPromises);
          const diariesMap: Record<number, any[]> = {};
          diaryResults.forEach(({ participationIdx, diaries }) => {
            diariesMap[participationIdx] = diaries;
          });
          setChallengeDiaries(diariesMap);
        }
      } catch (error) {
        console.error('데이터 로드 실패:', error);
        // 에러가 발생해도 빈 배열로 초기화하여 UI가 표시되도록 함
        setYearDiaries([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);


  // challengeFromTimeline 이전 값 추적 (null로 변경되었는지 확인하기 위해)
  const prevChallengeFromTimelineRef = useRef<MyChallengeEntry | null | undefined>(challengeFromTimeline);
  
  // challengeFromTimeline이 있으면 타임라인으로 이동, null로 변경되면 타임라인 초기화
  useEffect(() => {
    const prevChallengeFromTimeline = prevChallengeFromTimelineRef.current;
    
    if (challengeFromTimeline) {
      // 이미 같은 챌린지가 선택되어 있으면 스킵
      if (selectedChallenge?.challengeIdx === challengeFromTimeline.challengeIdx) {
        console.log('✅ DiskSection - 이미 같은 챌린지가 선택되어 있음, 타임라인 유지');
        prevChallengeFromTimelineRef.current = challengeFromTimeline;
        return;
      }
      
      console.log('🔍 DiskSection - challengeFromTimeline 감지 (즉시 실행):', {
        challengeFromTimeline,
        selectedChallengeIdx: selectedChallenge?.challengeIdx,
        challengeFromTimelineIdx: challengeFromTimeline.challengeIdx
      });
      
      // challengeFromTimeline을 직접 MyChallenge 형식으로 변환하여 사용
      const challenge: MyChallenge = {
        participationIdx: (challengeFromTimeline as any).participationIdx || 0,
        challengeIdx: challengeFromTimeline.challengeIdx,
        title: challengeFromTimeline.title,
        description: (challengeFromTimeline as any).description || '',
        status: (challengeFromTimeline as any).status || 'ACTIVE',
        progressDays: (challengeFromTimeline as any).progressDays || 0,
        durationDays: (challengeFromTimeline as any).durationDays || 0,
        isCompleted: (challengeFromTimeline as any).isCompleted || false,
        startedAt: (challengeFromTimeline as any).startedAt || new Date().toISOString()
      };
      
      console.log('✅ DiskSection - 챌린지 타임라인으로 즉시 이동:', challenge);
      setSelectedChallenge(challenge);
      onDetailModeChange?.(true);
      onTitleChange?.(challenge.title);
      
      // 해당 챌린지의 일기도 로드
      loadChallengeDiaries(challenge.participationIdx);
      
      // challenges 배열이 로드되면 실제 데이터로 업데이트 (백그라운드)
      if (challenges.length > 0) {
        const foundChallenge = challenges.find(c => c.challengeIdx === challengeFromTimeline.challengeIdx);
        if (foundChallenge) {
          console.log('🔄 DiskSection - challenges 배열에서 실제 데이터로 업데이트:', foundChallenge);
          setSelectedChallenge(foundChallenge);
        }
      }
    } else if (prevChallengeFromTimeline && !challengeFromTimeline && selectedChallenge) {
      // challengeFromTimeline이 null로 변경되었고 (이전에 값이 있었음), selectedChallenge가 있으면 타임라인 초기화
      console.log('🔄 DiskSection - challengeFromTimeline이 null로 변경됨, 타임라인 초기화');
      setSelectedChallenge(null);
      onDetailModeChange?.(false);
      onTitleChange?.(`${nickname || 'user'}.disk`);
    }
    
    prevChallengeFromTimelineRef.current = challengeFromTimeline;
  }, [challengeFromTimeline, selectedChallenge, challenges, onDetailModeChange, onTitleChange, loadChallengeDiaries, nickname]);

  // 진행중인 챌린지와 완료된 챌린지 분리
  const activeChallenges = useMemo(() => getActiveChallenges(challenges), [challenges]);
  const completedChallenges = useMemo(() => getCompletedChallenges(challenges), [challenges]);

  // 챌린지 클릭 핸들러 - useCallback으로 메모이제이션
  const handleChallengeClick = useCallback(async (challenge: MyChallenge) => {
    setSelectedChallenge(challenge);
    onDetailModeChange?.(true);
    onTitleChange?.(challenge.title);
    // 클릭 시 해당 챌린지의 일기 로드
    await loadChallengeDiaries(challenge.participationIdx);
  }, [onDetailModeChange, onTitleChange, loadChallengeDiaries]);

  // 뒤로가기 핸들러 - useCallback으로 메모이제이션
  const handleBackToList = useCallback(() => {
    setSelectedChallenge(null);
    onDetailModeChange?.(false);
    onTitleChange?.('디스크');
    // challengeFromTimeline도 초기화
    onChallengeTimelineBack?.();
  }, [onDetailModeChange, onTitleChange, onChallengeTimelineBack]);

  // 챌린지 완료 상태 확인 함수
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
          previousChallengeStatusRef.current = currentStatus;
          return true;
        }
        
        previousChallengeStatusRef.current = currentStatus;
      }
      return false;
    } catch (error) {
      console.error('챌린지 완료 상태 확인 실패:', error);
      return false;
    }
  };

  // 일기 작성 완료 알림 표시 및 챌린지 완료 확인
  useEffect(() => {
    if (showDiaryCompleteNotification && selectedChallenge && (activeTab === 'disk' || activeTab === 'diskbook')) {
      // 알림 배너 표시
      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
        notificationTimerRef.current = null;
      }
      setNotificationMessage("기록이 완료되었습니다.");
      setNotificationType('success');
      setShowNotification(true);
      
      setShowDiaryCompleteNotification?.(false);
      
      notificationTimerRef.current = setTimeout(() => {
        setShowNotification(false);
        notificationTimerRef.current = null;
      }, 3000);
      
      // 챌린지 완료 상태 확인
      const challengeIdx = selectedChallenge.challengeIdx;
      if (challengeCheckTimerRef.current) {
        clearTimeout(challengeCheckTimerRef.current);
      }
      challengeCheckTimerRef.current = setTimeout(async () => {
        await checkChallengeCompletion(challengeIdx);
        challengeCheckTimerRef.current = null;
      }, 1000);
    }
  }, [showDiaryCompleteNotification, selectedChallenge, activeTab, setShowDiaryCompleteNotification]);

  // 챌린지 선택 시 이전 상태 초기화
  useEffect(() => {
    if (selectedChallenge) {
      const currentChallengeIdx = selectedChallenge.challengeIdx;
      
      if (previousChallengeIdxRef.current !== currentChallengeIdx) {
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
      if (challengeCheckTimerRef.current) {
        clearTimeout(challengeCheckTimerRef.current);
        challengeCheckTimerRef.current = null;
      }
      setShowCompletionModal(false);
      setCompletedChallenge(null);
      previousChallengeStatusRef.current = null;
      previousChallengeIdxRef.current = null;
    }
  }, [selectedChallenge]);

  // activeTab이 변경될 때 알림 배너만 초기화
  useEffect(() => {
    if (activeTab !== 'disk' && activeTab !== 'diskbook') {
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


  // shouldGoBack이 true가 되면 뒤로가기 실행
  useEffect(() => {
    if (shouldGoBack && selectedChallenge) {
      handleBackToList();
      setShouldGoBack?.(false);
      // challengeFromTimeline도 초기화
      onChallengeTimelineBack?.();
    }
  }, [shouldGoBack, selectedChallenge, setShouldGoBack, onChallengeTimelineBack]);

  // initialSelectedChallenge가 있으면 타임라인을 먼저 표시
  // 단, 일기 로드가 완료될 때까지는 로딩 상태를 보여줌 (모바일과 동일한 패턴)
  if (selectedChallenge) {
    const participationIdx = selectedChallenge.participationIdx || (initialSelectedChallenge as any)?.participationIdx || 0;
    const selectedChallengeDiaries = challengeDiaries[participationIdx];
    // 일기 데이터가 아직 로드되지 않았으면 로딩 상태 표시 (initialSelectedChallenge뿐만 아니라 일반 클릭도 포함)
    const isDiariesLoading = selectedChallengeDiaries === undefined;
    
    console.log('🔍 DiskSection - ChallengeTimeline 렌더링:', {
      hasOnWriteDiaryWithChallenge: !!onWriteDiaryWithChallenge,
      onWriteDiaryWithChallengeType: typeof onWriteDiaryWithChallenge,
      selectedChallenge: selectedChallenge,
      participationIdx,
      diariesLoaded: selectedChallengeDiaries !== undefined,
      diariesCount: selectedChallengeDiaries?.length || 0,
      isDiariesLoading
    });
    
    // 일기가 아직 로드되지 않았으면 로딩 상태 표시
    if (isDiariesLoading) {
      return (
        <div className="pb-20 px-4">
          <div className="space-y-0">
            {/* 타임라인 스켈레톤 */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="relative">
                {/* 타임라인 연결선 스켈레톤 */}
                {i < 3 && (
                  <div 
                    className="absolute animate-pulse" 
                    style={{ 
                      left: '32px',
                      top: i === 0 ? '16px' : '50px',
                      height: '100%',
                      width: '0.5px',
                      borderLeft: `0.5px dashed ${DesignTokens.colors.border}`,
                      opacity: 0.5,
                      backgroundColor: 'transparent'
                    }} 
                  />
                )}
                
                {/* 타임라인 아이템 스켈레톤 */}
                <div className={`relative flex items-start pr-8 ${i === 0 ? 'px-4 pb-4' : 'p-4'}`}>
                  {/* 아바타 스켈레톤 */}
                  <div 
                    className="flex-shrink-0"
                    style={{
                      marginRight: '16px',
                      zIndex: 10
                    }}
                  >
                    <div 
                      className="w-8 h-8 rounded-full animate-pulse"
                      style={{ backgroundColor: DesignTokens.colors.lightGray }}
                    />
                  </div>
                  
                  {/* 콘텐츠 영역 스켈레톤 */}
                  <div className="flex-1 space-y-3">
                    {/* 시간 및 액션 버튼 스켈레톤 */}
                    <div className="flex justify-between items-center">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" style={{ width: '100px' }} />
                      <div className="h-6 w-6 bg-gray-200 rounded animate-pulse" />
                    </div>
                    
                    {/* 내용 스켈레톤 */}
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" style={{ width: '100%' }} />
                      <div className="h-4 bg-gray-200 rounded animate-pulse" style={{ width: '80%' }} />
                    </div>
                  </div>
                </div>
            </div>
            ))}
          </div>
        </div>
      );
    }
    
    return (
      <>
        {/* 알림 배너 */}
        <NotificationBanner
          isVisible={showNotification}
          message={notificationMessage}
          onClose={() => setShowNotification(false)}
          type={notificationType}
          duration={3000}
          icon={notificationType === 'success' ? '💾' : '💾'}
        />
        
        <ChallengeTimeline 
          challenge={selectedChallenge as any}
          diaries={selectedChallengeDiaries || []}
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
      </>
    );
  }

  if (loading) {
    return (
      <div className="pb-20 px-4">
        {/* 감정 비트맵 스켈레톤 */}
        <div className="mb-8">
          <div 
            className="px-3 py-1.5 mb-4 mx-4 inline-block font-bold uppercase animate-pulse"
            style={{
              backgroundColor: DesignTokens.colors.sectionBackground,
              color: DesignTokens.colors.secondary,
              fontSize: '18px',
              width: '120px',
              height: '28px'
            }}
          />
          <div 
            className="mx-4"
            style={{
              height: '200px',
              backgroundColor: DesignTokens.colors.lightGray,
              border: `${DesignTokens.borders.width} solid ${DesignTokens.colors.border}`,
              borderRadius: '4px'
            }}
          />
        </div>

        {/* 나의 챌린지 스켈레톤 */}
        <div className="mb-8">
          <div 
            className="px-3 py-1.5 mb-4 mx-4 inline-block font-bold uppercase animate-pulse"
            style={{
              backgroundColor: DesignTokens.colors.sectionBackground,
              color: DesignTokens.colors.secondary,
              fontSize: '18px',
              width: '120px',
              height: '28px'
            }}
          />
          <div className="mx-4">
            {[1, 2].map((i) => (
              <div 
                key={i} 
                className="mb-4 animate-pulse"
                style={{
                  backgroundColor: DesignTokens.colors.background,
                  border: `${DesignTokens.borders.width} solid ${DesignTokens.colors.border}`,
                }}
              >
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="h-4 bg-gray-200 rounded" style={{ width: '60%' }} />
                    <div className="h-6 bg-gray-200 rounded" style={{ width: '80px' }} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                        <div key={j} className="flex-1">
                          <div className="h-3 bg-gray-200 rounded mb-1" />
                          <div className="h-10 bg-gray-200 rounded" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 지난 챌린지 스켈레톤 */}
        <div className="mb-8">
          <div 
            className="px-3 py-1.5 mb-4 mx-4 inline-block font-bold uppercase animate-pulse"
            style={{
              backgroundColor: DesignTokens.colors.sectionBackground,
              color: DesignTokens.colors.secondary,
              fontSize: '18px',
              width: '120px',
              height: '28px'
            }}
          />
          <div className="mx-4">
            {[1, 2, 3].map((i) => (
              <div 
                key={i} 
                className="p-4 mb-4 animate-pulse"
                style={{
                  backgroundColor: DesignTokens.colors.background,
                  border: `${DesignTokens.borders.width} solid ${DesignTokens.colors.border}`,
                }}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="h-4 bg-gray-200 rounded" style={{ width: '70%' }} />
                  <div className="h-6 bg-gray-200 rounded" style={{ width: '100px' }} />
                </div>
                <div className="h-3 bg-gray-200 rounded" style={{ width: '50%' }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* 감정 비트맵 섹션 */}
      <div className="mb-8">
        <div 
          className="px-3 py-1.5 mb-4 mx-4 inline-block font-bold uppercase"
          style={{
            backgroundColor: DesignTokens.colors.sectionBackground,
            color: DesignTokens.colors.secondary,
            fontSize: '18px',
          }}
        >
          감정 비트맵
        </div>
        <EmotionBitmap yearDiaries={yearDiaries} />
      </div>

      {/* 진행중인 챌린지 섹션 */}
      <div className="mb-8">
        <div 
          className="px-3 py-1.5 mb-4 mx-4 inline-block font-bold uppercase"
          style={{
            backgroundColor: DesignTokens.colors.sectionBackground,
            color: DesignTokens.colors.secondary,
            fontSize: '18px',
          }}
        >
          활성 로그
        </div>
        {activeChallenges.length > 0 ? (
          activeChallenges.map((challenge) => {
            const participationIdx = challenge.participationIdx;
            // 일기가 로드되지 않았으면 빈 배열로 진행도 계산 (로딩 중에도 카드 표시)
            const diaries = challengeDiaries[participationIdx] || [];
            const periodInfo = getChallengePeriodInfo(challenge);
            const progress = getChallengeProgress(challenge, { [participationIdx]: diaries });

            return (
              <ActiveChallengeCard
                key={challenge.participationIdx}
                challenge={challenge as any}
                progress={progress}
                periodInfo={periodInfo}
                onPress={() => handleChallengeClick(challenge)}
              />
            );
          })
        ) : (
          <div 
            className="p-6 text-center mx-4"
            style={{
              backgroundColor: DesignTokens.colors.background,
              border: `${DesignTokens.borders.width} solid ${DesignTokens.colors.border}`,
            }}
          >
            <p 
              className="text-base font-bold uppercase"
              style={{ color: DesignTokens.colors.primary }}
            >
              진행중인 로그가 없습니다
            </p>
          </div>
        )}
      </div>

      {/* 지난 챌린지 섹션 */}
      <div className="mb-8">
        <div 
          className="px-3 py-1.5 mb-4 mx-4 inline-block font-bold uppercase"
          style={{
            backgroundColor: DesignTokens.colors.sectionBackground,
            color: DesignTokens.colors.secondary,
            fontSize: '18px',
          }}
        >
          로그 히스토리
        </div>
        {completedChallenges.length > 0 ? (
          completedChallenges.map((challenge) => (
            <CompletedChallengeCard
              key={challenge.participationIdx}
              challenge={challenge as any}
              periodInfo={getChallengePeriodInfo(challenge as any)}
              onPress={() => handleChallengeClick(challenge)}
            />
          ))
        ) : (
          <div 
            className="p-6 text-center mx-4"
            style={{
              backgroundColor: DesignTokens.colors.background,
              border: `${DesignTokens.borders.width} solid ${DesignTokens.colors.border}`,
            }}
          >
            <p 
              className="text-base font-bold uppercase"
              style={{ color: DesignTokens.colors.primary }}
            >
              완료된 로그가 없습니다
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
