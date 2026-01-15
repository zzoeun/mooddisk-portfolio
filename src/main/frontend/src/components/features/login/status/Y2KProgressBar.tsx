import React from 'react';
import DesignTokens from '../../../../constants/designTokens';

interface Y2KProgressBarProps {
  progress: number;
}

export const Y2KProgressBar: React.FC<Y2KProgressBarProps> = ({ progress }) => {
  const maxSteps = 8;
  const stepsProgress = (progress / 100) * maxSteps;
  const fullBlocks = Math.floor(stepsProgress);
  const partialBlockFill = stepsProgress % 1;

  return (
    <div 
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
        marginTop: 0,
      }}
    >
      {/* 블록 행 */}
      <div 
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        {Array.from({ length: maxSteps }, (_, index) => {
          const isFullyFilled = index < fullBlocks;
          const isPartiallyFilled = index === fullBlocks && partialBlockFill > 0;

          return (
            <div
              key={index}
              style={{
                position: 'relative',
                width: '24px',
                height: '16px',
                marginHorizontal: '2px',
              }}
            >
              {/* 네온 글로우 효과 (채워진 블록만) */}
              {isFullyFilled && (
                <>
                  <div
                    style={{
                      position: 'absolute',
                      top: '-2px',
                      bottom: '-2px',
                      left: '-2px',
                      right: '-2px',
                      borderRadius: '2px',
                      backgroundColor: 'rgba(168,85,247,0.22)',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '-2px',
                      bottom: '-2px',
                      left: '-2px',
                      right: '-2px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(192,132,252,0.12)',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      bottom: '-4px',
                      left: '-4px',
                      right: '-4px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(233,213,255,0.06)',
                    }}
                  />
                </>
              )}
              {/* 블록 */}
              <div
                style={{
                  width: '24px',
                  height: '16px',
                  borderWidth: '1.5px',
                  borderStyle: 'solid',
                  borderColor: isFullyFilled 
                    ? DesignTokens.colors.secondary 
                    : DesignTokens.colors.mediumGray,
                  overflow: 'hidden',
                  backgroundColor: isFullyFilled 
                    ? DesignTokens.colors.primary 
                    : DesignTokens.colors.lightGray,
                  boxShadow: isFullyFilled
                    ? '0 0 0 rgba(0,0,0,0.25), 0 0 4px rgba(0,0,0,0.25)'
                    : 'none',
                }}
              >
                {/* 부분 채움 */}
                {isPartiallyFilled && (
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${partialBlockFill * 100}%`,
                      backgroundColor: DesignTokens.colors.accent,
                      opacity: 0.9,
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* 레이블 (100%일 때만 표시) */}
      {progress >= 100 && (
        <p 
          style={{
            color: 'rgba(255,255,255,0.8)',
            fontSize: '12px',
            textAlign: 'center',
            marginTop: '6px',
            textShadow: '0 0 2px rgba(168, 85, 247, 0.2)',
            fontFamily: DesignTokens.fonts.default,
          }}
        >
          시스템 로딩 완료!
        </p>
      )}
    </div>
  );
};
