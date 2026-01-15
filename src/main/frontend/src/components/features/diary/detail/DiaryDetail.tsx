import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Plus } from 'lucide-react';
import { DiaryEntry } from "@mooddisk/types";
import { getDiaryByDate } from '@mooddisk/api';
import { DiaryTimeline } from './DiaryTimeline';
import { convertKoreanDateToApiFormat } from '@mooddisk/utils';
import { FAB } from '../../../common/buttons';
import DesignTokens from '../../../../constants/designTokens';

interface DiaryDetailProps {
  diary: DiaryEntry;
  onEdit: (diary: DiaryEntry) => void;
  onDelete: (diaryId: string) => void;
  onWrite?: () => void;
}

export const DiaryDetail: React.FC<DiaryDetailProps> = ({
  diary,
  onEdit,
  onDelete,
  onWrite,
}) => {
  const [allDiaries, setAllDiaries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // 콜백들을 useRef로 안정화
  const onEditRef = useRef(onEdit);
  const onDeleteRef = useRef(onDelete);
  useEffect(() => {
    onEditRef.current = onEdit;
    onDeleteRef.current = onDelete;
  }, [onEdit, onDelete]);

  // 날짜 형식 변환 - useMemo로 최적화
  const dateStr = useMemo(() => {
    return convertKoreanDateToApiFormat(diary.date);
  }, [diary.date]);

  // 같은 날짜의 모든 일기 가져오기 - useCallback으로 메모이제이션
  const loadAllDiaries = useCallback(async () => {
      try {
        setLoading(true);
        const diaries = await getDiaryByDate(dateStr);
        setAllDiaries(diaries);
      } catch (error) {
        setAllDiaries([diary]); // 실패 시 현재 일기만 표시
      } finally {
        setLoading(false);
      }
  }, [dateStr, diary]);

  // diary.id나 diary.date가 변경될 때만 로드
  useEffect(() => {
    loadAllDiaries();
  }, [diary.id, dateStr, loadAllDiaries]);



  if (loading) {
    return (
      <div className="min-h-screen pb-20">
        <div className="space-y-0">
          {/* 타임라인 스켈레톤 */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="relative">
              {/* 타임라인 연결선 스켈레톤 */}
              {i < 3 && (
                <div 
                  className="absolute animate-pulse" 
                  style={{ 
                    left: '32px', // 패딩 16px + 아바타 중앙 16px = 32px (정중앙)
                    top: i === 0 ? '16px' : '50px', // 첫 번째 아이템은 아바타 중앙(16px)에서 시작, 나머지는 50px
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
                  <div className="flex items-center justify-between">
                    <div 
                      className="h-3 w-16 rounded animate-pulse"
                      style={{ backgroundColor: DesignTokens.colors.lightGray }}
                    />
                    <div 
                      className="w-6 h-6 rounded animate-pulse"
                      style={{ backgroundColor: DesignTokens.colors.lightGray }}
                    />
                  </div>
                  
                  {/* 텍스트 콘텐츠 스켈레톤 */}
                  <div className="space-y-2">
                    <div 
                      className="h-4 rounded animate-pulse"
                      style={{ 
                        backgroundColor: DesignTokens.colors.lightGray,
                        width: '100%'
                      }}
                    />
                    <div 
                      className="h-4 rounded animate-pulse"
                      style={{ 
                        backgroundColor: DesignTokens.colors.lightGray,
                        width: '85%'
                      }}
                    />
                    <div 
                      className="h-4 rounded animate-pulse"
                      style={{ 
                        backgroundColor: DesignTokens.colors.lightGray,
                        width: '70%'
                      }}
                    />
                  </div>
                  
                  {/* 이미지 스켈레톤 */}
                  <div className="flex gap-2">
                    <div 
                      className="w-24 h-24 rounded animate-pulse"
                      style={{ backgroundColor: DesignTokens.colors.lightGray }}
                    />
                    <div 
                      className="w-24 h-24 rounded animate-pulse"
                      style={{ backgroundColor: DesignTokens.colors.lightGray }}
                    />
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
    <div className="min-h-screen">
      <div className="px-4 pb-4">
        {/* 타임라인 형태의 일기 목록 */}
        <DiaryTimeline 
          diaries={allDiaries} 
          onEdit={onEditRef.current}
          onDelete={onDeleteRef.current}
        />
      </div>
      
      {/* FAB 버튼 - 새 일기 작성 */}
      {onWrite && (
        <FAB
          onClick={onWrite}
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


