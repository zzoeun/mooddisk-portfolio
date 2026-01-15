import { ChallengeEntry, MyChallengeEntry } from "@mooddisk/types";
import { DiaryEntry } from "@mooddisk/types";
import DesignTokens from "../constants/designTokens";

// 챌린지 기간에 따른 정보 반환
export const getChallengePeriodInfo = (
  challenge: ChallengeEntry | MyChallengeEntry
) => {
  const durationDays =
    "duration" in challenge ? challenge.duration : challenge.durationDays;

  // durationDays가 null이거나 0 이하인 경우 기본값 처리
  const validDurationDays = durationDays && durationDays > 0 ? durationDays : 7;

  let color, bgColor, textColor;

  if (validDurationDays <= 7) {
    color = "pink";
    bgColor = DesignTokens.colors.sectionBackground;
    textColor = DesignTokens.colors.alert;
  } else if (validDurationDays <= 14) {
    color = "blue";
    bgColor = DesignTokens.colors.lightGray;
    textColor = DesignTokens.colors.primary;
  } else {
    color = "purple";
    bgColor = DesignTokens.colors.sectionBackground;
    textColor = DesignTokens.colors.primary;
  }

  return {
    days: validDurationDays,
    label: `${validDurationDays}일`,
    color,
    bgColor,
    textColor,
  };
};

// 챌린지 진행 상황을 체크박스 배열로 생성 (일기 데이터 기반)
export const getChallengeProgress = (
  challenge: ChallengeEntry | MyChallengeEntry,
  challengeDiaries: Record<number, DiaryEntry[]>
): boolean[] => {
  const periodInfo = getChallengePeriodInfo(challenge);
  const progress = Array(periodInfo.days).fill(false);

  const participationIdx =
    "participationIdx" in challenge
      ? challenge.participationIdx
      : challenge.challengeIdx;
  const diaries = challengeDiaries[participationIdx] || [];

  console.log("🔍 getChallengeProgress:", {
    challengeTitle: challenge.title,
    participationIdx,
    diariesCount: diaries.length,
    durationDays: periodInfo.days,
    startedAt:
      "startDate" in challenge ? challenge.startDate : challenge.startedAt,
  });

  if (diaries.length > 0) {
    // startedAt 날짜 파싱 (다양한 형식 지원)
    const startDateStr =
      "startDate" in challenge ? challenge.startDate : challenge.startedAt;
    let startDate: Date;

    if (typeof startDateStr === "string") {
      // ISO 형식 (2024-01-01T00:00:00) 또는 날짜만 (2024-01-01)
      if (startDateStr.includes("T")) {
        startDate = new Date(startDateStr);
      } else {
        // 날짜만 있는 경우 (YYYY-MM-DD)
        startDate = new Date(startDateStr + "T00:00:00");
      }
    } else {
      startDate = new Date(startDateStr);
    }

    const completedDays = new Set<number>();

    diaries.forEach((diary) => {
      // diary.createdAt이 문자열인지 확인
      const diaryCreatedAt =
        typeof diary.createdAt === "string"
          ? diary.createdAt
          : diary.date || diary.createdAt;

      const diaryDate = new Date(diaryCreatedAt);

      const startDateStrFormatted = startDate.toLocaleDateString("en-CA");
      const diaryDateStrFormatted = diaryDate.toLocaleDateString("en-CA");

      const startDateOnly = new Date(startDateStrFormatted);
      const diaryDateOnly = new Date(diaryDateStrFormatted);
      const daysSinceStart = Math.floor(
        (diaryDateOnly.getTime() - startDateOnly.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      console.log("🔍 일기 날짜 계산:", {
        diaryId: diary.id,
        diaryCreatedAt,
        diaryDateStr: diaryDateStrFormatted,
        startDateStr: startDateStrFormatted,
        daysSinceStart,
        periodDays: periodInfo.days,
        isValid: daysSinceStart >= 0 && daysSinceStart < periodInfo.days,
      });

      if (
        daysSinceStart >= 0 &&
        daysSinceStart < periodInfo.days &&
        !completedDays.has(daysSinceStart)
      ) {
        progress[daysSinceStart] = true;
        completedDays.add(daysSinceStart);
      }
    });
  }

  return progress;
};

// 챌린지 필터링 함수들
export const getActiveChallenges = (challenges: MyChallengeEntry[]) =>
  challenges.filter((c) => c.status === "ACTIVE");

export const getCompletedChallenges = (challenges: MyChallengeEntry[]) => {
  const completedChallenges = challenges.filter(
    (c) => c.status === "COMPLETED" || c.status === "FAILED"
  );

  // 가장 최근에 끝난 챌린지가 상단에 오도록 정렬
  return completedChallenges.sort((a, b) => {
    const aStartDateStr = "startDate" in a ? a.startDate : a.startedAt;
    const bStartDateStr = "startDate" in b ? b.startDate : b.startedAt;

    const aStartDate = new Date(aStartDateStr as string);
    const bStartDate = new Date(bStartDateStr as string);

    const aDuration = Number("duration" in a ? a.duration : a.durationDays);
    const bDuration = Number("duration" in b ? b.duration : b.durationDays);

    // 챌린지 종료일 계산 (시작일 + 기간)
    const aEndDate = new Date(aStartDate);
    aEndDate.setDate(aStartDate.getDate() + aDuration - 1);

    const bEndDate = new Date(bStartDate);
    bEndDate.setDate(bStartDate.getDate() + bDuration - 1);

    // 종료일 기준으로 내림차순 정렬 (최신이 위로)
    return bEndDate.getTime() - aEndDate.getTime();
  });
};

// 다가오는 로그 (미래 TRAVEL 로그) 필터링
export const getUpcomingChallenges = (challenges: MyChallengeEntry[]) => {
  const now = new Date();
  now.setHours(0, 0, 0, 0); // 시간을 00:00:00으로 설정하여 날짜만 비교

  return challenges
    .filter((c) => {
      // TRAVEL 로그이고 ACTIVE 상태인 것만
      if (c.type !== "TRAVEL" || c.status !== "ACTIVE") {
        return false;
      }

      // startedAt이 미래인지 확인
      const startDateStr = c.startedAt;
      if (!startDateStr) {
        return false;
      }

      const startDate = new Date(startDateStr);
      startDate.setHours(0, 0, 0, 0);

      // 출발일이 오늘 이후인 경우만 포함
      return startDate > now;
    })
    .sort((a, b) => {
      // 출발일 기준으로 오름차순 정렬 (가까운 날짜가 위로)
      const aStartDate = new Date(a.startedAt);
      const bStartDate = new Date(b.startedAt);
      return aStartDate.getTime() - bStartDate.getTime();
    });
};

export const getFailedChallenges = (challenges: MyChallengeEntry[]) =>
  challenges.filter((c) => c.status === "FAILED");

// 챌린지 완성률 계산
export const getChallengeCompletionRate = (challenges: MyChallengeEntry[]) => {
  const totalChallenges = challenges.length;
  if (totalChallenges === 0) return 0;

  const completedChallenges = getCompletedChallenges(challenges).length;
  return Math.round((completedChallenges / totalChallenges) * 100);
};

// 총 일기 수 계산
export const getTotalDiaries = (
  challengeDiaries: Record<number, DiaryEntry[]>
) => {
  return Object.values(challengeDiaries).reduce(
    (sum, diaries) => sum + diaries.length,
    0
  );
};
