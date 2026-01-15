// packages/types/src/api/diary.ts
export interface ApiDiary {
  diaryIdx: number;
  content: string;
  emotionIdx: number;
  createdAt: string;
  imageUrls?: string[];
  challengeIdx?: number;
  challengeTitle?: string;

  // 위치 정보 (여행 로그, 위치 기반 로그용)
  latitude?: number;
  longitude?: number;
  locationName?: string;
  address?: string;
  timezone?: string;
}

export interface ApiCalendarDiary {
  diaryIdx: number;
  emotionIdx: number;
  date: string;
  createdAt?: string;
  imageUrls?: string[];
  challengeIdx?: number;
  challengeTitle?: string;

  // 위치 정보
  latitude?: number;
  longitude?: number;
  locationName?: string;
  address?: string;
  timezone?: string;
}

export interface ApiTrashDiary {
  diaryIdx: number;
  content: string;
  emotionIdx: number;
  createdAt: string;
  imageUrls?: string[];
  challengeIdx?: number;
  challengeTitle?: string;

  // 위치 정보
  latitude?: number;
  longitude?: number;
  locationName?: string;
  address?: string;
  timezone?: string;
}
