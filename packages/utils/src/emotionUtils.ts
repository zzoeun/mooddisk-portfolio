// 감정 관련 유틸리티 (1-6까지만)
export const emotionMapping = {
  HAPPY: {
    idx: 1,
    displayName: "행복",
    color: "#FFD700",
  },
  PROUD: {
    idx: 2,
    displayName: "뿌듯",
    color: "#FFA500",
  },
  PEACEFUL: {
    idx: 3,
    displayName: "평온",
    color: "#98FB98",
  },
  DEPRESSED: {
    idx: 4,
    displayName: "우울",
    color: "#4169E1",
  },
  ANNOYED: {
    idx: 5,
    displayName: "짜증",
    color: "#FF4500",
  },
  FURIOUS: {
    idx: 6,
    displayName: "분노",
    color: "#8B0000",
  },
};

export const getEmotionDisplayName = (emotion: string): string => {
  return (
    emotionMapping[emotion as keyof typeof emotionMapping]?.displayName ||
    emotion
  );
};

export const getEmotionIdxFromString = (emotion: string): number => {
  return emotionMapping[emotion as keyof typeof emotionMapping]?.idx || 1;
};

export const getEmotionFromIdx = (idx: number): string => {
  const emotion = Object.entries(emotionMapping).find(
    ([_, data]) => data.idx === idx
  );
  return emotion ? emotion[0] : "HAPPY";
};

export const getEmotionFilterOptions = () => {
  return [
    { value: "전체", label: "전체" },
    ...Object.entries(emotionMapping).map(([key, data]) => ({
      value: key,
      label: data.displayName,
    })),
  ];
};

// 감정 매핑 유틸리티 (공통)
export const getPixelEmotionFromKey = (
  emotionKey: string
): "happy" | "proud" | "peaceful" | "depressed" | "annoyed" | "furious" => {
  const emotionToPixelMap: Record<
    string,
    "happy" | "proud" | "peaceful" | "depressed" | "annoyed" | "furious"
  > = {
    HAPPY: "happy",
    PROUD: "proud",
    PEACEFUL: "peaceful",
    DEPRESSED: "depressed",
    ANNOYED: "annoyed",
    FURIOUS: "furious",
  };
  return emotionToPixelMap[emotionKey] || "happy";
};

export const getPixelEmotionFromIdx = (
  emotionIdx: number
): "happy" | "proud" | "peaceful" | "depressed" | "annoyed" | "furious" => {
  const idxToPixelMap: Record<
    number,
    "happy" | "proud" | "peaceful" | "depressed" | "annoyed" | "furious"
  > = {
    1: "happy", // HAPPY
    2: "proud", // PROUD
    3: "peaceful", // PEACEFUL
    4: "depressed", // DEPRESSED
    5: "annoyed", // ANNOYED
    6: "furious", // FURIOUS
  };
  return idxToPixelMap[emotionIdx] || "happy";
};
