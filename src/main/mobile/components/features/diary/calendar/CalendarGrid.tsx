import React from 'react';
import { View, StyleSheet } from 'react-native';
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
    <View style={styles.grid}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((day, dayIndex) => (
            <CalendarCell
              key={`${rowIndex}-${dayIndex}`}
              day={day}
              onDateClick={onDateClick}
              emotionMapping={emotionMapping}
              getEmotionDisplayName={getEmotionDisplayName}
            />
          ))}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    paddingHorizontal: 0,
    paddingVertical: 16,
    backgroundColor: DesignTokens.colors.background,
    borderRadius: 8,
    marginHorizontal: 0,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around', // CalendarHeader와 동일한 정렬
    marginBottom: 8,
  },
});

export { CalendarGrid };
