// packages/mappers/src/challengeMapper.ts

// 타입 정의
interface ApiChallenge {
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

interface ApiMyChallenge {
  participationIdx?: number;
  challengeIdx: number;
  title: string;
  description: string;
  myStatus: string;
  myProgress?: number;
  durationDays: number | null;
  type?: string; // "NORMAL", "TRAVEL", "GUIDE"
  startedAt?: string;
  logName?: string;
  destinations?: string;
  timezone?: string; // 타임존 (예: "Asia/Seoul", "Europe/Paris") - TRAVEL 로그의 경우 여행지 타임존
}

interface ChallengeEntry {
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

interface MyChallengeEntry {
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
  logName?: string;
  destinations?: string;
  timezone?: string;
}

// 공통 헬퍼 함수들
const formatKoreanDate = (date: Date): string => {
  return date.toLocaleDateString("ko-KR").replace(/\./g, ".").slice(0, -1);
};

const calculateEndDate = (durationDays: number): string => {
  const endDate = new Date(
    new Date().getTime() + durationDays * 24 * 60 * 60 * 1000
  );
  return formatKoreanDate(endDate);
};

const calculateCompletionRate = (
  progress: number | undefined,
  duration: number | undefined
): number => {
  return progress && duration ? (progress / duration) * 100 : 0;
};

const getChallengeStatus = (status: string | undefined): string => {
  return status || "PENDING";
};

// 공통 기본 데이터 생성
const createBaseChallengeData = (
  apiChallenge: ApiChallenge
): ChallengeEntry => {
  console.log("🔧 createBaseChallengeData 호출됨:", {
    title: apiChallenge.title,
    type: apiChallenge.type, // type 필드 추가
    progressDays: apiChallenge.progressDays,
    myProgress: apiChallenge.myProgress,
    isParticipating: apiChallenge.isParticipating,
    calculatedProgress:
      apiChallenge.progressDays || apiChallenge.myProgress || 0,
  });

  const result = {
    id: apiChallenge.challengeIdx.toString(),
    title: apiChallenge.title,
    description: apiChallenge.description,
    duration: apiChallenge.durationDays,
    type: apiChallenge.type, // type 필드 추가
    participants: apiChallenge.participantCount,
    progress: apiChallenge.progressDays || apiChallenge.myProgress || 0,
    isJoined: apiChallenge.isParticipating || false,
    startDate: formatKoreanDate(new Date()),
    endDate: apiChallenge.durationDays
      ? calculateEndDate(apiChallenge.durationDays)
      : "",
    challengeIdx: apiChallenge.challengeIdx,
    isActive: apiChallenge.isActive,
    imageUrl: apiChallenge.imageUrl,
    progressDays: apiChallenge.progressDays || apiChallenge.myProgress || 0,
    completionRate:
      apiChallenge.completionRate !== undefined
        ? apiChallenge.completionRate
        : calculateCompletionRate(
            apiChallenge.myProgress,
            apiChallenge.durationDays || 0
          ),
    consecutiveDays: apiChallenge.consecutiveDays || 0,
    status: getChallengeStatus(apiChallenge.myStatus),
  };

  console.log("🔧 createBaseChallengeData 결과:", {
    title: result.title,
    type: result.type, // type 필드 추가
    progress: result.progress,
    progressDays: result.progressDays,
    isJoined: result.isJoined,
  });

  return result;
};

/**
 * API Challenge 응답을 프론트엔드 ChallengeListEntry 타입으로 변환
 * ChallengeListResponse와 ChallengeDetailResponse 모두 지원
 */
export const mapApiChallengeToChallengeEntry = (
  apiChallenge: ApiChallenge
): ChallengeEntry => {
  console.log("🔧 mapApiChallengeToChallengeEntry 호출됨:", {
    title: apiChallenge.title,
    type: apiChallenge.type, // type 필드 추가
    progressDays: apiChallenge.progressDays,
    myProgress: apiChallenge.myProgress,
    isParticipating: apiChallenge.isParticipating,
  });

  const baseData = createBaseChallengeData(apiChallenge);

  console.log("🔧 createBaseChallengeData 결과:", {
    title: baseData.title,
    progress: baseData.progress,
    progressDays: baseData.progressDays,
    isJoined: baseData.isJoined,
  });

  // ChallengeDetailResponse인 경우 추가 필드 포함
  if ("rules" in apiChallenge || "rewards" in apiChallenge) {
    return {
      ...baseData,
      rules: apiChallenge.rules,
      rewards: apiChallenge.rewards,
    };
  }
  return baseData;
};

/**
 * API MyChallenge 응답을 프론트엔드 ChallengeEntry 타입으로 변환
 */
export const mapApiMyChallengeToChallengeEntry = (
  apiMyChallenge: ApiMyChallenge
): MyChallengeEntry => {
  return {
    participationIdx:
      apiMyChallenge.participationIdx || apiMyChallenge.challengeIdx,
    challengeIdx: apiMyChallenge.challengeIdx,
    title: apiMyChallenge.title,
    description: apiMyChallenge.description,
    status: apiMyChallenge.myStatus,
    progressDays: apiMyChallenge.myProgress || 0,
    durationDays: apiMyChallenge.durationDays,
    type: apiMyChallenge.type, // type 필드 추가
    isCompleted: apiMyChallenge.myStatus === "COMPLETED",
    startedAt: apiMyChallenge.startedAt || new Date().toISOString(),
    logName: apiMyChallenge.logName,
    destinations: apiMyChallenge.destinations,
    timezone: apiMyChallenge.timezone,
  };
};
