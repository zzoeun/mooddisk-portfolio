/**
 * React Query 캐시 무효화 전략
 * 데이터 변경 시 관련된 모든 캐시를 효율적으로 무효화
 */

import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "../constants/queryKeys";

export const useCacheInvalidation = () => {
  const queryClient = useQueryClient();

  // 일기 관련 캐시 무효화
  const invalidateDiaryCaches = (
    date?: string,
    year?: number,
    month?: number
  ) => {
    // 특정 날짜의 일기 캐시 무효화
    if (date) {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.DIARY.BY_DATE(date),
      });
    }

    // 특정 월의 캘린더 캐시 무효화
    if (year && month) {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.DIARY.CALENDAR(year, month),
      });
    }

    // 연도별 일기 캐시 무효화
    if (year) {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DIARY.YEAR(year) });
    }

    // 모든 일기 관련 캐시 무효화 (파라미터가 없는 경우)
    if (!date && !year && !month) {
      queryClient.invalidateQueries({ queryKey: ["diaryCalendar"] });
      queryClient.invalidateQueries({ queryKey: ["diaryByDate"] });
      queryClient.invalidateQueries({ queryKey: ["diaryYear"] });
    }
  };

  // 사용자 관련 캐시 무효화
  const invalidateUserCaches = (userId?: string | number) => {
    if (userId) {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER.INFO(userId) });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.USER.STATS(userId),
      });
    } else {
      queryClient.invalidateQueries({ queryKey: ["userInfo"] });
      queryClient.invalidateQueries({ queryKey: ["userStats"] });
    }
  };

  // 챌린지 관련 캐시 무효화
  const invalidateChallengeCaches = (challengeIdx?: string | number) => {
    console.log("🔄 챌린지 캐시 무효화 시작:", { challengeIdx });
    if (challengeIdx) {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.CHALLENGE.DETAIL(challengeIdx),
      });
    }

    // 모든 챌린지 관련 캐시 무효화
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CHALLENGE.ALL });
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.CHALLENGE.MY_CHALLENGES,
    });

    // challengeDiaries 쿼리 무효화 (prefix 매칭으로 모든 participationIdx에 대해 무효화)
    queryClient.invalidateQueries({
      queryKey: ["challengeDiaries"],
      exact: false, // prefix 매칭 활성화
    });

    console.log("✅ 챌린지 캐시 무효화 완료");
  };

  // 휴지통 관련 캐시 무효화
  const invalidateTrashCaches = () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DIARY.TRASH });
  };

  // 일기 작성/수정 후 캐시 무효화
  const invalidateAfterDiaryUpdate = async (
    date: string,
    year: number,
    month: number
  ) => {
    console.log("🔄 일기 작성/수정 후 캐시 무효화 시작:", {
      date,
      year,
      month,
    });
    invalidateDiaryCaches(date, year, month);
    invalidateUserCaches(); // 사용자 통계 업데이트

    // 챌린지 관련 캐시 무효화 (챌린지탭, 디스크탭 업데이트)
    invalidateChallengeCaches();

    // challengeDiaries 쿼리 즉시 refetch (스탬프 업데이트를 위해)
    await queryClient.refetchQueries({
      queryKey: ["challengeDiaries"],
      exact: false,
    });

    console.log("✅ 일기 작성/수정 후 캐시 무효화 완료");
  };

  // 일기 삭제 후 캐시 무효화
  const invalidateAfterDiaryDelete = (
    date: string,
    year: number,
    month: number
  ) => {
    invalidateDiaryCaches(date, year, month);
    invalidateUserCaches(); // 사용자 통계 업데이트
    invalidateTrashCaches(); // 휴지통 업데이트
    invalidateChallengeCaches(); // 챌린지 관련 캐시 무효화 (챌린지탭, 디스크탭 업데이트)
  };

  // 챌린지 참여 후 캐시 무효화
  const invalidateAfterChallengeJoin = (challengeIdx: string | number) => {
    invalidateChallengeCaches(challengeIdx);
    invalidateUserCaches(); // 사용자 통계 업데이트
  };

  // 사용자 정보 수정 후 캐시 무효화
  const invalidateAfterUserUpdate = (userId: string | number) => {
    invalidateUserCaches(userId);
  };

  // 휴지통 복원/완전삭제 후 캐시 무효화
  const invalidateAfterTrashAction = (
    date?: string,
    year?: number,
    month?: number
  ) => {
    invalidateTrashCaches();
    if (date && year && month) {
      invalidateDiaryCaches(date, year, month);
    }
    // 감정 비트맵을 위해 diaryYear 캐시도 무효화
    if (year) {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DIARY.YEAR(year) });
    }
    invalidateUserCaches(); // 사용자 통계 업데이트
    invalidateChallengeCaches(); // 챌린지 관련 캐시 무효화 (복원 시 챌린지 체크 업데이트)
  };

  // 전체 캐시 초기화 (로그아웃 시)
  const clearAllCaches = () => {
    queryClient.clear();
  };

  return {
    // 개별 캐시 무효화
    invalidateDiaryCaches,
    invalidateUserCaches,
    invalidateChallengeCaches,
    invalidateTrashCaches,

    // 액션별 캐시 무효화
    invalidateAfterDiaryUpdate,
    invalidateAfterDiaryDelete,
    invalidateAfterChallengeJoin,
    invalidateAfterUserUpdate,
    invalidateAfterTrashAction,

    // 전체 캐시 관리
    clearAllCaches,
  };
};
