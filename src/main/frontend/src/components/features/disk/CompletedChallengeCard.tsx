import React from 'react';
import { ChallengeEntry, MyChallengeEntry } from '@mooddisk/types';
import DesignTokens from '../../../constants/designTokens';

interface CompletedChallengeCardProps {
  challenge: ChallengeEntry | MyChallengeEntry;
  periodInfo: {
    days: number;
    label: string;
    color: string;
    bgColor: string;
    textColor: string;
  };
  onPress?: () => void;
}

export const CompletedChallengeCard: React.FC<CompletedChallengeCardProps> = ({
  challenge,
  periodInfo,
  onPress,
}) => {
  // 기간 정보 계산
  const getPeriodInfo = () => {
    const startDate = new Date('startDate' in challenge ? challenge.startDate : challenge.startedAt);
    const endDate = new Date(startDate);
    const durationDays = 'duration' in challenge ? challenge.duration : challenge.durationDays;
    endDate.setDate(startDate.getDate() + durationDays - 1);
    
    const formatDate = (date: Date) => {
      return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
    };
    
    return `${formatDate(startDate)} ~ ${formatDate(endDate)}`;
  };

  // 완료 여부/빈칸 상태 계산
  const getProgressInfo = () => {
    const progressDays = 'progress' in challenge ? challenge.progress : challenge.progressDays;
    const durationDays = 'duration' in challenge ? challenge.duration : challenge.durationDays;
    return `${progressDays}/${durationDays} 기록`;
  };

  // 진행률에 따른 배지 색상
  const getProgressBadgeStyle = () => {
    const progressDays = 'progress' in challenge ? challenge.progress : challenge.progressDays;
    const durationDays = 'duration' in challenge ? challenge.duration : challenge.durationDays;
    const progressRatio = progressDays / durationDays;
    
    if (progressRatio >= 1) {
      // 완료 (100% 이상) - 민트 그린
      return {
        backgroundColor: DesignTokens.colors.accent,
        textColor: DesignTokens.colors.text,
      };
    } else {
      // 실패 - 코랄 핑크
      return {
        backgroundColor: DesignTokens.colors.alert,
        textColor: DesignTokens.colors.text,
      };
    }
  };

  const progressBadge = getProgressBadgeStyle();

  return (
    <div 
      className="p-4 mb-4 mx-4 cursor-pointer hover:bg-gray-50 transition-colors"
      style={{
        backgroundColor: DesignTokens.colors.background,
        border: `${DesignTokens.borders.width} solid ${DesignTokens.colors.border}`,
      }}
      onClick={onPress}
    >
      <div className="flex flex-col">
        <div className="flex justify-between items-center mb-2">
          <h3 
            className="text-base font-bold uppercase flex-1 mr-3"
            style={{ color: DesignTokens.colors.primary }}
          >
            {challenge.title}
          </h3>
          <div 
            className="px-3 py-1 shrink-0"
            style={{ 
              backgroundColor: progressBadge.backgroundColor,
              border: `${DesignTokens.borders.mediumWidth} solid ${DesignTokens.colors.text}`,
            }}
          >
            <span 
              className="text-xs font-bold uppercase"
              style={{ color: progressBadge.textColor }}
            >
              {getProgressInfo()}
            </span>
          </div>
        </div>
        <div className="flex justify-start items-center">
          <span 
            className="text-sm font-bold"
            style={{ color: DesignTokens.colors.text }}
          >
            {getPeriodInfo()}
          </span>
        </div>
      </div>
    </div>
  );
};

