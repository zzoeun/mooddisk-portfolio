import React, { useState, useEffect, useCallback } from 'react';
import { useAppState } from '../hooks/common/useAppState';
import { useUser } from '../context/UserContext';
import MobileHeader from './mobile/Header';
import MobileTabBar from './mobile/TabBar';
import MobileMyPageSection from '../pages/web/MyPageSection';

import MobileDiarySection from '../pages/web/DiarySection';
import MobileChallengeSection from '../pages/web/ChallengeSection';
import DiskSection from '../pages/web/DiskSection';
import TrashSection from '../pages/web/TrashSection';
import { MyChallengeEntry } from '@mooddisk/types';

interface HeaderState {
  title: string;
  showBackButton: boolean;
  isDetailMode: boolean;
  onBack?: () => void;
}

interface MobileLayoutProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export default function MobileLayout({ activeSection, onSectionChange }: MobileLayoutProps) {
  const { isMobile } = useAppState();
  const { nickname } = useUser();
  const [isCardMode, setIsCardMode] = useState(false);
  const [isWritingMode, setIsWritingMode] = useState(false);
  const [isDetailMode, setIsDetailMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shouldGoBack, setShouldGoBack] = useState(false);
  const [shouldSubmit, setShouldSubmit] = useState(false);
  const [userNickname, setUserNickname] = useState<string>(nickname || 'user');
  const [headerState, setHeaderState] = useState<HeaderState>({
    title: `${nickname || 'user'}.disk`,
    showBackButton: false,
    isDetailMode: false,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [initialChallengeIdx, setInitialChallengeIdx] = useState<number | undefined>(undefined);
  const [showDiaryCompleteNotification, setShowDiaryCompleteNotification] = useState(false);
  const [challengeFromTimeline, setChallengeFromTimeline] = useState<MyChallengeEntry | null>(null);

  const handleCardModeToggle = () => {
    setIsCardMode(!isCardMode);
  };

  const handleWritingModeChange = (isWriting: boolean) => {
    setIsWritingMode(isWriting);
    if (isWriting) {
      // 작성 모드 시작 시 뒤로가기 버튼 표시
      setHeaderState(prev => ({
        ...prev,
        showBackButton: true,
        onBack: () => handleBackFromWriting(),
      }));
    } else {
      // 작성 모드 종료 시 헤더 리셋
      setHeaderState(prev => ({
        ...prev,
        showBackButton: false,
        isDetailMode: false,
        onBack: undefined,
      }));
    }
  };

  const handleDetailModeChange = (isDetail: boolean) => {
    setIsDetailMode(isDetail);
    setHeaderState(prev => ({
      ...prev,
      isDetailMode: isDetail,
      showBackButton: isDetail,
      onBack: isDetail ? () => setShouldGoBack(true) : undefined,
    }));
  };

  const handleBackFromWriting = () => {
    setShouldGoBack(true);
  };

  const handleHeaderSubmit = () => {
    setShouldSubmit(true);
  };

  // 사용자 정보가 변경될 때마다 닉네임과 헤더 업데이트
  useEffect(() => {
    if (nickname) {
      setUserNickname(nickname);
      setHeaderState(prev => ({
        ...prev,
        title: `${nickname}.disk`,
      }));
    }
  }, [nickname]);

  // 탭별 헤더 제목 설정 함수 - 모든 탭에서 {닉네임}.disk로 통일
  const getTabHeaderTitle = (section: string, nickname: string) => {
    return `${nickname}.disk`;
  };

  // 헤더 제목 업데이트 함수
  const updateHeaderTitle = (newNickname: string) => {
    const newTitle = `${newNickname}.disk`;
    setHeaderState(prev => ({
      ...prev,
      title: newTitle,
    }));
    setUserNickname(newNickname);
  };

  // write 섹션으로 이동하기 전의 섹션을 추적
  const sectionBeforeWriteRef = React.useRef<string>('diary');
  
  // 탭 변경 시 이전 섹션 추적
  React.useEffect(() => {
    // write 섹션이 아닐 때만 이전 섹션 업데이트
    if (activeSection !== 'write') {
      sectionBeforeWriteRef.current = activeSection;
    }
  }, [activeSection]);
  
  // 탭 변경 핸들러 - write 섹션이면 상태 초기화 후 해당 탭으로 이동
  const handleTabChange = useCallback((tab: string) => {
    // write 섹션이면 상태 초기화
    if (activeSection === 'write') {
      setIsWritingMode(false);
      setInitialChallengeIdx(undefined);
    }
    // write 섹션으로 이동할 때 이전 섹션 저장
    if (tab === 'write' && activeSection !== 'write') {
      sectionBeforeWriteRef.current = activeSection;
    }
    // 바로 해당 탭으로 이동 (write 섹션은 diary 탭의 하위 상태이므로 무시)
    onSectionChange(tab);
  }, [activeSection, onSectionChange]);
  
  // 탭 표시용 activeSection (write 섹션이면 이전 섹션 표시)
  const displayActiveSection = activeSection === 'write' ? sectionBeforeWriteRef.current : activeSection;

  // 이전 섹션 추적 (타임라인 초기화용)
  const prevActiveSectionRef = React.useRef<string>(activeSection);
  
  // 탭 변경 시 헤더 업데이트 및 타임라인 상태 초기화
  useEffect(() => {
    const prevSection = prevActiveSectionRef.current;
    
    // 다른 섹션에서 diskbook으로 변경될 때 challengeFromTimeline 초기화 (write에서 온 경우 제외)
    if (prevSection !== 'write' && prevSection !== 'diskbook' && activeSection === 'diskbook') {
      console.log('🔄 MobileLayout - 다른 섹션에서 diskbook으로 변경, challengeFromTimeline 초기화');
      setChallengeFromTimeline(null);
    }
    
    if (userNickname) {
      const tabTitle = getTabHeaderTitle(activeSection, userNickname);
      
      // write 섹션이 아닐 때만 헤더 리셋
      if (activeSection !== 'write') {
        setHeaderState({
          title: tabTitle,
          showBackButton: false,
          isDetailMode: false,
        });
      }
    }
    
    prevActiveSectionRef.current = activeSection;
  }, [activeSection, userNickname]);

  const handleTitleChange = (title: string) => {
    console.log('🏷️ 헤더 제목 변경:', title);
    setHeaderState(prev => ({
      ...prev,
      title: title,
    }));
  };

  // 챌린지와 함께 일기 작성하기
  const handleWriteDiaryWithChallenge = React.useCallback((challenge: MyChallengeEntry) => {
    console.log('📝 MobileLayout - handleWriteDiaryWithChallenge 호출:', challenge);
    // 챌린지 정보 저장 (일기 작성 후 타임라인으로 돌아가기 위해)
    setChallengeFromTimeline(challenge);
    // 챌린지 인덱스 설정 (먼저 설정하여 DiarySection에서 받을 수 있도록)
    setInitialChallengeIdx(challenge.challengeIdx);
    // 일기 탭으로 이동 (상태 업데이트는 배치 처리되므로 다음 렌더링에서 반영됨)
    // 하지만 즉시 전환하기 위해 여기서도 호출
    onSectionChange('write');
  }, [onSectionChange]);

  // initialChallengeIdx가 설정되면 write 섹션으로 이동 (diary 탭일 때만)
  useEffect(() => {
    if (initialChallengeIdx !== undefined) {
      console.log('📝 initialChallengeIdx 설정됨, write 섹션으로 이동:', initialChallengeIdx, '현재 activeSection:', activeSection);
      // diary 탭일 때만 write 섹션으로 이동
      if (activeSection === 'diary' || activeSection === 'write') {
      if (activeSection !== 'write') {
        console.log('📝 activeSection을 write로 변경');
        onSectionChange('write');
        }
      }
    }
  }, [initialChallengeIdx, activeSection, onSectionChange]);


  // 메인 페이지에서 뒤로가기 처리
  const handleBack = () => {
    if (headerState.onBack) {
      headerState.onBack();
    } else if (isWritingMode) {
      // 고민 작성 모드에서는 목록으로 돌아가기
      handleBackFromWriting();
    } else if (isDetailMode) {
      // 상세모드에서는 목록으로 돌아가기
      setShouldGoBack(true);
    } else {
      // 다른 섹션에서는 일기장으로 돌아가기
      onSectionChange('diary');
    }
  };

  const renderMobileSection = () => {
    switch (activeSection) {
      case 'diary':
        return (
          <MobileDiarySection
            onWritingModeChange={handleWritingModeChange}
            onDetailModeChange={handleDetailModeChange}
            onBackFromWriting={handleBackFromWriting}
            onHeaderSubmit={handleHeaderSubmit}
            onTitleChange={handleTitleChange}
            isSubmitting={isSubmitting}
            setIsSubmitting={setIsSubmitting}
            shouldGoBack={shouldGoBack}
            setShouldGoBack={setShouldGoBack}
            shouldSubmit={shouldSubmit}
            setShouldSubmit={setShouldSubmit}
          />
        );
      case 'calendar':
        return (
          <MobileDiarySection
            onWritingModeChange={handleWritingModeChange}
            onDetailModeChange={handleDetailModeChange}
            onBackFromWriting={handleBackFromWriting}
            onHeaderSubmit={handleHeaderSubmit}
            onTitleChange={handleTitleChange}
            isSubmitting={isSubmitting}
            setIsSubmitting={setIsSubmitting}
            shouldGoBack={shouldGoBack}
            setShouldGoBack={setShouldGoBack}
            shouldSubmit={shouldSubmit}
            setShouldSubmit={setShouldSubmit}
            initialView="calendar"
          />
        );
      case 'write':
        return (
          <MobileDiarySection
            onWritingModeChange={handleWritingModeChange}
            onDetailModeChange={handleDetailModeChange}
            onBackFromWriting={handleBackFromWriting}
            onHeaderSubmit={handleHeaderSubmit}
            onTitleChange={handleTitleChange}
            isSubmitting={isSubmitting}
            setIsSubmitting={setIsSubmitting}
            shouldGoBack={shouldGoBack}
            setShouldGoBack={setShouldGoBack}
            shouldSubmit={shouldSubmit}
            setShouldSubmit={setShouldSubmit}
            initialView="write"
            initialChallengeIdx={initialChallengeIdx}
            onChallengeSelected={() => setInitialChallengeIdx(undefined)}
            onBackToDisk={(showNotification?: boolean) => {
              console.log('🔄 MobileLayout - onBackToDisk 호출:', {
                showNotification,
                challengeFromTimeline: challengeFromTimeline,
                initialChallengeIdx
              });
              setInitialChallengeIdx(undefined);
              if (showNotification) {
                setShowDiaryCompleteNotification(true);
              }
              // challengeFromTimeline이 있으면 타임라인으로 돌아가기 위해 유지
              // 없으면 일반 디스크 탭으로 이동
              onSectionChange('diskbook');
            }}
          />
        );
      case 'challenge':
        return (
          <MobileChallengeSection 
            onTitleChange={handleTitleChange} 
            onDetailModeChange={handleDetailModeChange}
            shouldGoBack={shouldGoBack}
            setShouldGoBack={setShouldGoBack}
          />
        );
      case 'diskbook':
        console.log('📝 MobileLayout - DiskSection 렌더링, handleWriteDiaryWithChallenge:', {
          hasFunction: !!handleWriteDiaryWithChallenge,
          functionType: typeof handleWriteDiaryWithChallenge,
          challengeFromTimeline: challengeFromTimeline
        });
        return (
          <DiskSection 
            onTitleChange={handleTitleChange} 
            onDetailModeChange={handleDetailModeChange} 
            shouldGoBack={shouldGoBack} 
            setShouldGoBack={setShouldGoBack}
            onWriteDiaryWithChallenge={handleWriteDiaryWithChallenge}
            showDiaryCompleteNotification={showDiaryCompleteNotification}
            setShowDiaryCompleteNotification={setShowDiaryCompleteNotification}
            activeTab={activeSection === 'diskbook' ? 'disk' : activeSection}
            challengeFromTimeline={challengeFromTimeline}
            onChallengeTimelineBack={() => setChallengeFromTimeline(null)}
            initialSelectedChallenge={challengeFromTimeline}
          />
        );
      case 'mypage':
        return <MobileMyPageSection onSectionChange={onSectionChange} />;
      case 'trash':
        return <TrashSection />;

      default:
        return <div className="flex items-center justify-center h-64 text-gray-500">Section not found</div>;
    }
  };

  if (!isMobile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Y2K 배경 요소들 */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* 미묘한 그리드 패턴 */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(140, 97, 147, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(140, 97, 147, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px'
          }}
        />
        
        {/* 미묘한 그라데이션 오버레이 */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 via-transparent to-blue-50/20" />
        
        {/* 미묘한 노이즈 효과 */}
        <div 
          className="absolute inset-0 opacity-[0.01]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
          }}
        />
      </div>

      {/* 헤더 */}
      <MobileHeader
        title={headerState.title || `${userNickname}.disk`}
        activeSection={activeSection}
        isWritingMode={isWritingMode}
        isDetailMode={headerState.isDetailMode}
        onBack={handleBack}
        onSubmit={handleHeaderSubmit}
        showBackButton={headerState.showBackButton}
      />

      {/* 메인 컨텐츠 */}
      <div className="relative z-10 pt-14">
        {renderMobileSection()}
      </div>

      {/* 탭바 */}
      <MobileTabBar
        activeTab={displayActiveSection}
        onTabChange={handleTabChange}
      />
    </div>
  );
} 