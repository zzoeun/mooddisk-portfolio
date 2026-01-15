import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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
    <TouchableOpacity
      onPress={() => onDateClick(day)}
      style={[
        styles.container,
        day.isCurrentMonth && hasDiary && styles.hasDiaryContainer,
        day.isCurrentMonth && !hasDiary && styles.noDiaryContainer,
      ]}
      disabled={!day.isCurrentMonth || !hasDiary}
    >
      <Text style={[
        styles.dateText, 
        !day.isCurrentMonth && styles.notCurrentMonth
      ]}>
        {day.date.getDate()}
      </Text>
      
      {day.isCurrentMonth && hasDiary && day.diary ? (
        <View style={styles.emotionContainer}>

          <PixelEmotion
            emotion={day.diary.emotion?.toLowerCase() || 'happy'}
            size="md"
          />
        </View>
      ) : (
        <View style={styles.emotionPlaceholder} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, // CalendarHeader와 동일한 flex 설정
    aspectRatio: 1, // 정사각형 유지
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 1, // 좌우 여백 줄여서 더 크게
    minHeight: 60, // 최소 높이 설정으로 더 크게
  },
  hasDiaryContainer: {
    backgroundColor: DesignTokens.colors.background,
  },
  noDiaryContainer: {
    backgroundColor: DesignTokens.colors.background,
  },
  dateText: {
    fontSize: 14, // 조금 작게
    color: DesignTokens.colors.gray, // 회색
    marginBottom: 2, // 간격 줄이기
    fontWeight: 'bold', // 굵게
    fontFamily: DesignTokens.fonts.default,
  },
  notCurrentMonth: {
    color: DesignTokens.colors.lightPurple, // 흐린 보라색
  },
  emotionContainer: {
    width: 32, // 더 작게
    height: 32, // 더 작게
    alignItems: 'center',
    justifyContent: 'center',
  },
  emotionPlaceholder: {
    width: 32, // 더 작게
    height: 32, // 더 작게
  },
});

export { CalendarCell };
