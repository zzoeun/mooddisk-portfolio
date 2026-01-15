import React from 'react';
import { PixelEmotion } from '../../../common/icons';
import { emotionMapping, getPixelEmotionFromIdx } from '@mooddisk/utils';
import DesignTokens from '../../../../constants/designTokens';

interface EmotionSelectorProps {
  selectedEmotion: string;
  onEmotionChange: (emotion: string) => void;
  className?: string;
}

export const EmotionSelector: React.FC<EmotionSelectorProps> = ({
  selectedEmotion,
  onEmotionChange,
  className = ''
}) => {
  const emotions = Object.entries(emotionMapping).map(([key, value]) => ({
    value: key,
    emotion: getPixelEmotionFromIdx(value.idx)
  }));

  return (
    <div 
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}
      className={className}
    >
      <div 
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: '12px'
        }}
      >
        {emotions.map(({ value, emotion }) => (
          <button
            key={value}
            type="button"
            onClick={() => onEmotionChange(value)}
            style={{
              padding: '8px',
              backgroundColor: 'transparent',
              border: selectedEmotion === value 
                ? `2px solid ${DesignTokens.colors.border}` 
                : '2px solid transparent',
              cursor: 'pointer'
            }}
          >
            <PixelEmotion
              emotion={emotion}
              size="md"
            />
          </button>
        ))}
      </div>
    </div>
  );
};


