import React, { useState, useEffect } from 'react';
import { ChallengeEntry } from '@mooddisk/types';
import DesignTokens from '../../../constants/designTokens';

interface ChallengeCardProps {
  challenge: ChallengeEntry;
  onClick: () => void;
  onJoin: () => void;
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({
  challenge,
  onClick,
  onJoin,
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const getProgressPercentage = () => {
    if (challenge.duration === 0) return 0;
    const percentage = Math.min((challenge.progress / challenge.duration) * 100, 100);
    return percentage;
  };

  const isTravelLog = challenge.type === 'TRAVEL';

  return (
    <div 
      className="cursor-pointer transition-opacity hover:opacity-80"
      style={{
        backgroundColor: DesignTokens.colors.background,
        border: `${DesignTokens.borders.width} solid ${DesignTokens.colors.border}`,
        width: isMobile ? 'calc(50% - 8px)' : 'calc(25% - 12px)',
        marginBottom: '16px',
      }}
      onClick={onClick}
    >
      {/* 이미지 영역 */}
      <div className="relative h-[120px]">
        {challenge.imageUrl ? (
          <img 
            src={challenge.imageUrl} 
            alt={challenge.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const placeholder = target.nextSibling as HTMLElement;
              if (placeholder) placeholder.style.display = 'flex';
            }}
          />
        ) : null}
        <div 
          className="w-full h-full flex items-center justify-center"
          style={{ 
            backgroundColor: DesignTokens.colors.darkGray,
            display: challenge.imageUrl ? 'none' : 'flex'
          }}
        >
          <span className="text-[32px]" style={{ color: DesignTokens.colors.primary }}>📝</span>
        </div>
      </div>

      {/* 콘텐츠 영역 */}
      <div className="p-3">
        <h3 
          className="font-bold text-base uppercase mb-1 line-clamp-2"
          style={{ 
            color: DesignTokens.colors.primary,
            lineHeight: '20px'
          }}
        >
          {challenge.title}
        </h3>
        
        <p 
          className="text-sm mb-2 line-clamp-2"
          style={{ 
            color: DesignTokens.colors.text,
            lineHeight: '18px'
          }}
        >
          {challenge.description}
        </p>

        {/* 진행률 표시 (참여한 챌린지만) */}
        {challenge.isJoined && (
          <div className="mb-2">
            <div 
              className="h-[10px] mb-1"
              style={{
                backgroundColor: DesignTokens.colors.background,
                border: `2px solid ${DesignTokens.colors.accent}`,
              }}
            >
              <div 
                className="h-full"
                style={{ 
                  width: `${getProgressPercentage()}%`,
                  backgroundColor: DesignTokens.colors.alert 
                }}
              />
            </div>
            <p 
              className="text-xs font-bold uppercase text-right"
              style={{ color: DesignTokens.colors.text }}
            >
              {Math.round(getProgressPercentage())}%
            </p>
          </div>
        )}

        {/* 참여 버튼 (참여하지 않은 챌린지만) */}
        {!challenge.isJoined && (
          isTravelLog ? (
            <button
              disabled
              onClick={(e) => {
                e.stopPropagation();
              }}
              className="w-full py-2 px-4 font-bold text-sm uppercase opacity-50 cursor-not-allowed"
              style={{
                backgroundColor: DesignTokens.colors.lightGray,
                border: `2px solid ${DesignTokens.colors.border}`,
                color: DesignTokens.colors.text,
              }}
            >
              앱에서만 가능
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onJoin();
              }}
              className="w-full py-2 px-4 font-bold text-sm uppercase"
              style={{
                backgroundColor: DesignTokens.colors.accent,
                border: `2px solid ${DesignTokens.colors.text}`,
                color: DesignTokens.colors.text,
              }}
            >
              시작하기
            </button>
          )
        )}
      </div>
    </div>
  );
};
