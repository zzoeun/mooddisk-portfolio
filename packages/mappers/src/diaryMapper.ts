import { DiaryEntry } from "@mooddisk/types";
import { ApiDiary, ApiCalendarDiary, ApiTrashDiary } from "@mooddisk/types";

// 임시로 getEmotionFromIdx 함수 직접 구현
const getEmotionFromIdx = (idx: number): string => {
  const emotionMapping = {
    1: "HAPPY",
    2: "PROUD",
    3: "PEACEFUL",
    4: "DEPRESSED",
    5: "ANNOYED",
    6: "FURIOUS",
  };
  return emotionMapping[idx as keyof typeof emotionMapping] || "HAPPY";
};

/**
 * API Diary 응답을 프론트엔드 DiaryEntry 타입으로 변환
 */

console.log("diaryMapper");

export const mapApiDiaryToDiaryEntry = (apiDiary: ApiDiary): DiaryEntry => {
  // emotion 필드 처리
  const emotion = getEmotionFromIdx(apiDiary.emotionIdx);

  // date 필드 처리 - createdAt을 YYYY-MM-DD 형식으로 변환
  const formatDate = (dateString: string) => {
    try {
      if (dateString.includes("T")) {
        // ISO 형식인 경우 날짜 부분만 추출 (타임존 변환 방지)
        return dateString.split("T")[0];
      }
      return dateString;
    } catch (error) {
      console.error("날짜 포맷팅 오류:", error);
      return dateString;
    }
  };

  return {
    id: apiDiary.diaryIdx.toString(),
    content: apiDiary.content || "",
    emotion,
    emotionIdx: apiDiary.emotionIdx,
    date: formatDate(apiDiary.createdAt),
    createdAt: apiDiary.createdAt,
    imageUrls: apiDiary.imageUrls || [],
    challengeIdx: apiDiary.challengeIdx,
    challengeTitle: apiDiary.challengeTitle,
    // 위치 정보 매핑
    latitude: apiDiary.latitude,
    longitude: apiDiary.longitude,
    locationName: apiDiary.locationName,
    address: apiDiary.address,
    timezone: apiDiary.timezone,
  };
};

/**
 * API Calendar Diary 응답을 프론트엔드 DiaryEntry 타입으로 변환
 */
export const mapApiCalendarDiaryToDiaryEntry = (
  apiDiary: ApiCalendarDiary
): DiaryEntry => {
  const emotion = getEmotionFromIdx(apiDiary.emotionIdx);

  const formatDate = (dateString: string) => {
    try {
      if (dateString.includes("T")) {
        return dateString.split("T")[0];
      }
      return dateString;
    } catch (error) {
      console.error("날짜 포맷팅 오류:", error);
      return dateString;
    }
  };

  return {
    id: apiDiary.diaryIdx.toString(),
    content: "", // ApiCalendarDiary에는 content가 없음
    emotion,
    emotionIdx: apiDiary.emotionIdx,
    date: apiDiary.date,
    createdAt: apiDiary.createdAt || apiDiary.date,
    imageUrls: apiDiary.imageUrls || [],
    challengeIdx: apiDiary.challengeIdx,
    challengeTitle: apiDiary.challengeTitle,
  };
};

/**
 * API Trash Diary 응답을 프론트엔드 DiaryEntry 타입으로 변환
 */
export const mapApiTrashDiaryToDiaryEntry = (
  apiDiary: ApiTrashDiary
): DiaryEntry => {
  const emotion = getEmotionFromIdx(apiDiary.emotionIdx);

  const formatDate = (dateString: string) => {
    try {
      if (dateString.includes("T")) {
        return dateString.split("T")[0];
      }
      return dateString;
    } catch (error) {
      console.error("날짜 포맷팅 오류:", error);
      return dateString;
    }
  };

  return {
    id: apiDiary.diaryIdx.toString(),
    content: apiDiary.content || "",
    emotion,
    emotionIdx: apiDiary.emotionIdx,
    date: formatDate(apiDiary.createdAt),
    createdAt: apiDiary.createdAt,
    imageUrls: apiDiary.imageUrls || [],
    challengeIdx: apiDiary.challengeIdx,
    challengeTitle: apiDiary.challengeTitle,
  };
};
