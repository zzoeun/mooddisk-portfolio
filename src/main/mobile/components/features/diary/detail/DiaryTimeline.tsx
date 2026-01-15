import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { PixelEmotion } from '../../../common/icons';
import { DiaryEntry } from "@mooddisk/types";
import { GenericTimeline, TimelineItem } from '../../../common/timeline/GenericTimeline';
import { TimelineActions } from '../../../common/timeline/TimelineActions';
import { LoadingOverlay } from '../../../common/loading';
import DesignTokens from '../../../../constants/designTokens';

interface DiaryTimelineProps {
  diaries: DiaryEntry[];
  onEdit?: (diary: DiaryEntry) => void;
  onDelete?: (diaryId: string) => void;
  formatTime?: (dateString: string) => string;
  isLoading?: boolean;
}

export const DiaryTimeline: React.FC<DiaryTimelineProps> = ({ diaries, onEdit, onDelete, formatTime, isLoading = false }) => {
  // emotionIdx를 EmotionPixel에서 사용하는 감정 이름으로 변환
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

  // DiaryEntry를 TimelineItem으로 변환
  const timelineItems: TimelineItem[] = diaries.map(diary => ({
    id: diary.id.toString(),
    content: diary.content,
    imageUrls: diary.imageUrls,
    createdAt: diary.createdAt || diary.date,
    author: {
      name: '나', // 일기는 본인이 작성한 것이므로
      emotion: getEmotionForPixel(diary.emotionIdx || 1)
    },
    actions: {
      onEdit: onEdit ? () => onEdit(diary) : undefined,
      onDelete: onDelete ? () => onDelete(diary.id.toString()) : undefined
    }
  }));

  // 일기 전용 아바타 렌더러 (EmotionPixel 사용)
  const renderDiaryAvatar = (item: TimelineItem) => {
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

  // 일기 전용 액션 렌더러
  const renderDiaryActions = (item: TimelineItem) => {
    if (!onEdit && !onDelete) return null;
    
    return (
      <TimelineActions
        item={item}
        onEdit={onEdit ? (item) => {
          const diary = diaries.find(d => d.id.toString() === item.id);
          if (diary) onEdit(diary);
        } : undefined}
        onDelete={onDelete ? (itemId) => onDelete(itemId) : undefined}
      />
    );
  };

  // 로딩 중일 때 로딩 오버레이 표시
  if (isLoading) {
    return (
      <LoadingOverlay />
    );
  }

  // 일기가 없는 경우 빈 상태 표시
  if (timelineItems.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>이 날짜에 작성된 일기가 없습니다</Text>
        </View>
      </View>
    );
  }

  return (
    <GenericTimeline
      items={timelineItems}
      renderAvatar={renderDiaryAvatar}
      renderActions={renderDiaryActions}
      formatTime={formatTime}
    />
  );
};

const styles = StyleSheet.create({
  avatar: {
    borderRadius: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
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