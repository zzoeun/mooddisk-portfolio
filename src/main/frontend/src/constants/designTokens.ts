// Frontend Design Tokens - 모바일 앱과 동일한 디자인 시스템

const DesignTokens = {
  fonts: {
    default:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  typography: {
    sectionTitle: {
      fontSize: "20px",
      fontWeight: "bold" as const,
      textTransform: "uppercase" as const,
      color: "#8b5cf6",
    },
    cardTitle: {
      fontSize: "16px",
      fontWeight: "bold" as const,
      textTransform: "uppercase" as const,
      color: "#8b5cf6",
    },
    body: {
      fontSize: "14px",
      color: "#000000",
    },
    small: {
      fontSize: "12px",
      fontWeight: "bold" as const,
      textTransform: "uppercase" as const,
      color: "#000000",
    },
  },
  spacing: {
    sectionMargin: "24px",
    sectionPadding: "16px",
    sectionTitleMargin: "16px",
    cardMargin: "16px",
    cardPadding: "12px",
    emptyStatePadding: "32px",
    // 컴포넌트 간격
    componentGap: "16px",
    smallGap: "8px",
    tinyGap: "4px",
    // 내부 간격
    innerPadding: "12px",
    largePadding: "20px",
  },
  colors: {
    // 기본 색상 팔레트
    primary: "#8b5cf6", // 보라색
    secondary: "#642e8c", // 진한 보라색
    accent: "#66fecd", // 민트 그린
    alert: "#f87170", // 코랄 핑크
    text: "#000000", // 검은색
    background: "#ffffff", // 흰색
    border: "#8b5cf6", // 보라색 테두리

    // 그레이 스케일
    gray: "#6B7280",
    lightGray: "#e5e7eb",
    mediumGray: "#9ca3af",
    darkGray: "#16213e",

    // 배경 색상
    sectionBackground: "#f3f0ff", // 연한 보라색 배경
    cardBackground: "#f8f9fa", // 연한 회색 배경

    // 특수 색상
    menuIcon1: "#66ffcc", // 민트 그린 계열
    menuIcon2: "#9a66cc", // 보라색 계열
    menuIcon3: "#f87171", // 핑크 계열
    headerBorder: "#663366", // 진한 보라색
    lightPurple: "#c4b5fd", // 흐린 보라색
    profileBorder: "#000000", // 검은색 테두리 (프로필, 버튼 등)

    // 감정 색상
    emotionHappy: "#F472B6", // 핑크
    emotionProud: "#FBBF24", // 노란색
    emotionPeaceful: "#34D399", // 그린
    emotionDepressed: "#60A5FA", // 블루
    emotionAnnoyed: "#9CA3AF", // 그레이
    emotionFurious: "#8B5CF6", // 보라색
  },
  borders: {
    width: "3px",
    mediumWidth: "2px",
    color: "#8b5cf6",
  },
};

export default DesignTokens;
