import React from 'react';
import { PixelEmotion } from '../../../common/icons';
import DesignTokens from '../../../../constants/designTokens';

interface CalendarCellProps {
  day: { date: Date; isCurrentMonth: boolean; diary: any | null };
  onDateClick: (day: any) => void;
  emotionMapping: Record<
    string,
    "happy" | "proud" | "peaceful" | "depressed" | "annoyed" | "furious"
  >;
  getEmotionDisplayName: (emotion: string) => string;
}

const CalendarCell: React.FC<CalendarCellProps> = ({ 
  day, 
  onDateClick, 
  emotionMapping, 
  getEmotionDisplayName 
}) => {
  const hasDiary = day.diary !== null;
  
  return (
      <button
        onClick={() => onDateClick(day)}
        disabled={!day.isCurrentMonth || !hasDiary}
        className="flex-1 flex flex-col items-center justify-center"
        style={{
          aspectRatio: '1',
          minHeight: '50px',
          maxHeight: '60px',
          marginLeft: '1px',
          marginRight: '1px',
        }}
      title={day.isCurrentMonth && hasDiary && day.diary ? 
        `${day.date.getMonth() + 1}월 ${day.date.getDate()}일: ${getEmotionDisplayName(day.diary.emotion)}` : 
        `${day.date.getMonth() + 1}월 ${day.date.getDate()}일`
      }
    >
      <div 
        className="font-bold"
        style={{
          fontSize: '14px',
          marginBottom: '2px',
          color: day.isCurrentMonth ? DesignTokens.colors.gray : DesignTokens.colors.lightPurple,
          fontFamily: DesignTokens.fonts.default,
        }}
      >
        {day.date.getDate()}
      </div>
      
          {day.isCurrentMonth && hasDiary && day.diary ? (
            <div className="flex items-center justify-center" style={{ width: '28px', height: '28px' }}>
              <PixelEmotion
                emotion={day.diary.emotion?.toLowerCase() || 'happy'}
                size="sm"
              />
            </div>
          ) : (
            <div style={{ width: '28px', height: '28px' }}></div>
          )}
    </button>
  );
};

export { CalendarCell };
