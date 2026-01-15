import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ChallengeCard } from '../../components/features/challenge/ChallengeCard';
import { ChallengeDetail } from '../../components/features/challenge/ChallengeDetail';

import { getAllChallenges, getChallengeById, joinChallenge } from '@mooddisk/api';
import { useUser } from '../../context/UserContext';
import { useErrorHandler } from '@mooddisk/hooks';
import { ErrorModal } from '../../components/common/modals/ErrorModal';
import { NotificationBanner } from '../../components/common/NotificationBanner';
import { ChallengeEntry } from "@mooddisk/types";
import DesignTokens from '../../constants/designTokens';
interface ChallengeSectionProps {
  onTitleChange?: (title: string) => void;
  onDetailModeChange?: (isDetail: boolean) => void;
  shouldGoBack?: boolean;
  setShouldGoBack?: (shouldGoBack: boolean) => void;
}

export default function ChallengeSection({ onTitleChange, onDetailModeChange, shouldGoBack, setShouldGoBack }: ChallengeSectionProps) {
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [isMobile, setIsMobile] = useState(false);

  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [newPost, setNewPost] = useState<{ content: string }>({ content: '' });

  const [challenges, setChallenges] = useState<ChallengeEntry[]>([]);
const [allChallenges, setAllChallenges] = useState<ChallengeEntry[]>([]);
const [selectedChallenge, setSelectedChallenge] = useState<ChallengeEntry | null>(null);

  const { nickname } = useUser();
  const { errorMessage, showErrorModal, handleError, clearError } = useErrorHandler();

  // onTitleChange와 onDetailModeChange를 useRef로 안정화
  const onTitleChangeRef = useRef(onTitleChange);
  const onDetailModeChangeRef = useRef(onDetailModeChange);
  useEffect(() => {
    onTitleChangeRef.current = onTitleChange;
    onDetailModeChangeRef.current = onDetailModeChange;
  }, [onTitleChange, onDetailModeChange]);

  // 모바일 디바이스 감지 - useCallback으로 최적화
  const checkIfMobile = useCallback(() => {
      setIsMobile(window.innerWidth < 768);
  }, []);

  useEffect(() => {
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, [checkIfMobile]);
  
  // 알림 배너 상태
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'info' | 'warning' | 'error'>('success');

  // 챌린지 목록 로드
  const fetchChallenges = useCallback(async () => {
    try {
      setLoading(true);
      
      const challenges = await getAllChallenges();
      
      // getAllChallenges API에서 이미 참여 상태와 진행률 정보가 포함되어 있음
      setAllChallenges(challenges);
      setChallenges(challenges);
    } catch (err) {
      handleError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // 초기 로드
  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  // shouldGoBack 상태 감지하여 뒤로가기 처리
  const setShouldGoBackRef = useRef(setShouldGoBack);
  useEffect(() => {
    setShouldGoBackRef.current = setShouldGoBack;
  }, [setShouldGoBack]);

  const handleBackFromDetail = useCallback(async () => {
    setView('list');
    setSelectedChallenge(null);
    // 헤더 제목을 원래대로 복원
    onTitleChangeRef.current?.('로그');
    // 상세모드 비활성화
    onDetailModeChangeRef.current?.(false);
    
    // 챌린지 목록 새로고침 (필요한 경우에만)
    // 뒤로가기 시에는 이미 로드된 데이터가 있으므로 스킵 가능
    // await fetchChallenges();
  }, []);

  useEffect(() => {
    if (shouldGoBack && view === 'detail') {
      handleBackFromDetail();
      setShouldGoBackRef.current?.(false);
    }
  }, [shouldGoBack, view, handleBackFromDetail]);

  const handleJoinChallenge = useCallback(async (challengeId: string) => {
    try {
      const challenge = challenges.find(c => c.id === challengeId);
      if (!challenge?.challengeIdx) return;

      // 간단한 확인 후 바로 참여
      if (window.confirm(`${challenge.title}를 시작하시겠습니까?`)) {
        // 실제 참여 API 호출
        const result = await joinChallenge(challenge.challengeIdx);
        
        if (result) {
          // 챌린지 참여 성공 알림 표시
          setNotificationMessage("로그가 시작되었습니다.");
          setNotificationType('success');
          setShowNotification(true);
          
          // 참여 상태 업데이트를 위해 전체 챌린지 목록 새로고침
          await fetchChallenges();
        }
      }
    } catch (err) {
      handleError(err as Error);
    }
  }, [challenges, handleError, fetchChallenges]);

  const handleSubmitPost = useCallback(async () => {
    if (newPost.content.trim() && selectedChallenge?.challengeIdx) {
      try {
        // 포스트 작성 기능은 백엔드에서 구현되지 않음
        alert('포스트 작성 기능은 준비 중입니다.');
        setNewPost({ content: '' });
      } catch (err) {
        handleError(err as Error);
      }
    }
  }, [newPost, selectedChallenge, handleError]);

  const handleChallengeSelect = useCallback(async (challenge: ChallengeEntry) => {
    setSelectedChallenge(challenge);
    setView('detail');
    setDetailLoading(true);
    
    // 헤더 제목을 챌린지 제목으로 변경
    onTitleChangeRef.current?.(challenge.title);
    // 상세모드 활성화
    onDetailModeChangeRef.current?.(true);

    try {
      if (challenge.challengeIdx) {
        const detailData = await getChallengeById(challenge.challengeIdx);

        const updatedChallenge = {
          ...challenge,
          ...detailData
        };

        setSelectedChallenge(updatedChallenge);
        setChallenges(prev => prev.map(c => 
          c.id === challenge.id ? updatedChallenge : c
        ));
      }
    } catch (err) {
      handleError(err as Error);
    } finally {
      setDetailLoading(false);
    }
  }, [handleError]);

  // 진행 중인 챌린지와 전체 챌린지 분리 - useMemo로 최적화 (early return 전에 호출)
  const participatingChallenges = useMemo(
    () => challenges.filter(challenge => challenge.isJoined),
    [challenges]
  );
  const availableChallenges = useMemo(
    () => challenges.filter(challenge => !challenge.isJoined),
    [challenges]
  );

  if (loading) {
    return (
      <div className="pb-20 px-4">
        <div className="mb-6">
          <div 
            className="px-3 py-1.5 mb-4 inline-block font-bold uppercase animate-pulse"
            style={{
              backgroundColor: DesignTokens.colors.sectionBackground,
              color: DesignTokens.colors.secondary,
              fontSize: '18px',
              width: '150px',
              height: '28px'
            }}
          />
        </div>
        <div className="flex flex-wrap" style={{ gap: '16px' }}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div 
              key={i} 
              style={{
                width: isMobile ? 'calc(50% - 8px)' : 'calc(25% - 12px)',
                backgroundColor: DesignTokens.colors.background,
                border: `${DesignTokens.borders.width} solid ${DesignTokens.colors.border}`,
                marginBottom: '16px'
              }}
            >
              {/* 이미지 스켈레톤 */}
              <div 
                className="w-full animate-pulse" 
                style={{ 
                  height: '100px',
                  backgroundColor: DesignTokens.colors.lightGray
                }} 
              />
              {/* 콘텐츠 스켈레톤 */}
              <div className="p-2.5 space-y-2">
                <div 
                  className="h-4 bg-gray-200 rounded animate-pulse" 
                  style={{ width: '80%' }}
                />
                <div 
                  className="h-3 bg-gray-200 rounded animate-pulse" 
                  style={{ width: '90%' }}
                />
                <div 
                  className="h-3 bg-gray-200 rounded animate-pulse" 
                  style={{ width: '60%' }}
                />
                <div 
                  className="h-6 bg-gray-200 rounded animate-pulse mt-2" 
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (showErrorModal) {
    return (
      <>
        <div className="pb-20 px-4">
          <div className="mb-6">
            <div 
              className="px-3 py-1.5 mb-4 inline-block font-bold uppercase animate-pulse"
              style={{
                backgroundColor: DesignTokens.colors.sectionBackground,
                color: DesignTokens.colors.secondary,
                fontSize: '18px',
                width: '150px',
                height: '28px'
              }}
            />
          </div>
          <div className="flex flex-wrap" style={{ gap: '16px' }}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div 
                key={i} 
                style={{
                  width: isMobile ? 'calc(50% - 8px)' : 'calc(25% - 12px)',
                  backgroundColor: DesignTokens.colors.background,
                  border: `${DesignTokens.borders.width} solid ${DesignTokens.colors.border}`,
                  marginBottom: '16px'
                }}
              >
                {/* 이미지 스켈레톤 */}
                <div 
                  className="w-full animate-pulse" 
                  style={{ 
                    height: '100px',
                    backgroundColor: DesignTokens.colors.lightGray
                  }} 
                />
                {/* 콘텐츠 스켈레톤 */}
                <div className="p-2.5 space-y-2">
                  <div 
                    className="h-4 bg-gray-200 rounded animate-pulse" 
                    style={{ width: '80%' }}
                  />
                  <div 
                    className="h-3 bg-gray-200 rounded animate-pulse" 
                    style={{ width: '90%' }}
                  />
                  <div 
                    className="h-3 bg-gray-200 rounded animate-pulse" 
                    style={{ width: '60%' }}
                  />
                  <div 
                    className="h-6 bg-gray-200 rounded animate-pulse mt-2" 
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <ErrorModal
          isOpen={showErrorModal}
          onClose={() => {
            clearError();
            fetchChallenges();
          }}
          message={errorMessage}
        />
      </>
    );
  }

  if (view === 'detail' && selectedChallenge) {
    return (
      <ChallengeDetail
        challenge={selectedChallenge}
        onBack={handleBackFromDetail}
        onJoin={handleJoinChallenge}
        onSubmitPost={handleSubmitPost}
        newPost={newPost}
        setNewPost={setNewPost}
        loading={detailLoading}
      />
    );
  }

  return (
    <div className="pb-20 px-4">
      {/* 알림 배너 */}
      <NotificationBanner
        isVisible={showNotification}
        message={notificationMessage}
        onClose={() => setShowNotification(false)}
        type={notificationType}
        duration={3000}
        icon="🕹️"
      />
      
      {/* 진행중인 챌린지 섹션 */}
      <div className="mb-6">
        <div 
          className="px-3 py-1.5 mb-4 inline-block font-bold uppercase"
          style={{
            backgroundColor: DesignTokens.colors.sectionBackground,
            color: DesignTokens.colors.secondary,
            fontSize: '18px',
          }}
        >
          진행 로그
        </div>
        {participatingChallenges.length > 0 ? (
          <div className="flex flex-wrap" style={{ gap: '16px' }}>
            {participatingChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                onClick={() => handleChallengeSelect(challenge)}
                onJoin={() => handleJoinChallenge(challenge.id)}
              />
            ))}
          </div>
        ) : (
          <div 
            className="p-8 text-center"
            style={{
              backgroundColor: DesignTokens.colors.background,
              border: `${DesignTokens.borders.width} solid ${DesignTokens.colors.border}`,
            }}
          >
            <p 
              className="text-base font-bold uppercase mb-1"
              style={{ color: DesignTokens.colors.primary }}
            >
              진행중인 로그가 없습니다
            </p>
            <p 
              className="text-sm"
              style={{ color: DesignTokens.colors.text }}
            >
              로그를 시작해보세요!
            </p>
          </div>
        )}
      </div>
      
      {/* 전체 챌린지 섹션 */}
      <div className="mb-6">
        <div 
          className="px-3 py-1.5 mb-4 inline-block font-bold uppercase"
          style={{
            backgroundColor: DesignTokens.colors.sectionBackground,
            color: DesignTokens.colors.secondary,
            fontSize: '18px',
          }}
        >
          모든 로그
        </div>
        {availableChallenges.length > 0 ? (
          <div className="flex flex-wrap" style={{ gap: '16px' }}>
            {availableChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                onClick={() => handleChallengeSelect(challenge)}
                onJoin={() => handleJoinChallenge(challenge.id)}
              />
            ))}
          </div>
        ) : (
          <div 
            className="p-8 text-center"
            style={{
              backgroundColor: DesignTokens.colors.background,
              border: `${DesignTokens.borders.width} solid ${DesignTokens.colors.border}`,
            }}
          >
            <p 
              className="text-base font-bold uppercase mb-1"
              style={{ color: DesignTokens.colors.primary }}
            >
              새로운 로그가 없습니다
            </p>
            <p 
              className="text-sm"
              style={{ color: DesignTokens.colors.text }}
            >
              새로운 로그가 곧 추가될 예정입니다!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}