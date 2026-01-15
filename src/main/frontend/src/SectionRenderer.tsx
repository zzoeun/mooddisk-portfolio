import React, { useState, useCallback } from 'react';
import DiarySection from './pages/web/DiarySection';
import MyPageSection from './pages/web/MyPageSection';
import ChallengeSection from './pages/web/ChallengeSection';
import TrashSection from './pages/web/TrashSection';
import DiskSection from './pages/web/DiskSection';
import { MyChallengeEntry } from '@mooddisk/types';

interface SectionRendererProps {
  activeSection: string;
  onSectionChange?: (section: string) => void;
}

export default function SectionRenderer({ activeSection, onSectionChange }: SectionRendererProps) {
  // 챌린지와 함께 일기 작성하기를 위한 상태 관리
  const [initialChallengeIdx, setInitialChallengeIdx] = useState<number | undefined>(undefined);
  const [challengeFromTimeline, setChallengeFromTimeline] = useState<MyChallengeEntry | null>(null);
  const [showDiaryCompleteNotification, setShowDiaryCompleteNotification] = useState(false);
  const prevActiveSectionRef = React.useRef<string>(activeSection);
  // write 섹션으로 이동하기 전의 섹션을 추적
  const sectionBeforeWriteRef = React.useRef<string>('diary');
  
  // 챌린지와 함께 일기 작성하기
  const handleWriteDiaryWithChallenge = useCallback((challenge: MyChallengeEntry) => {
    console.log('📝 SectionRenderer - handleWriteDiaryWithChallenge 호출:', challenge);
    // 챌린지 정보 저장 (일기 작성 후 타임라인으로 돌아가기 위해)
    setChallengeFromTimeline(challenge);
    // 챌린지 인덱스 설정
    setInitialChallengeIdx(challenge.challengeIdx);
    // 현재 섹션을 저장 (write 섹션으로 이동하기 전)
    sectionBeforeWriteRef.current = activeSection;
    // 일기 작성 섹션으로 이동
    onSectionChange?.('write');
  }, [onSectionChange, activeSection]);

  // 탭 변경 시 write 섹션이면 상태 초기화 및 이전 섹션 추적
  React.useEffect(() => {
    const prevSection = prevActiveSectionRef.current;
    // write 섹션으로 이동할 때 이전 섹션 저장
    if (prevSection !== 'write' && activeSection === 'write') {
      console.log('📝 SectionRenderer - write 섹션으로 이동, 이전 섹션 저장:', prevSection);
      sectionBeforeWriteRef.current = prevSection;
    }
    // write 섹션에서 다른 섹션으로 변경될 때 상태 초기화
    if (prevSection === 'write' && activeSection !== 'write') {
      console.log('🔄 SectionRenderer - write 섹션에서 다른 섹션으로 변경, 상태 초기화');
      setInitialChallengeIdx(undefined);
    }
    // 다른 섹션에서 diskbook으로 변경될 때 challengeFromTimeline 초기화 (write에서 온 경우 제외)
    if (prevSection !== 'write' && prevSection !== 'diskbook' && activeSection === 'diskbook') {
      console.log('🔄 SectionRenderer - 다른 섹션에서 diskbook으로 변경, challengeFromTimeline 초기화');
      setChallengeFromTimeline(null);
    }
    prevActiveSectionRef.current = activeSection;
  }, [activeSection]);

  // initialChallengeIdx가 설정되면 write 섹션으로 이동 (diary 섹션일 때만)
  React.useEffect(() => {
    if (initialChallengeIdx !== undefined) {
      console.log('📝 SectionRenderer - initialChallengeIdx 설정됨, write 섹션으로 이동:', initialChallengeIdx, '현재 activeSection:', activeSection);
      // diary 섹션일 때만 write 섹션으로 이동
      if (activeSection === 'diary' || activeSection === 'write') {
        if (activeSection !== 'write') {
          console.log('📝 SectionRenderer - activeSection을 write로 변경');
          // 현재 섹션을 저장 (write 섹션으로 이동하기 전)
          sectionBeforeWriteRef.current = activeSection;
          onSectionChange?.('write');
        }
      }
      // diskbook 섹션에서도 write 섹션으로 이동 가능
      else if (activeSection === 'diskbook') {
        console.log('📝 SectionRenderer - diskbook에서 write로 이동');
        // 현재 섹션을 저장 (write 섹션으로 이동하기 전)
        sectionBeforeWriteRef.current = activeSection;
        onSectionChange?.('write');
      }
    }
  }, [initialChallengeIdx, activeSection, onSectionChange]);

  // activeSection이 diskbook으로 변경되고 challengeFromTimeline이 있으면 로그 출력
  React.useEffect(() => {
    if (activeSection === 'diskbook' && challengeFromTimeline) {
      console.log('🔄 SectionRenderer - diskbook 섹션으로 이동, challengeFromTimeline 있음:', challengeFromTimeline);
    }
  }, [activeSection, challengeFromTimeline]);
  const getSectionTitle = () => {
    switch (activeSection) {
      case 'diary':
        return '일기';
      case 'challenge':
        return '챌린지';
      case 'diskbook':
        return '디스크';
      case 'mypage':
        return '내 정보';
      case 'trash':
        return '휴지통';
      default:
        return '일기';
    }
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'diary':
        return <DiarySection />;
      case 'write':
        return (
          <DiarySection 
            initialView="write" 
            initialChallengeIdx={initialChallengeIdx}
            onChallengeSelected={() => setInitialChallengeIdx(undefined)}
            onBackToDisk={(showNotification?: boolean) => {
              console.log('🔄 SectionRenderer - onBackToDisk 호출:', {
                showNotification,
                challengeFromTimeline: challengeFromTimeline,
                initialChallengeIdx,
                onSectionChange: !!onSectionChange
              });
              setInitialChallengeIdx(undefined);
              if (showNotification) {
                setShowDiaryCompleteNotification(true);
              }
              // 모바일과 동일하게: challengeFromTimeline이 있으면 먼저 설정하고 섹션 전환
              // challengeFromTimeline은 이미 설정되어 있으므로 그대로 유지
              // challengeFromTimeline을 null로 설정했다가 다시 설정하여 변경 감지 (모바일 패턴)
              if (challengeFromTimeline) {
                const challenge = challengeFromTimeline;
                // challengeFromTimeline을 null로 설정한 후 다시 설정하여 변경 감지
                setChallengeFromTimeline(null);
                // 다음 틱에서 다시 설정 (모바일처럼 탭 전환 전에 설정)
                setTimeout(() => {
                  setChallengeFromTimeline(challenge);
                }, 0);
              }
              console.log('🔄 SectionRenderer - onSectionChange 호출:', 'diskbook');
              onSectionChange?.('diskbook');
              console.log('🔄 SectionRenderer - onSectionChange 호출 완료');
            }}
          />
        );
      case 'challenge':
        return <ChallengeSection />;
      case 'diskbook':
        return (
          <DiskSection 
            onWriteDiaryWithChallenge={handleWriteDiaryWithChallenge}
            showDiaryCompleteNotification={showDiaryCompleteNotification}
            setShowDiaryCompleteNotification={setShowDiaryCompleteNotification}
            activeTab="disk"
            challengeFromTimeline={challengeFromTimeline}
            onChallengeTimelineBack={() => setChallengeFromTimeline(null)}
            initialSelectedChallenge={challengeFromTimeline}
          />
        );
      case 'mypage':
        return <MyPageSection onSectionChange={onSectionChange} />;
      case 'trash':
        return <TrashSection />;
      default:
        return <DiarySection />;
    }
  };

  return {
    title: getSectionTitle(),
    content: renderSection()
  };
} 