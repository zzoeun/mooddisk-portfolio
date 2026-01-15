import React from 'react';
import DesignTokens from '../../../../constants/designTokens';

interface CalendarHeaderProps {
  weekdays: readonly string[];
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({ weekdays }) => (
  <div 
    className="flex justify-around px-0 mx-0"
    style={{
      paddingTop: '8px',
      paddingBottom: '8px',
      marginBottom: '8px',
    }}
  >
    {weekdays.map((day, index) => (
      <div
        key={day}
        className="flex-1 text-center"
      >
        <span
          className="font-bold uppercase"
          style={{
            fontSize: '16px',
            paddingTop: '4px',
            paddingBottom: '4px',
            color: index === 0 ? DesignTokens.colors.alert : index === 6 ? DesignTokens.colors.accent : DesignTokens.colors.text,
            fontFamily: DesignTokens.fonts.default,
          }}
        >
          {day}
        </span>
      </div>
    ))}
  </div>
);

export { CalendarHeader };
