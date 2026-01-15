import React, { useMemo, useEffect } from 'react';
import { getDiariesByChallenge } from '@mooddisk/api';
import { GenericTimeline, TimelineItem } from '../../common/timeline/GenericTimeline';
import DesignTokens from '../../../constants/designTokens';
import { MyChallengeEntry } from '@mooddisk/types';
import { PixelEmotion } from '../../common/icons/PixelEmotion';
import { FAB } from '../../common/buttons/FAB';
import { Plus } from 'lucide-react';

interface ChallengeTimelineProps {
  challenge: MyChallengeEntry;
  diaries: any[];
  onWriteDiary?: (challenge: MyChallengeEntry) => void;
}

const ChallengeTimeline: React.FC<ChallengeTimelineProps> = ({
  challenge,
  diaries,
  onWriteDiary
}) => {
  // 감정 인덱스를 PixelEmotion에서 사용하는 감정 이름으로 변환
  const getEmotionForPixel = (emotionIdx: number) => {
    switch (emotionIdx) {
      case 1: return 'happy';
      case 2: return 'proud';
      case 3: return 'peaceful';
      case 4: return 'depressed';
      case 5: return 'annoyed';
      case 6: return 'furious';
      default: return 'happy';
    }
  };

  // API 응답을 TimelineItem으로 직접 변환
  const timelineItems: TimelineItem[] = useMemo(() => {
    if (!diaries) return [];
    
    return diaries.map((diary: any) => ({
      id: diary.diaryIdx.toString(),
      content: diary.content,
      imageUrls: diary.imageUrls || [],
      createdAt: diary.createdAt,
      author: {
        name: '나', // 챌린지 일기도 본인이 작성한 것이므로
        emotion: getEmotionForPixel(diary.emotionIdx || 1)
      },
      actions: {
        onEdit: undefined, // 챌린지 일기는 편집 불가
        onDelete: undefined // 챌린지 일기는 삭제 불가
      }
    }));
  }, [diaries]);

  // 챌린지 타임라인용 날짜+시간 포맷터
  const formatChallengeTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const hours = date.getHours();
      const minutes = date.getMinutes();
      
      return `${year}. ${month}. ${day}. ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    } catch (error) {
      console.error('챌린지 시간 포맷팅 오류:', error);
      return dateString;
    }
  };

  // 챌린지 전용 아바타 렌더러 (PixelEmotion 사용)
  const renderChallengeAvatar = (item: TimelineItem) => {
    const emotion = item.author?.emotion as 'happy' | 'proud' | 'peaceful' | 'depressed' | 'annoyed' | 'furious' || 'happy';
    return (
      <div className="rounded-lg">
        <PixelEmotion 
          emotion={emotion} 
          size="md" 
        />
      </div>
    );
  };

  // 챌린지가 진행 중인지 확인 (ACTIVE 또는 IN_PROGRESS 상태만 FAB 표시)
  const isActiveChallenge = challenge.status === 'ACTIVE' || challenge.status === 'IN_PROGRESS';
  
  // 디버깅: FAB 표시 조건 확인
  React.useEffect(() => {
    console.log('🔍 ChallengeTimeline FAB 조건 확인:', {
      hasOnWriteDiary: !!onWriteDiary,
      onWriteDiaryType: typeof onWriteDiary,
      onWriteDiaryValue: onWriteDiary,
      challengeStatus: challenge.status,
      challenge: challenge,
      isActiveChallenge,
      willShowFAB: !!onWriteDiary && isActiveChallenge
    });
    if (!onWriteDiary) {
      console.log('❌ FAB 렌더링 안 함: onWriteDiary가 없음');
    }
    if (!isActiveChallenge) {
      console.log('❌ FAB 렌더링 안 함: 완료된 챌린지 (로그 히스토리)');
    }
  }, [onWriteDiary, challenge, isActiveChallenge]);

  // 챌린지 일기가 없는 경우 빈 상태 표시
  if (timelineItems.length === 0) {
    return (
      <div className="pb-5">
        <div className="flex justify-center items-center py-16 px-5">
          <div 
            className="py-10 px-8 text-center min-w-[280px]"
            style={{
              backgroundColor: DesignTokens.colors.background,
              border: `${DesignTokens.borders.width} solid ${DesignTokens.colors.border}`,
            }}
          >
            <p 
              className="text-base font-bold uppercase text-center leading-6"
              style={{ color: DesignTokens.colors.gray }}
            >
              이 로그에 작성된 기록이 없습니다
            </p>
          </div>
        </div>
        {/* 일기 작성 버튼 - 활성 챌린지일 때만 표시 */}
        {isActiveChallenge && onWriteDiary && (
          <FAB
            onClick={() => {
              console.log('📝 FAB 클릭:', challenge, 'onWriteDiary:', onWriteDiary);
              if (onWriteDiary) {
                onWriteDiary(challenge);
              } else {
                console.error('❌ onWriteDiary가 없습니다!');
              }
            }}
            icon={Plus}
            position="bottom-right"
            size="md"
            color="primary"
            customStyle={{ bottom: '80px' }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="pb-5">
      <GenericTimeline
        items={timelineItems}
        renderAvatar={renderChallengeAvatar}
        renderActions={undefined} // 챌린지 일기는 편집/삭제 불가
        formatTime={formatChallengeTime}
      />
      {/* 일기 작성 버튼 - 활성 챌린지일 때만 표시 */}
      {isActiveChallenge && onWriteDiary && (
        <FAB
          onClick={() => {
            console.log('📝 FAB 클릭:', challenge, 'onWriteDiary:', onWriteDiary);
            if (onWriteDiary) {
              onWriteDiary(challenge);
            } else {
              console.error('❌ onWriteDiary가 없습니다!');
            }
          }}
          icon={Plus}
          position="bottom-right"
          size="md"
          color="primary"
          customStyle={{ bottom: '80px' }}
        />
      )}
    </div>
  );
};

export default ChallengeTimeline;


