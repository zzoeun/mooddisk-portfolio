// packages/api/src/diaryApi.ts
import instance from "./instance";
import {
  mapApiCalendarDiaryToDiaryEntry,
  mapApiDiaryToDiaryEntry,
} from "@mooddisk/mappers";
import type { DiaryEntry } from "@mooddisk/types";

// 타입 정의 (로컬 타입만 유지)
interface DiaryData {
  content: string;
  images?: File[];
  emotionIdx?: number;
  challengeIdx?: number;
}

interface DiaryFormData {
  formData: FormData;
  queryString: string;
}

// 일기용 FormData 생성 유틸리티
const createDiaryFormData = (data: DiaryData): DiaryFormData => {
  const formData = new FormData();
  formData.append("content", data.content);

  if (data.images && data.images.length > 0) {
    data.images.forEach((image, index) => {
      formData.append("images", image);
    });
  }

  // 쿼리 파라미터 구성 (content 제외)
  const queryParams = new URLSearchParams();
  // content는 FormData에만 포함, 쿼리 파라미터에서는 제외

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

// 일기 작성 API
export const createDiary = async (data: DiaryData): Promise<DiaryEntry> => {
  const { formData, queryString } = createDiaryFormData(data);
  const url = `/writediary?${queryString}`;
  const response = await instance.post(url, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return mapApiDiaryToDiaryEntry(response.data.data);
};

// 일기 수정 API
export const updateDiary = async (
  diaryIdx: number,
  data: DiaryData
): Promise<DiaryEntry> => {
  const { formData, queryString } = createDiaryFormData(data);
  const url = `/diary/${diaryIdx}?${queryString}`;
  const response = await instance.put(url, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return mapApiDiaryToDiaryEntry(response.data.data);
};

// 월별 일기 조회 API (달력용)
export const getDiaryCalendar = async (
  year: number,
  month: number
): Promise<DiaryEntry[]> => {
  const response = await instance.get("/mydiary", { params: { year, month } });
  return response.data.data.map(mapApiCalendarDiaryToDiaryEntry);
};

// 1년치 일기 조회 API (감정비트맵용 - 성능 최적화)
export const getDiaryYear = async (year: number): Promise<DiaryEntry[]> => {
  const response = await instance.get("/mydiary/year", { params: { year } });
  return response.data.data.map(mapApiCalendarDiaryToDiaryEntry);
};

// 일기 상세 조회 API
export const getDiaryById = async (diaryIdx: number): Promise<DiaryEntry> => {
  const response = await instance.get(`/diary/${diaryIdx}`);
  return mapApiDiaryToDiaryEntry(response.data.data);
};

// 특정 날짜의 모든 일기 조회 API
export const getDiaryByDate = async (date: string): Promise<DiaryEntry[]> => {
  const response = await instance.get(`/diary/date/${date}`);
  return response.data.data.map(mapApiDiaryToDiaryEntry);
};

// 일기 삭제 API
export const deleteDiary = async (diaryIdx: number): Promise<void> => {
  await instance.delete(`/diary/${diaryIdx}`);
};

// 일기 휴지통으로 이동 API
export const moveToTrash = async (diaryIdx: number): Promise<void> => {
  await instance.post(`/diary/${diaryIdx}/trash`);
};

// 휴지통 일기 목록 조회 API
export const getTrashDiaries = async (): Promise<any> => {
  const response = await instance.get("/diary/trash");
  return response.data.data;
};

// 일기 복원 API
export const restoreDiary = async (diaryIdx: number): Promise<void> => {
  await instance.post(`/diary/${diaryIdx}/restore`);
};

// 일기 영구 삭제 API
export const permanentDeleteDiary = async (diaryIdx: number): Promise<void> => {
  await instance.delete(`/diary/${diaryIdx}/permanent`);
};
