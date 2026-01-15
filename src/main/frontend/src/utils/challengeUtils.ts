import { ChallengeEntry } from "@mooddisk/types";

// 디자인 토큰 (프론트엔드용)
const DesignTokens = {
  colors: {
    sectionBackground: "#f3f0ff",
    lightGray: "#e5e7eb",
    alert: "#f87170",
    primary: "#8b5cf6",
  },
};

// 챌린지 기간에 따른 정보 반환
export const getChallengePeriodInfo = (
  challenge: any
) => {
  const durationDays = challenge.durationDays || challenge.duration;

  let color, bgColor, textColor;

  if (durationDays <= 7) {
    color = "pink";
    bgColor = DesignTokens.colors.sectionBackground;
    textColor = DesignTokens.colors.alert;
  } else if (durationDays <= 14) {
    color = "blue";
    bgColor = DesignTokens.colors.lightGray;
    textColor = DesignTokens.colors.primary;
  } else {
    color = "purple";
    bgColor = DesignTokens.colors.sectionBackground;
    textColor = DesignTokens.colors.primary;
  }

  return {
    days: durationDays,
    label: `${durationDays}일`,
    color,
    bgColor,
    textColor,
  };
};

// 챌린지 진행 상황을 체크박스 배열로 생성 (일기 데이터 기반)
export const getChallengeProgress = (
  challenge: any,
  challengeDiaries: Record<number, any[]>
): boolean[] => {
  const periodInfo = getChallengePeriodInfo(challenge);
  const progress = Array(periodInfo.days).fill(false);

  const participationIdx = challenge.participationIdx || challenge.challengeIdx;
  const diaries = challengeDiaries[participationIdx] || [];

  if (diaries.length > 0) {
    const startDate = new Date(challenge.startedAt || challenge.startDate);
    const completedDays = new Set<number>();

    diaries.forEach((diary) => {
      const diaryDate = new Date(diary.createdAt);

      const startDateStr = startDate.toLocaleDateString("en-CA");
      const diaryDateStr = diaryDate.toLocaleDateString("en-CA");

      const startDateOnly = new Date(startDateStr);
      const diaryDateOnly = new Date(diaryDateStr);
      const daysSinceStart = Math.floor(
        (diaryDateOnly.getTime() - startDateOnly.getTime()) /
          (1000 * 60 * 60 * 24)
      );

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
export const getActiveChallenges = (challenges: any[]) =>
  challenges.filter((c) => !c.isCompleted && c.status === "ACTIVE");

export const getCompletedChallenges = (challenges: any[]) => {
  const completedChallenges = challenges.filter((c) => c.isCompleted || c.status === "COMPLETED" || c.status === "FAILED");

  // 가장 최근에 끝난 챌린지가 상단에 오도록 정렬
  return completedChallenges.sort((a, b) => {
    const aStartDate = new Date(a.startedAt || a.startDate);
    const bStartDate = new Date(b.startedAt || b.startDate);

    const aDuration = Number(a.durationDays || a.duration);
    const bDuration = Number(b.durationDays || b.duration);

    // 챌린지 종료일 계산 (시작일 + 기간)
    const aEndDate = new Date(aStartDate);
    aEndDate.setDate(aStartDate.getDate() + aDuration - 1);

    const bEndDate = new Date(bStartDate);
    bEndDate.setDate(bStartDate.getDate() + bDuration - 1);

    // 종료일 기준으로 내림차순 정렬 (최신이 위로)
    return bEndDate.getTime() - aEndDate.getTime();
  });
};

// 총 일기 수 계산
export const getTotalDiaries = (challengeDiaries: Record<number, any[]>) => {
  return Object.values(challengeDiaries).reduce(
    (sum, diaries) => sum + diaries.length,
    0
  );
};
