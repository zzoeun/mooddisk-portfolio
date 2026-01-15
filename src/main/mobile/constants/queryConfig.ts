/**
 * React Query 공통 설정 및 기본값
 * 모든 쿼리의 일관된 설정을 위한 중앙화된 설정
 */

import { UseQueryOptions } from "@tanstack/react-query";

// 기본 캐시 시간 설정
export const CACHE_TIMES = {
  SHORT: 1000 * 60 * 2, // 2분
  MEDIUM: 1000 * 60 * 5, // 5분
  LONG: 1000 * 60 * 10, // 10분
  VERY_LONG: 1000 * 60 * 30, // 30분
} as const;

// 기본 stale 시간 설정
export const STALE_TIMES = {
  SHORT: 1000 * 60 * 1, // 1분
  MEDIUM: 1000 * 60 * 2, // 2분
  LONG: 1000 * 60 * 5, // 5분
  VERY_LONG: 1000 * 60 * 15, // 15분
} as const;

// 재시도 설정
export const RETRY_CONFIG = {
  DEFAULT: {
    retry: 2,
    retryDelay: (attemptIndex: number) =>
      Math.min(1000 * 2 ** attemptIndex, 30000),
  },
  CRITICAL: {
    retry: 3,
    retryDelay: (attemptIndex: number) =>
      Math.min(1000 * 2 ** attemptIndex, 30000),
  },
  NONE: {
    retry: false,
  },
} as const;

// 쿼리 타입별 기본 설정
export const QUERY_DEFAULTS = {
  // 사용자 정보 - 중간 캐시
  USER_INFO: {
    staleTime: STALE_TIMES.MEDIUM,
    gcTime: CACHE_TIMES.MEDIUM,
    ...RETRY_CONFIG.DEFAULT,
  },

  // 일기 데이터 - 짧은 캐시 (자주 업데이트)
  DIARY: {
    staleTime: STALE_TIMES.SHORT,
    gcTime: CACHE_TIMES.SHORT,
    ...RETRY_CONFIG.DEFAULT,
  },

  // 챌린지 데이터 - 긴 캐시 (자주 변경되지 않음)
  CHALLENGE: {
    staleTime: STALE_TIMES.LONG,
    gcTime: CACHE_TIMES.LONG,
    ...RETRY_CONFIG.DEFAULT,
  },

  // 통계 데이터 - 매우 긴 캐시
  STATS: {
    staleTime: STALE_TIMES.VERY_LONG,
    gcTime: CACHE_TIMES.VERY_LONG,
    ...RETRY_CONFIG.DEFAULT,
  },

  // 휴지통 데이터 - 짧은 캐시
  TRASH: {
    staleTime: STALE_TIMES.SHORT,
    gcTime: CACHE_TIMES.SHORT,
    ...RETRY_CONFIG.DEFAULT,
  },
} as const;

// 공통 쿼리 옵션 생성 헬퍼
export const createQueryOptions = <TData, TError = Error>(
  type: keyof typeof QUERY_DEFAULTS,
  customOptions?: Partial<UseQueryOptions<TData, TError>>
): UseQueryOptions<TData, TError> =>
  ({
    ...QUERY_DEFAULTS[type],
    ...customOptions,
  } as UseQueryOptions<TData, TError>);

// 에러 처리 공통 설정
export const ERROR_HANDLING = {
  onError: (error: Error) => {
    console.error("Query Error:", error);
    // 필요시 전역 에러 처리 로직 추가
  },
} as const;
