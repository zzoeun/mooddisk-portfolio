import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getDiariesByChallenge } from '@mooddisk/api';
import { GenericTimeline, TimelineItem } from '../../common/timeline/GenericTimeline';
import { PixelEmotion } from '../../common/icons';
import { FAB } from '../../common/buttons/FAB';
import DesignTokens from '../../../constants/designTokens';
import { MyChallengeEntry, DiaryEntry } from '@mooddisk/types';

interface ChallengeTimelineProps {
  challenge: MyChallengeEntry;
  onBack: () => void;
  onWriteDiary?: (challenge: MyChallengeEntry) => void;
}

const ChallengeTimelineScreen: React.FC<ChallengeTimelineProps> = ({
  challenge,
  onBack,
  onWriteDiary,
}) => {
  // React Query로 캐시된 데이터 사용 (이미 DiskScreen에서 프리로딩됨) - 전역 5분 캐시 사용
  const { data: response, isLoading } = useQuery({
    queryKey: ['challengeDiaries', challenge.participationIdx],
    queryFn: async () => await getDiariesByChallenge(challenge.participationIdx),
  });

  // 감정 인덱스를 EmotionPixel에서 사용하는 감정 이름으로 변환
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
    if (!response) return [];
    
    return response.map((diary: DiaryEntry) => {
      // 디버깅: 위치 정보 확인
      if (challenge.type === 'TRAVEL') {
        console.log('📍 트래블로그 일기 위치 정보:', {
          diaryIdx: diary.id,
          latitude: diary.latitude,
          longitude: diary.longitude,
          locationName: diary.locationName,
          address: diary.address,
          hasLocation: !!(diary.locationName || (diary.latitude && diary.longitude)),
        });
      }
      
      return {
        // DiaryEntry는 id 필드를 사용
        id: diary.id,
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
        },
        // 위치 정보 (트래블로그일 때만)
        latitude: diary.latitude,
        longitude: diary.longitude,
        locationName: diary.locationName,
        address: diary.address,
      };
    });
  }, [response, challenge.type]);

  // 챌린지 타임라인용 날짜+시간 포맷터
  const formatChallengeTime = (dateString: string, item?: TimelineItem) => {
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

  // 챌린지 전용 아바타 렌더러 (EmotionPixel 사용)
  const renderChallengeAvatar = (item: TimelineItem) => {
    const emotion = item.author?.emotion as 'happy' | 'proud' | 'peaceful' | 'depressed' | 'annoyed' | 'furious' || 'happy';
    return (
      <View style={styles.avatar}>
        <PixelEmotion 
          emotion={emotion} 
          size="md" 
        />
      </View>
    );
  };

  // 챌린지가 진행 중인지 확인 (ACTIVE 또는 IN_PROGRESS 상태만 FAB 표시)
  const isActiveChallenge = challenge.status === 'ACTIVE' || challenge.status === 'IN_PROGRESS';

  // 다가오는 로그인지 확인 (출발일이 오늘 이후인 TRAVEL 로그)
  const isUpcomingChallenge = (): boolean => {
    if (challenge.type === 'TRAVEL' && challenge.startedAt) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startDate = new Date(challenge.startedAt);
      startDate.setHours(0, 0, 0, 0);
      return startDate > today;
    }
    return false;
  };

  // 다가오는 로그인 경우 안내 메시지 표시
  if (isUpcomingChallenge()) {
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${month}월 ${day}일`;
    };
    
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              이 로그는 {formatDate(challenge.startedAt)}부터 기록할 수 있어요.{'\n\n'}여행이 시작되면 타임라인이 열려요.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // 챌린지 일기가 없는 경우 빈 상태 표시
  if (timelineItems.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>이 로그에 작성된 기록이 없습니다</Text>
          </View>
        </View>
        {/* 일기 작성 버튼 - 진행 중인 챌린지만 표시 */}
        {onWriteDiary && isActiveChallenge && (
          <FAB
            onPress={() => onWriteDiary(challenge)}
            icon="plus"
          />
        )}
      </View>
    );
  }

  // 타임존 헤더 컴포넌트
  const timezoneHeader = challenge.type === 'TRAVEL' && challenge.timezone ? (
    <View style={styles.timezoneHeaderContainer}>
      <Text style={styles.timezoneHeaderText}>
      ✨ 이 로그는 {challenge.timezone} 시간대로 기록됩니다.
      </Text>
    </View>
  ) : null;

  return (
    <View style={styles.container}>
      <GenericTimeline
        items={timelineItems}
        renderAvatar={renderChallengeAvatar}
        renderActions={undefined} // 챌린지 일기는 편집/삭제 불가
        formatTime={formatChallengeTime}
        ListHeaderComponent={timezoneHeader}
      />
      {/* 일기 작성 버튼 - 진행 중인 챌린지만 표시 */}
      {onWriteDiary && isActiveChallenge && (
        <FAB
          onPress={() => onWriteDiary(challenge)}
          icon="plus"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  avatar: {
    borderRadius: 20,
  },
  timezoneHeaderContainer: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 12,
    alignItems: 'center',
  },
  timezoneHeaderText: {
    fontSize: 14,
    color: DesignTokens.colors.gray,
    fontFamily: DesignTokens.fonts.default,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: -150,
    pointerEvents: 'box-none',
  },
  emptyBox: {
    backgroundColor: DesignTokens.colors.background,
    borderWidth: 3,
    borderColor: DesignTokens.colors.border,
    paddingVertical: 40,
    paddingHorizontal: 30,
    alignItems: 'center',
    minWidth: 280,
  },
  emptyText: {
    fontSize: 16,
    color: DesignTokens.colors.gray,
    fontFamily: DesignTokens.fonts.default,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default ChallengeTimelineScreen;
