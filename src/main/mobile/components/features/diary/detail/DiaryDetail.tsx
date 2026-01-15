import React, { useMemo, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DiaryEntry } from "@mooddisk/types";
import { useDiaryByDate } from '../../../../hooks/useQueries';
import { DiaryTimeline } from './DiaryTimeline';
import { convertKoreanDateToApiFormat } from '@mooddisk/utils';
import DesignTokens from '../../../../constants/designTokens';

interface DiaryDetailProps {
  diary: DiaryEntry;
  allDiaries?: DiaryEntry[]; // 일기 캘린더에서 가져온 모든 일기 데이터
  onEdit: (diary: DiaryEntry) => void;
  onDelete: (diaryId: string) => void;
}

export const DiaryDetail: React.FC<DiaryDetailProps> = ({
  diary,
  allDiaries: calendarDiaries,
  onEdit,
  onDelete,
}) => {
  // 날짜 형식 변환: "2025. 08. 27." -> "2025-08-27"
  // DiaryEntry.date는 보통 "YYYY-MM-DD" 형식이지만, 안전을 위해 변환 처리
  const dateStr = useMemo(() => {
    const date = diary.date.includes('.') 
      ? convertKoreanDateToApiFormat(diary.date)
      : diary.date;
    return date;
  }, [diary.date]);

  // 캘린더에서 같은 날짜의 일기들을 먼저 찾아보기
  const sameDateDiaries = useMemo(() => {
    if (calendarDiaries && calendarDiaries.length > 0) {
      return calendarDiaries.filter(d => d.date === diary.date);
    }
    return [];
  }, [calendarDiaries, diary.date]);

  // 항상 API 호출하여 본문과 이미지 등 상세 정보 가져오기
  const needFetchFromApi = useMemo(() => {
    return true; // 항상 API 호출하여 본문과 이미지 가져오기
  }, []);

  // 캘린더에 데이터가 없거나(=없음) 또는 본문이 비어있으면 API 호출 - 중앙화된 훅 사용
  const { data: apiDiaries = [], isLoading, refetch } = useDiaryByDate(dateStr, needFetchFromApi);

  // 일기 작성 후 상세페이지로 이동할 때 데이터 새로고침
  useEffect(() => {
    if (needFetchFromApi) {
      refetch();
    }
  }, [diary.id, refetch, needFetchFromApi]);

  // 삭제 후 타임라인 업데이트를 위해 onDelete 콜백 래핑
  // DiaryScreen에서 이미 쿼리 무효화 및 refetch를 수행하므로, 여기서는 즉시 refetch만 수행
  const handleDelete = useMemo(() => {
    return async (diaryId: string) => {
      await onDelete(diaryId);
      // DiaryScreen에서 이미 refetch를 수행하지만, 안전을 위해 즉시 refetch
      // 지연 없이 즉시 실행하여 타임라인 업데이트
      refetch();
    };
  }, [onDelete, refetch]);

  // 최종 일기 목록 (API 데이터 우선, 없으면 캘린더 데이터)
  const finalDiaries = useMemo(() => {
    return apiDiaries.length > 0 ? apiDiaries : sameDateDiaries;
  }, [apiDiaries, sameDateDiaries]);

  return (
    <View style={styles.container}>
      <DiaryTimeline 
        diaries={finalDiaries} 
        onEdit={onEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignTokens.colors.background,
  },
});