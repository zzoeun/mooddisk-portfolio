/**
 * React Query 커스텀 훅 모음
 * 중앙화된 쿼리 로직과 설정을 제공
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "../constants/queryKeys";
import { createQueryOptions, QUERY_DEFAULTS } from "../constants/queryConfig";
import {
  getUserInfo,
  getUserStats,
  getDiaryCalendar,
  getDiaryByDate,
  getDiaryYear,
  getTrashDiaries,
  getAllChallenges,
  getChallengeById,
  getMyChallenges,
  getDiariesByChallenge,
} from "@mooddisk/api";

// 사용자 관련 훅
export const useUserInfo = (userId: string | number | null) => {
  return useQuery({
    queryKey: QUERY_KEYS.USER.INFO(userId!),
    queryFn: async () => {
      if (!userId) return null;
      return await getUserInfo(parseInt(userId.toString()));
    },
    enabled: !!userId,
    ...QUERY_DEFAULTS.USER_INFO,
  });
};

export const useUserStats = (userIdx: string | number | null) => {
  return useQuery({
    queryKey: QUERY_KEYS.USER.STATS(userIdx!),
    queryFn: async () => {
      if (!userIdx) return null;
      return await getUserStats(Number(userIdx));
    },
    enabled: !!userIdx,
    ...QUERY_DEFAULTS.STATS,
  });
};

// 일기 관련 훅
export const useDiaryCalendar = (year: number, month: number) => {
  return useQuery({
    queryKey: QUERY_KEYS.DIARY.CALENDAR(year, month),
    queryFn: async () => await getDiaryCalendar(year, month),
    ...QUERY_DEFAULTS.DIARY,
  });
};

export const useDiaryByDate = (date: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: QUERY_KEYS.DIARY.BY_DATE(date),
    queryFn: async () => await getDiaryByDate(date),
    enabled,
    ...QUERY_DEFAULTS.DIARY,
  });
};

export const useDiaryYear = (year: number) => {
  return useQuery({
    queryKey: QUERY_KEYS.DIARY.YEAR(year),
    queryFn: async () => await getDiaryYear(year),
    ...QUERY_DEFAULTS.DIARY,
  });
};

export const useTrashDiaries = (enabled: boolean = true) => {
  return useQuery({
    queryKey: QUERY_KEYS.DIARY.TRASH,
    queryFn: async () => await getTrashDiaries(),
    enabled,
    ...QUERY_DEFAULTS.TRASH,
  });
};

// 챌린지 관련 훅
export const useChallenges = () => {
  return useQuery({
    queryKey: QUERY_KEYS.CHALLENGE.ALL,
    queryFn: async () => {
      const raw = await getAllChallenges();
      return raw;
    },
    ...QUERY_DEFAULTS.CHALLENGE,
  });
};

export const useChallengeDetail = (challengeIdx: string | number | null) => {
  return useQuery({
    queryKey: QUERY_KEYS.CHALLENGE.DETAIL(challengeIdx!),
    queryFn: async () => {
      if (!challengeIdx) return null;
      return await getChallengeById(Number(challengeIdx));
    },
    enabled: !!challengeIdx,
    ...QUERY_DEFAULTS.CHALLENGE,
  });
};

export const useMyChallenges = () => {
  return useQuery({
    queryKey: QUERY_KEYS.CHALLENGE.MY_CHALLENGES,
    queryFn: async () => (await getMyChallenges()) as unknown as any[],
    ...QUERY_DEFAULTS.CHALLENGE,
  });
};

export const useChallengeDiaries = (
  participationIdx: string | number | null
) => {
  return useQuery({
    queryKey: QUERY_KEYS.CHALLENGE.DIARIES(participationIdx!),
    queryFn: async () => {
      if (!participationIdx) return null;
      return await getDiariesByChallenge(Number(participationIdx));
    },
    enabled: !!participationIdx,
    ...QUERY_DEFAULTS.DIARY,
  });
};

// 캐시 관리 훅
export const useQueryCache = () => {
  const queryClient = useQueryClient();

  const invalidateUserQueries = (userId?: string | number) => {
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

  const invalidateDiaryQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["diaryCalendar"] });
    queryClient.invalidateQueries({ queryKey: ["diaryByDate"] });
    queryClient.invalidateQueries({ queryKey: ["diaryYear"] });
  };

  const invalidateChallengeQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["challenges"] });
    queryClient.invalidateQueries({ queryKey: ["myChallenges"] });
    queryClient.invalidateQueries({ queryKey: ["challengeDiaries"] });
  };

  const invalidateTrashQueries = () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DIARY.TRASH });
  };

  const clearAllCaches = () => {
    queryClient.clear();
  };

  return {
    invalidateUserQueries,
    invalidateDiaryQueries,
    invalidateChallengeQueries,
    invalidateTrashQueries,
    clearAllCaches,
  };
};
