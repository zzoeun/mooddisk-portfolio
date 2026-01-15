// packages/types/src/domain/challenge.ts
export interface ChallengeEntry {
  id: string;
  title: string;
  description: string;
  duration: number | null;
  type?: string; // "NORMAL", "TRAVEL", "GUIDE"
  participants: number;
  progress: number;
  isJoined: boolean;
  startDate: string;
  endDate: string;
  challengeIdx: number;
  isActive: boolean;
  imageUrl?: string;
  progressDays: number;
  completionRate: number;
  consecutiveDays: number;
  status: string;
  rules?: any;
  rewards?: any;
}

export interface MyChallengeEntry {
  participationIdx: number;
  challengeIdx: number;
  title: string;
  description: string;
  status: string;
  progressDays: number;
  durationDays: number | null;
  type?: string; // "NORMAL", "TRAVEL", "GUIDE"
  isCompleted: boolean;
  startedAt: string;

  // 여행 로그 전용 필드
  logName?: string; // 사용자 지정 로그 이름
  destinations?: string; // JSON 문자열 (목적지 정보)
  timezone?: string; // 타임존 (예: "Asia/Seoul", "Europe/Paris") - TRAVEL 로그의 경우 여행지 타임존
}
