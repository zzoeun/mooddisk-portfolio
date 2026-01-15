// 감정 관련 유틸리티 (1-6까지만)
export const emotionMapping = {
  HAPPY: {
    idx: 1,
    displayName: "행복",
    color: "#FFD700",
  },
  PROUD: {
    idx: 2,
    displayName: "뿌듯",
    color: "#FFA500",
  },
  PEACEFUL: {
    idx: 3,
    displayName: "평온",
    color: "#98FB98",
  },
  DEPRESSED: {
    idx: 4,
    displayName: "우울",
    color: "#4169E1",
  },
  ANNOYED: {
    idx: 5,
    displayName: "짜증",
    color: "#FF4500",
  },
  FURIOUS: {
    idx: 6,
    displayName: "분노",
    color: "#8B0000",
  },
};

export const getEmotionDisplayName = (emotion: string): string => {
  return (
    emotionMapping[emotion as keyof typeof emotionMapping]?.displayName ||
    emotion
  );
};

export const getEmotionIdxFromString = (emotion: string): number => {
  return emotionMapping[emotion as keyof typeof emotionMapping]?.idx || 1;
};

export const getEmotionFromIdx = (idx: number): string => {
  const emotion = Object.entries(emotionMapping).find(
    ([_, data]) => data.idx === idx
  );
  return emotion ? emotion[0] : "HAPPY";
};

export const getEmotionFilterOptions = () => {
  return [
    { value: "전체", label: "전체" },
    ...Object.entries(emotionMapping).map(([key, data]) => ({
      value: key,
      label: data.displayName,
    })),
  ];
};

// 파일 관련 유틸리티
export const FILE_SIZE_LIMITS = {
  IMAGE_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  IMAGE_MAX_COUNT: 3,
  DIARY_IMAGE: 5 * 1024 * 1024, // 5MB
};

export const validateFileSize = (
  file: File,
  maxSize: number = FILE_SIZE_LIMITS.IMAGE_MAX_SIZE
): boolean => {
  return file.size <= maxSize;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

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

// FormData 생성 유틸리티
export const createFormData = (data: Record<string, any>): FormData => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value);
    }
  });
  return formData;
};

// 일기용 FormData 생성 유틸리티
export const createDiaryFormData = (data: {
  content: string;
  images?: File[];
}): {
  formData: FormData;
  queryString: string;
} => {
  const formData = new FormData();
  formData.append("content", data.content);

  if (data.images && data.images.length > 0) {
    data.images.forEach((image, index) => {
      formData.append("images", image);
    });
  }

  const queryString = `content=${encodeURIComponent(data.content)}`;

  return {
    formData,
    queryString,
  };
};

// 텍스트 유틸리티
export const splitTextByLineBreaks = (text: string): string[] => {
  return text.split("\n");
};

// 클래스명 유틸리티
export const cn = (
  ...classes: (string | undefined | null | false)[]
): string => {
  return classes.filter(Boolean).join(" ");
};

// 페이지네이션 유틸리티
export const handlePaginationResponse = <T, R>(
  response: any,
  mapper: (item: T) => R
) => {
  return {
    data: response.content?.map(mapper) || [],
    totalPages: response.totalPages || 0,
    currentPage: response.number || 0,
    totalElements: response.totalElements || 0,
  };
};

export const handleCounselingPaginationResponse = <T, R>(
  response: any,
  mapper: (item: T) => R
) => {
  return {
    content: response.content?.map(mapper) || [],
    hasNext: response.hasNext || false,
    lastId: response.lastId,
  };
};

// 에러 처리 유틸리티
export const getErrorMessage = (error: any): string => {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.message) {
    return error.message;
  }
  return "알 수 없는 오류가 발생했습니다.";
};

// 감정 매핑 유틸리티 (공통)
export const getPixelEmotionFromKey = (
  emotionKey: string
): "happy" | "proud" | "peaceful" | "depressed" | "annoyed" | "furious" => {
  const emotionToPixelMap: Record<
    string,
    "happy" | "proud" | "peaceful" | "depressed" | "annoyed" | "furious"
  > = {
    HAPPY: "happy",
    PROUD: "proud",
    PEACEFUL: "peaceful",
    DEPRESSED: "depressed",
    ANNOYED: "annoyed",
    FURIOUS: "furious",
  };
  return emotionToPixelMap[emotionKey] || "happy";
};

export const getPixelEmotionFromIdx = (
  emotionIdx: number
): "happy" | "proud" | "peaceful" | "depressed" | "annoyed" | "furious" => {
  const idxToPixelMap: Record<
    number,
    "happy" | "proud" | "peaceful" | "depressed" | "annoyed" | "furious"
  > = {
    1: "happy", // HAPPY
    2: "proud", // PROUD
    3: "peaceful", // PEACEFUL
    4: "depressed", // DEPRESSED
    5: "annoyed", // ANNOYED
    6: "furious", // FURIOUS
  };
  return idxToPixelMap[emotionIdx] || "happy";
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
