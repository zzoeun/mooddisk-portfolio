// packages/hooks/src/common/useHeaderTitle.ts
import { useEffect } from "react";

// 타입 정의
interface UseHeaderTitleProps {
  view: "calendar" | "write" | "detail";
  selectedDiary?: any;
  onTitleChange?: (title: string) => void;
  onWritingModeChange?: (isWriting: boolean) => void;
  onDetailModeChange?: (isDetail: boolean) => void;
}

// 제목 생성 유틸리티
const formatDateForTitle = (date: Date): string => {
  const months = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];

  const month = months[date.getMonth()];
  const day = date.getDate();

  const getOrdinalSuffix = (day: number): string => {
    if (day >= 11 && day <= 13) {
      return "th";
    }
    switch (day % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  return `${month} ${day}${getOrdinalSuffix(day)}.`;
};

const generateCalendarTitle = (nickname?: string): string => {
  return nickname ? `${nickname}.disk` : "다이어리 캘린더";
};

const generateWriteTitle = (date?: Date): string => {
  const dateStr = date
    ? formatDateForTitle(date)
    : formatDateForTitle(new Date());
  return `${dateStr} disk`;
};

const generateDetailTitle = (date?: Date): string => {
  const dateStr = date
    ? formatDateForTitle(date)
    : formatDateForTitle(new Date());
  return `${dateStr} disk`;
};

/**
 * 헤더 제목 업데이트를 관리하는 커스텀 훅
 */
export const useHeaderTitle = ({
  view,
  selectedDiary,
  onTitleChange,
  onWritingModeChange,
  onDetailModeChange,
}: UseHeaderTitleProps): void => {
  useEffect(() => {
    if (view === "calendar") {
      const title = generateCalendarTitle();
      onTitleChange?.(title);
      onWritingModeChange?.(false);
    } else if (view === "write") {
      const title = generateWriteTitle();
      onTitleChange?.(title);
      onWritingModeChange?.(true);
    } else if (view === "detail" && selectedDiary) {
      const title = generateDetailTitle();
      onTitleChange?.(title);
      onWritingModeChange?.(false);
      onDetailModeChange?.(true);
    }
  }, [
    view,
    selectedDiary,
    onTitleChange,
    onWritingModeChange,
    onDetailModeChange,
  ]);
};
