import React from 'react';
import { ChallengeEntry, MyChallengeEntry } from '@mooddisk/types';
import DesignTokens from '../../../constants/designTokens';

interface ActiveChallengeCardProps {
  challenge: ChallengeEntry | MyChallengeEntry;
  progress: boolean[];
  periodInfo: {
    days: number;
    label: string;
    color: string;
    bgColor: string;
    textColor: string;
  };
  onPress?: () => void;
}

export const ActiveChallengeCard: React.FC<ActiveChallengeCardProps> = ({
  challenge,
  progress,
  periodInfo,
  onPress
}) => {
  // 스탬프를 7개씩 묶어서 행으로 나누기
  const rows: boolean[][] = [];
  for (let i = 0; i < progress.length; i += 7) {
    rows.push(progress.slice(i, i + 7));
  }

  return (
    <div 
      className="mb-4 mx-4 cursor-pointer hover:bg-gray-50 transition-colors"
      style={{
        backgroundColor: DesignTokens.colors.background,
        border: `${DesignTokens.borders.width} solid ${DesignTokens.colors.border}`,
      }}
      onClick={onPress}
    >
      <div 
        className="p-4"
        style={{
          backgroundColor: DesignTokens.colors.background,
          border: `${DesignTokens.borders.mediumWidth} solid ${DesignTokens.colors.accent}`,
        }}
      >
        {/* 챌린지 헤더 */}
        <div className="flex justify-between items-center mb-3">
          <h3 
            className="text-base font-bold uppercase flex-1"
            style={{ color: DesignTokens.colors.primary }}
          >
            {challenge.title}
          </h3>
          <div 
            className="px-3 py-1"
            style={{ 
              backgroundColor: periodInfo.bgColor,
              border: `${DesignTokens.borders.mediumWidth} solid ${DesignTokens.colors.text}`,
            }}
          >
            <span 
              className="text-xs font-bold uppercase"
              style={{ color: periodInfo.textColor }}
            >
              {periodInfo.label}
            </span>
          </div>
        </div>
        
        {/* 스탬프 그리드 */}
        <div className="space-y-3">
          {rows.map((row, rowIndex) => (
            <div key={rowIndex} className="flex justify-between gap-2">
              {row.map((isCompleted, index) => {
                const dayNumber = rowIndex * 7 + index + 1;
                return (
                  <div key={dayNumber} className="flex flex-col items-center flex-1">
                    <span 
                      className="text-xs font-bold mb-1"
                      style={{ color: DesignTokens.colors.text }}
                    >
                      {dayNumber}
                    </span>
                    <div 
                      className="w-10 h-10 flex items-center justify-center"
                      style={{
                        backgroundColor: isCompleted ? DesignTokens.colors.alert : DesignTokens.colors.background,
                        border: `${DesignTokens.borders.mediumWidth} solid ${DesignTokens.colors.text}`,
                      }}
                    >
                      {isCompleted && (
                        <span 
                          className="text-base font-bold"
                          style={{ color: DesignTokens.colors.text }}
                        >
                          ✓
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              {/* 마지막 행이 7개 미만이면 빈 공간 채우기 */}
              {row.length < 7 && rowIndex === rows.length - 1 && (
                Array.from({ length: 7 - row.length }).map((_, index) => (
                  <div key={`empty-${index}`} className="flex flex-col items-center flex-1">
                    <span className="text-xs font-bold text-transparent mb-1">-</span>
                    <div className="w-10 h-10" />
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

