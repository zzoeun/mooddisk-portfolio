/**
 * React Query 쿼리 키 중앙화 관리
 * 모든 쿼리 키를 한 곳에서 관리하여 일관성과 유지보수성 향상
 */

export const QUERY_KEYS = {
  // 사용자 관련
  USER: {
    INFO: (userId: string | number) => ["userInfo", userId] as const,
    STATS: (userIdx: string | number) => ["userStats", userIdx] as const,
  },

  // 일기 관련
  DIARY: {
    CALENDAR: (year: number, month: number) =>
      ["diaryCalendar", year, month] as const,
    BY_DATE: (date: string) => ["diaryByDate", date] as const,
    YEAR: (year: number) => ["diaryYear", year] as const,
    TRASH: ["trashDiaries"] as const,
  },

  // 챌린지 관련
  CHALLENGE: {
    ALL: ["challenges"] as const,
    DETAIL: (challengeIdx: string | number) =>
      ["challengeDetail", challengeIdx] as const,
    MY_CHALLENGES: ["myChallenges"] as const,
    DIARIES: (participationIdx: string | number) =>
      ["challengeDiaries", participationIdx] as const,
  },

  // 상담 관련
  COUNSELING: {
    LIST: ["counselingList"] as const,
    DETAIL: (counselingId: string | number) =>
      ["counselingDetail", counselingId] as const,
  },
} as const;

// 쿼리 키 타입 추출
export type QueryKeys = typeof QUERY_KEYS;
export type UserQueryKeys = QueryKeys["USER"];
export type DiaryQueryKeys = QueryKeys["DIARY"];
export type ChallengeQueryKeys = QueryKeys["CHALLENGE"];
export type CounselingQueryKeys = QueryKeys["COUNSELING"];
