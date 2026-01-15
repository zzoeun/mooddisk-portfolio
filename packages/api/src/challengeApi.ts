// packages/api/src/challengeApi.ts
import instance from "./instance";
import {
  mapApiChallengeToChallengeEntry,
  mapApiMyChallengeToChallengeEntry,
  mapApiDiaryToDiaryEntry,
} from "@mooddisk/mappers";
import type { ChallengeEntry, DiaryEntry } from "@mooddisk/types";

// 타입 정의 (로컬 타입만 유지)
interface ChallengeData {
  content: string;
  images?: File[];
  emotionIdx?: number;
  challengeIdx?: number;
}

interface ChallengeFormData {
  formData: FormData;
  queryString: string;
}

// 일기용 FormData 생성 유틸리티
const createDiaryFormData = (data: ChallengeData): ChallengeFormData => {
  const formData = new FormData();
  formData.append("content", data.content);

  if (data.images && data.images.length > 0) {
    data.images.forEach((image: File, index: number) => {
      formData.append("images", image);
    });
  }

  // 쿼리 파라미터 구성
  const queryParams = new URLSearchParams();
  queryParams.append("content", data.content);

  if (data.emotionIdx !== undefined) {
    queryParams.append("emotionIdx", data.emotionIdx.toString());
  }

  if (data.challengeIdx !== undefined) {
    queryParams.append("challengeIdx", data.challengeIdx.toString());
  }

  const queryString = queryParams.toString();

  return {
    formData,
    queryString,
  };
};

// 모든 챌린지 목록 조회 API
export const getAllChallenges = async (): Promise<ChallengeEntry[]> => {
  const response = await instance.get("/challenge");
  return response.data.map(mapApiChallengeToChallengeEntry);
};

// 내 챌린지 목록 조회 API
export const getMyChallenges = async (): Promise<ChallengeEntry[]> => {
  const response = await instance.get("/my-challenge");
  return response.data.data.map(mapApiMyChallengeToChallengeEntry);
};

// 내 활성 챌린지 목록 조회 API (진행 중인 챌린지만)
export const getMyActiveChallenges = async (): Promise<ChallengeEntry[]> => {
  const response = await instance.get("/my-challenge");
  // 진행 중인 챌린지만 필터링 (status가 'ACTIVE' 또는 'IN_PROGRESS'인 것들)
  const activeChallenges = response.data.data.filter(
    (challenge: any) =>
      challenge.status === "ACTIVE" || challenge.status === "IN_PROGRESS"
  );
  return activeChallenges.map(mapApiMyChallengeToChallengeEntry);
};

// 특정 날짜 이전에 시작된 내 챌린지 목록 조회 API (일기 수정용)
export const getMyChallengesBeforeDate = async (
  beforeDate: string
): Promise<ChallengeEntry[]> => {
  console.log("🔧 getMyChallengesBeforeDate API 호출:", beforeDate);
  const response = await instance.get(
    `/my-challenge/before-date?beforeDate=${beforeDate}`
  );
  console.log("🔧 getMyChallengesBeforeDate API 응답:", response.data);
  const result = response.data.data.map(mapApiMyChallengeToChallengeEntry);
  console.log("🔧 getMyChallengesBeforeDate 변환 결과:", result);
  return result;
};

// 챌린지 상세 조회 API
export const getChallengeById = async (
  challengeIdx: number
): Promise<ChallengeEntry> => {
  const response = await instance.get(`/challenge/${challengeIdx}`);
  return mapApiChallengeToChallengeEntry(response.data);
};

// 챌린지 생성 API
export const createChallenge = async (data: any): Promise<ChallengeEntry> => {
  const response = await instance.post("/challenge", data);
  return mapApiChallengeToChallengeEntry(response.data);
};

// 챌린지 수정 API
export const updateChallenge = async (
  challengeIdx: number,
  data: any
): Promise<ChallengeEntry> => {
  const response = await instance.put(`/challenge/${challengeIdx}`, data);
  return mapApiChallengeToChallengeEntry(response.data);
};

// 챌린지 삭제 API
export const deleteChallenge = async (challengeIdx: number): Promise<void> => {
  await instance.delete(`/challenge/${challengeIdx}`);
};

// 챌린지별 일기 목록 조회 API
export const getDiariesByChallenge = async (
  participationIdx: number
): Promise<DiaryEntry[]> => {
  const response = await instance.get(
    `/challenge/participation/${participationIdx}/diaries`
  );
  // 디버깅: API 응답 확인
  console.log(
    "🔍 getDiariesByChallenge API 응답:",
    JSON.stringify(response.data, null, 2)
  );
  if (response.data && response.data.length > 0) {
    console.log(
      "🔍 첫 번째 일기 원본 데이터:",
      JSON.stringify(response.data[0], null, 2)
    );
  }
  // DiaryResponse[]를 DiaryEntry[]로 변환
  const mapped = response.data.map(mapApiDiaryToDiaryEntry);
  console.log("🔍 매핑된 첫 번째 일기:", JSON.stringify(mapped[0], null, 2));
  return mapped;
};

// 챌린지 참여 API
export const joinChallenge = async (challengeIdx: number): Promise<any> => {
  const response = await instance.post(`/challenge/${challengeIdx}/join`);
  return response.data;
};

// ==================== Travel Log APIs ====================

// 여행 로그 생성 요청 타입
export interface TravelLogCreateRequest {
  logName?: string; // 사용자 지정 로그 이름 (선택)
  destinations: string; // JSON 문자열
  departureDate: string; // YYYY-MM-DD
  returnDate: string; // YYYY-MM-DD
  timezone?: string; // 타임존 (예: "Asia/Seoul", "Europe/Paris") - 선택, 없으면 첫 번째 목적지 좌표로 자동 계산
}

// 여행 로그 응답 타입
export interface TravelLogResponse {
  participationIdx: number;
  challengeIdx: number;
  logName: string;
  destinations: string; // JSON 문자열
  departureDate: string;
  returnDate: string;
  durationDays: number;
  status: string;
  progressDays: number;
  completionRate: number;
}

// 여행 로그 생성 API
export const createTravelLog = async (
  data: TravelLogCreateRequest
): Promise<TravelLogResponse> => {
  const response = await instance.post("/travel-logs", data);
  return response.data.data;
};
