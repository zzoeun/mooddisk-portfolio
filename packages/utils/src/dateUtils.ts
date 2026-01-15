// 날짜 관련 유틸리티
export const isSameMonth = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth()
  );
};

export const formatDateString = (date: Date | string): string => {
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) {
      return typeof date === "string" ? date : date.toISOString();
    }
    return dateObj.toLocaleDateString("ko-KR");
  } catch {
    return typeof date === "string" ? date : date.toISOString();
  }
};

export const convertKoreanDateToApiFormat = (koreanDate: string): string => {
  // 한국어 날짜를 API 형식으로 변환하는 로직
  return koreanDate;
};

// 날짜 포맷팅 유틸리티
export const formatDateForTitle = (date: Date): string => {
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

  // 날짜에 서수 접미사 추가 (1st, 2nd, 3rd, 4th, ...)
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

// 헤더용 날짜 포맷팅 함수들
export const formatDateForHeader = (date: Date): string => {
  return `${formatDateForTitle(date)}disk`;
};

export const getTodayDateForHeader = (): string => {
  return formatDateForHeader(new Date());
};

export const formatDiaryDateForHeader = (dateString: string): string => {
  const date = new Date(dateString);
  return formatDateForHeader(date);
};
