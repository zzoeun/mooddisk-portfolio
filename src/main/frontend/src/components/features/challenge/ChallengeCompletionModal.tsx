import React from 'react';
import { MyChallengeEntry } from '@mooddisk/types';
import DesignTokens from '../../../constants/designTokens';

interface ChallengeCompletionModalProps {
  visible: boolean;
  challenge: MyChallengeEntry | null;
  onClose: () => void;
}

export const ChallengeCompletionModal: React.FC<ChallengeCompletionModalProps> = ({
  visible,
  challenge,
  onClose,
}) => {
  // challenge가 없으면 모달을 표시하지 않음
  if (!challenge || !visible) {
    return null;
  }

  const getCompletionMessage = () => {
    const progressDays = challenge.progressDays || 0;
    const durationDays = challenge.durationDays || 0;
    
    if (progressDays >= durationDays) {
      return {
        title: '로그 완료',
        message: `${durationDays}일의 로그가 모여 한 편의 이야기가 되었습니다.`,
        subMessage: '모든 기록이 당신만의 디스크로 남았어요.',
        color: DesignTokens.colors.text,
        bgColor: DesignTokens.colors.accent,
      };
    } else {
      return {
        title: '로그는 계속 됩니다.',
        message: '빈칸도 당신의 로그에 포함돼요.',
        subMessage: '완벽하지 않아도, 이미 충분히 의미 있는 기록이에요.',
        color: DesignTokens.colors.text,
        bgColor: DesignTokens.colors.alert,
      };
    }
  };

  const completionInfo = getCompletionMessage();

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white max-w-md mx-4 w-full"
        style={{
          backgroundColor: completionInfo.bgColor,
          borderWidth: '3px',
          borderColor: DesignTokens.colors.text,
          borderStyle: 'solid',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 flex flex-col items-center">
          <h2 
            className="text-2xl font-bold mb-4 text-center uppercase"
            style={{
              color: completionInfo.color,
              fontFamily: DesignTokens.fonts.default,
            }}
          >
            {completionInfo.title}
          </h2>
          
          <div 
            className="w-full p-4 mb-5"
            style={{
              backgroundColor: DesignTokens.colors.background,
              borderWidth: '2px',
              borderColor: DesignTokens.colors.text,
              borderStyle: 'solid',
            }}
          >
            <h3 
              className="text-lg font-bold mb-2 text-center uppercase"
              style={{
                color: DesignTokens.colors.primary,
                fontFamily: DesignTokens.fonts.default,
              }}
            >
              {challenge.title}
            </h3>
            <p 
              className="text-sm text-center leading-5"
              style={{
                color: DesignTokens.colors.text,
                fontFamily: DesignTokens.fonts.default,
              }}
            >
              {challenge.description}
            </p>
          </div>

          <div className="w-full mb-5">
            <p 
              className="text-base font-bold mb-2 text-center uppercase"
              style={{
                color: DesignTokens.colors.text,
                fontFamily: DesignTokens.fonts.default,
              }}
            >
              진행률: {Math.round(((challenge.progressDays || 0) / (challenge.durationDays || 1)) * 100)}%
            </p>
            <div 
              className="w-full h-3"
              style={{
                backgroundColor: DesignTokens.colors.background,
                borderWidth: '2px',
                borderColor: DesignTokens.colors.text,
                borderStyle: 'solid',
                overflow: 'hidden',
              }}
            >
              <div 
                className="h-full"
                style={{
                  width: `${Math.min(100, ((challenge.progressDays || 0) / (challenge.durationDays || 1)) * 100)}%`,
                  backgroundColor: completionInfo.color,
                }}
              />
            </div>
          </div>

          <p 
            className="text-base text-center leading-6 mb-3 font-bold"
            style={{
              color: completionInfo.color,
              fontFamily: DesignTokens.fonts.default,
            }}
          >
            {completionInfo.message}
          </p>

          <p 
            className="text-sm text-center leading-5 mb-6 font-bold"
            style={{
              color: completionInfo.color,
              fontFamily: DesignTokens.fonts.default,
            }}
          >
            {completionInfo.subMessage}
          </p>

          <button
            onClick={onClose}
            className="px-8 py-3 uppercase font-bold"
            style={{
              backgroundColor: DesignTokens.colors.primary,
              borderWidth: '2px',
              borderColor: DesignTokens.colors.text,
              borderStyle: 'solid',
              color: DesignTokens.colors.text,
              fontFamily: DesignTokens.fonts.default,
            }}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

