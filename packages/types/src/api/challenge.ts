// packages/types/src/api/challenge.ts
export interface ApiChallenge {
  challengeIdx: number;
  title: string;
  description: string;
  durationDays: number | null;
  type?: string; // "NORMAL", "TRAVEL", "GUIDE"
  participantCount: number;
  isParticipating?: boolean;
  isActive: boolean;
  imageUrl?: string;
  progressDays?: number;
  myProgress?: number;
  completionRate?: number;
  consecutiveDays?: number;
  myStatus?: string;
  rules?: any;
  rewards?: any;
}

export interface ApiMyChallenge {
  participationIdx?: number;
  challengeIdx: number;
  title: string;
  description: string;
  myStatus: string;
  myProgress?: number;
  durationDays: number | null;
  type?: string; // "NORMAL", "TRAVEL", "GUIDE"
  startedAt?: string;

  // 여행 로그 전용 필드
  logName?: string; // 사용자 지정 로그 이름
  destinations?: string; // JSON 문자열 (목적지 정보)
  timezone?: string; // 타임존 (예: "Asia/Seoul", "Europe/Paris") - TRAVEL 로그의 경우 여행지 타임존
}
