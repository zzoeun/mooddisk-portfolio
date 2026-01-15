import { formatDateForTitle } from "./dateUtils";

// 제목 생성 유틸리티
export const generateCalendarTitle = (nickname?: string): string => {
  return nickname ? `${nickname}.disk` : "다이어리 캘린더";
};

export const generateWriteTitle = (date?: Date): string => {
  const dateStr = date
    ? formatDateForTitle(date)
    : formatDateForTitle(new Date());
  return `${dateStr} disk`;
};

export const generateDetailTitle = (date?: Date): string => {
  const dateStr = date
    ? formatDateForTitle(date)
    : formatDateForTitle(new Date());
  return `${dateStr} disk`;
};
