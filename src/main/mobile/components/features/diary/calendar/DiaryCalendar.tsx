import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { DiaryEntry } from "@mooddisk/types/domain/diary";
import { CalendarHeader } from './CalendarHeader';
import { CalendarGrid } from './CalendarGrid';
import { MonthPicker } from './MonthPicker';
import DesignTokens from '../../../../constants/designTokens';

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

const isSameDate = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number): number => {
  return new Date(year, month, 1).getDay();
};

const getCalendarDays = (
  selectedMonth: Date,
  filteredDiaries: DiaryEntry[]
) => {
  const year = selectedMonth.getFullYear();
  const month = selectedMonth.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  console.log('📅 달력 생성 - 월:', `${year}-${month + 1}`, '일기 개수:', filteredDiaries.length);
  console.log('📅 일기 데이터:', filteredDiaries.map(d => ({ id: d.id, date: d.date, createdAt: d.createdAt })));

  const days = [];

  const prevMonthDays = getDaysInMonth(year, month - 1);
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, prevMonthDays - i),
      isCurrentMonth: false,
      diary: null,
    });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    const diary = filteredDiaries.find((d) => {
      // d.date 또는 d.createdAt 중 하나라도 매치되면 선택
      return d.date === dateString || d.createdAt === dateString;
    });
    
    if (diary) {
      console.log('📅 일기 매칭 성공:', dateString, '일기 ID:', diary.id);
    }

    days.push({
      date,
      isCurrentMonth: true,
      diary: diary || null,
    });
  }

  const remainingDays = 42 - days.length;
  for (let day = 1; day <= remainingDays; day++) {
    days.push({
      date: new Date(year, month + 1, day),
      isCurrentMonth: false,
      diary: null,
    });
  }

  return days;
};

interface DiaryCalendarProps {
  selectedMonth: Date;
  setSelectedMonth: (date: Date) => void;
  filteredDiaries: DiaryEntry[];
  onDateClick: (day: { date: Date; isCurrentMonth: boolean; diary: DiaryEntry | null }) => void;
  showMonthPicker: boolean;
  setShowMonthPicker: (show: boolean) => void;
  currentYear: number;
  setCurrentYear: (year: number) => void;
  showAllTime: boolean;
  setShowAllTime: (show: boolean) => void;
  getEmotionDisplayName: (emotion: string) => string;
  emotionMapping: { [key: string]: 'happy' | 'proud' | 'peaceful' | 'depressed' | 'annoyed' | 'furious' };
}

export function DiaryCalendar({
  selectedMonth,
  setSelectedMonth,
  filteredDiaries,
  onDateClick,
  showMonthPicker,
  setShowMonthPicker,
  currentYear,
  setCurrentYear,
  showAllTime,
  setShowAllTime,
  getEmotionDisplayName,
  emotionMapping
}: DiaryCalendarProps) {
  const calendarDays = getCalendarDays(selectedMonth, filteredDiaries);

  return (
    <View style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            <MonthPicker
                selectedMonth={selectedMonth}
                onMonthChange={setSelectedMonth}
                showAllTime={showAllTime}
                onAllTimeChange={setShowAllTime}
                showMonthPicker={showMonthPicker}
                onMonthPickerToggle={setShowMonthPicker}
                currentYear={currentYear}
                onYearChange={setCurrentYear}
            />
            <CalendarHeader weekdays={WEEKDAYS} />
            <CalendarGrid
                days={calendarDays}
                onDateClick={onDateClick}
                emotionMapping={emotionMapping}
                getEmotionDisplayName={getEmotionDisplayName}
            />
        </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: DesignTokens.colors.background,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 20, // 기본 여백만 유지
    }
});
