import React, { useMemo } from 'react';
import DesignTokens from '../../../constants/designTokens';

interface ActivityInfoProps {
  userIdx: number;
  userStats?: any;
  trashDiaries?: any[];
  onTrashClick: () => void;
}

export const ActivityInfo: React.FC<ActivityInfoProps> = ({
  userIdx,
  userStats,
  trashDiaries = [],
  onTrashClick,
}) => {
  // 사용자 통계 메모이제이션
  const { totalDiaries, consecutiveDays, firstDiaryDate, totalTrash } = useMemo(() => {
    const stats = userStats?.data || userStats;
    return {
      totalDiaries: stats?.totalDiaries || 0,
      consecutiveDays: stats?.consecutiveDays || 0,
      firstDiaryDate: stats?.firstRecordDate || null,
      totalTrash: trashDiaries?.length || 0,
    };
  }, [userStats, trashDiaries]);

  // 첫 기록일 포맷팅
  const formattedFirstDate = useMemo(() => {
    if (!firstDiaryDate) return '-';
    return new Date(firstDiaryDate).toISOString().split('T')[0].replace(/-/g, '. ') + '.';
  }, [firstDiaryDate]);

  return (
    <div 
      className="mx-4 p-4"
      style={{
        backgroundColor: DesignTokens.colors.background,
        border: `${DesignTokens.borders.width} solid ${DesignTokens.colors.border}`,
      }}
    >
      <div 
        className="px-3 py-1.5 mb-4 inline-block font-bold uppercase"
        style={{
          backgroundColor: DesignTokens.colors.sectionBackground,
          color: DesignTokens.colors.secondary,
          fontSize: '18px',
        }}
      >
        활동 정보
      </div>
      
      {/* 통계 그리드 */}
      <div className="flex flex-wrap">
        {/* 총 일기 수 */}
        <div 
          className="w-1/2 p-4 flex flex-col items-center justify-center"
          style={{
            borderBottom: `2px solid ${DesignTokens.colors.text}`,
            borderRight: `2px solid ${DesignTokens.colors.text}`,
          }}
        >
          <div 
            className="text-base font-bold uppercase mb-1 h-6 flex items-center"
            style={{ color: DesignTokens.colors.primary }}
          >
            {totalDiaries}
          </div>
          <div className="text-xs font-bold uppercase text-center" style={{ color: DesignTokens.colors.text }}>
            총 일기 수
          </div>
        </div>

        {/* 연속 기록일 */}
        <div 
          className="w-1/2 p-4 flex flex-col items-center justify-center"
          style={{
            borderBottom: `2px solid ${DesignTokens.colors.text}`,
          }}
        >
          <div 
            className="text-base font-bold uppercase mb-1 h-6 flex items-center"
            style={{ color: DesignTokens.colors.primary }}
          >
            {consecutiveDays}
          </div>
          <div className="text-xs font-bold uppercase text-center" style={{ color: DesignTokens.colors.text }}>
            연속 기록일
          </div>
        </div>

        {/* 첫 기록일 */}
        <div 
          className="w-1/2 p-4 flex flex-col items-center justify-center"
          style={{
            borderRight: `2px solid ${DesignTokens.colors.text}`,
          }}
        >
          <div 
            className="text-base font-bold uppercase mb-1 h-6 flex items-center text-center"
            style={{ color: DesignTokens.colors.primary, fontSize: '14px' }}
          >
            {formattedFirstDate}
          </div>
          <div className="text-xs font-bold uppercase text-center" style={{ color: DesignTokens.colors.text }}>
            첫 기록일
          </div>
        </div>

        {/* 휴지통 */}
        <button 
          onClick={onTrashClick}
          className="w-1/2 p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
        >
          <div 
            className="text-base font-bold uppercase mb-1 h-6 flex items-center"
            style={{ color: DesignTokens.colors.primary }}
          >
            {totalTrash}
          </div>
          <div className="text-xs font-bold uppercase text-center" style={{ color: DesignTokens.colors.text }}>
            휴지통
          </div>
        </button>
      </div>
    </div>
  );
};


