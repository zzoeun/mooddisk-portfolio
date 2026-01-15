// packages/types/src/domain/diary.ts
export interface DiaryEntry {
  id: string;
  content: string;
  emotion: string;
  emotionIdx: number;
  date: string;
  createdAt: string;
  imageUrls: string[];
  challengeIdx?: number;
  challengeTitle?: string;

  // 위치 정보 (여행 로그, 위치 기반 로그용)
  latitude?: number;
  longitude?: number;
  locationName?: string;
  address?: string;
  timezone?: string;
}
