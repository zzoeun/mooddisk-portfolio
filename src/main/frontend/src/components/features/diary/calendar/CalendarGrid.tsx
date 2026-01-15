import React from 'react';
import { CalendarCell } from './CalendarCell';
import DesignTokens from '../../../../constants/designTokens';

interface CalendarGridProps {
  days: Array<{ date: Date; isCurrentMonth: boolean; diary: any | null }>;
  onDateClick: (day: any) => void;
  emotionMapping: Record<
    string,
    "happy" | "proud" | "peaceful" | "depressed" | "annoyed" | "furious"
  >;
  getEmotionDisplayName: (emotion: string) => string;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({
  days,
  onDateClick,
  emotionMapping,
  getEmotionDisplayName
}) => {
  // 7일씩 나누어서 행으로 구성
  const rows = [];
  for (let i = 0; i < days.length; i += 7) {
    rows.push(days.slice(i, i + 7));
  }

  return (
    <div 
      className="px-0 mx-0"
      style={{
        paddingTop: '16px',
        paddingBottom: '16px',
      }}
    >
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex justify-around" style={{ marginBottom: '8px' }}>
          {row.map((day, dayIndex) => (
            <CalendarCell
              key={`${rowIndex}-${dayIndex}`}
              day={day}
              onDateClick={onDateClick}
              emotionMapping={emotionMapping}
              getEmotionDisplayName={getEmotionDisplayName}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export { CalendarGrid };
