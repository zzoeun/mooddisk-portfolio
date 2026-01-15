import React from 'react';
import { Plus } from 'lucide-react';
import { DiaryEntry } from "@mooddisk/types";
import { 
  CalendarHeader, 
  CalendarGrid,
  MonthPicker
} from '.';
import { FAB } from '../../../common/buttons';

// 캘린더 관련 상수
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

// 일기 전용 캘린더 데이터
interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  diary: DiaryEntry | null;
}

// 날짜 유틸리티 함수들
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

// 일기 전용 캘린더 생성 함수
const getCalendarDays = (
  selectedMonth: Date,
  filteredDiaries: DiaryEntry[]
): CalendarDay[] => {
  const year = selectedMonth.getFullYear();
  const month = selectedMonth.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const days: CalendarDay[] = [];

  // 이전 달의 마지막 날들
  const prevMonthDays = getDaysInMonth(year, month - 1);
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, prevMonthDays - i),
      isCurrentMonth: false,
      diary: null,
    });
  }

  // 현재 달의 날들
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const diary = filteredDiaries.find((d) => 
      isSameDate(new Date(d.createdAt), date)
    );

    days.push({
      date,
      isCurrentMonth: true,
      diary: diary || null,
    });
  }

  // 다음 달의 첫 날들 (42개 셀을 채우기 위해)
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
  onWriteClick: () => void;
  showMonthPicker: boolean;
  setShowMonthPicker: (show: boolean) => void;
  currentYear: number;
  setCurrentYear: (year: number) => void;
  showAllTime: boolean;
  setShowAllTime: (show: boolean) => void;
  getEmotionDisplayName: (emotion: string) => string;
  emotionMapping: { [key: string]: 'happy' | 'proud' | 'peaceful' | 'depressed' | 'annoyed' | 'furious' };
}

// 메인 캘린더 컴포넌트
export function DiaryCalendar({
  selectedMonth,
  setSelectedMonth,
  filteredDiaries,
  onDateClick,
  onWriteClick,
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
    <div className="pb-5">
      {/* 월 선택 네비게이션 및 팝업 */}
      <MonthPicker
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        showAllTime={showAllTime}
        onAllTimeChange={setShowAllTime}
        showMonthPicker={showMonthPicker}
        onMonthPickerToggle={setShowMonthPicker}
        currentYear={currentYear}
        onYearChange={setCurrentYear}
        showAllTimeOption={true}
      />

      <CalendarHeader weekdays={WEEKDAYS} />
      <CalendarGrid
        days={calendarDays}
        onDateClick={onDateClick}
        emotionMapping={emotionMapping}
        getEmotionDisplayName={getEmotionDisplayName}
      />

      {/* Floating Action Button */}
      <FAB
        onClick={onWriteClick}
        icon={Plus}
        position="bottom-right"
        size="md"
        color="primary"
        customStyle={{ bottom: '80px' }}
      />
    </div>
  );
}
