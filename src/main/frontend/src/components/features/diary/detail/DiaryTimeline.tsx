import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { PixelEmotion } from '../../../common/icons';
import { DiaryEntry } from "@mooddisk/types";
import { GenericTimeline, TimelineItem, TimelineActions } from '../../../common/timeline';
import { getPixelEmotionFromIdx } from '@mooddisk/utils';

interface DiaryTimelineProps {
  diaries: DiaryEntry[];
  onEdit?: (diary: DiaryEntry) => void;
  onDelete?: (diaryId: string) => void;
}

export const DiaryTimeline: React.FC<DiaryTimelineProps> = ({ diaries, onEdit, onDelete }) => {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // 콜백들을 useRef로 안정화
  const onEditRef = useRef(onEdit);
  const onDeleteRef = useRef(onDelete);
  useEffect(() => {
    onEditRef.current = onEdit;
    onDeleteRef.current = onDelete;
  }, [onEdit, onDelete]);

  // 메뉴 외부 클릭 시 메뉴 닫기 - useCallback으로 최적화
  const handleClickOutside = useCallback((event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.menu-container')) {
        setOpenMenuId(null);
      }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  // emotionIdx를 EmotionPixel에서 사용하는 감정 이름으로 변환 - useCallback으로 메모이제이션
  const getEmotionForPixel = useCallback((emotionIdx: number) => {
    return getPixelEmotionFromIdx(emotionIdx);
  }, []);

  // DiaryEntry를 TimelineItem으로 변환 - useMemo로 최적화
  const timelineItems: TimelineItem[] = useMemo(() => {
    return diaries.map(diary => ({
    id: diary.id.toString(),
    content: diary.content,
    imageUrls: diary.imageUrls,
    createdAt: diary.createdAt || diary.date,
    author: {
      name: '나', // 일기는 본인이 작성한 것이므로
      emotion: getEmotionForPixel(diary.emotionIdx || 1)
    },
    actions: {
        onEdit: onEditRef.current ? () => onEditRef.current?.(diary) : undefined,
        onDelete: onDeleteRef.current ? () => onDeleteRef.current?.(diary.id.toString()) : undefined
    }
  }));
  }, [diaries, getEmotionForPixel]);

  // 일기 전용 아바타 렌더러 (EmotionPixel 사용) - useCallback으로 메모이제이션
  const renderDiaryAvatar = useCallback((item: TimelineItem) => {
    const emotion = item.author?.emotion as 'happy' | 'proud' | 'peaceful' | 'depressed' | 'annoyed' | 'furious' || 'happy';
    return (
      <PixelEmotion 
        emotion={emotion} 
        size="md" 
        className="rounded-full"
      />
    );
  }, []);

  // 메뉴 토글 핸들러 - useCallback으로 메모이제이션
  const handleToggleMenu = useCallback((itemId: string) => {
    setOpenMenuId(prev => prev === itemId ? null : itemId);
  }, []);

  // 일기 전용 액션 렌더러 - useCallback으로 메모이제이션
  const renderDiaryActions = useCallback((item: TimelineItem) => {
    if (!onEditRef.current && !onDeleteRef.current) return null;
    
    return (
      <TimelineActions
        item={item}
        isOpen={openMenuId === item.id}
        onToggle={() => handleToggleMenu(item.id)}
        onEdit={onEditRef.current ? (item) => {
          const diary = diaries.find(d => d.id.toString() === item.id);
          if (diary) onEditRef.current?.(diary);
        } : undefined}
        onDelete={onDeleteRef.current ? (itemId) => onDeleteRef.current?.(itemId) : undefined}
      />
    );
  }, [openMenuId, diaries, handleToggleMenu]);

  return (
    <GenericTimeline
      items={timelineItems}
      renderAvatar={renderDiaryAvatar}
      renderActions={renderDiaryActions}
    />
  );
};

export default DiaryTimeline;