import { responsiveValue, responsiveSpacing } from "../utils/deviceUtils";
import { Platform } from "react-native";

// 폰트 패밀리 상수
export const FONTS = {
  // 앱 전체 기본 폰트 (iOS: System/San Francisco, Android: System/Roboto)
  default: "System",
  // 로그인 버튼용 폰트 (플랫폼별)
  login:
    Platform.select({
      ios: "System",
      android: "Roboto",
    }) || "System",
} as const;

const DesignTokens = {
  // 폰트 패밀리 중앙 관리
  fonts: FONTS,
  typography: {
    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold" as const,
      fontFamily: FONTS.default,
      textTransform: "uppercase" as const,
      color: "#8b5cf6",
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: "bold" as const,
      fontFamily: FONTS.default,
      textTransform: "uppercase" as const,
      color: "#8b5cf6",
    },
    body: {
      fontSize: 14,
      fontFamily: FONTS.default,
      color: "#000000",
    },
    small: {
      fontSize: 12,
      fontWeight: "bold" as const,
      fontFamily: FONTS.default,
      textTransform: "uppercase" as const,
      color: "#000000",
    },
  },
  spacing: {
    sectionMargin: 24,
    sectionPadding: 16,
    sectionTitleMargin: 16,
    cardMargin: 16,
    cardPadding: 12,
    emptyStatePadding: 32,
    // 컴포넌트 간격
    componentGap: 16,
    smallGap: 8,
    tinyGap: 4,
    // 내부 간격
    innerPadding: 12,
    largePadding: 20,
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
    lightPurple: "#c4b5fd", // 흐린 보라색 (달력 이전/다음 달)

    // 감정 색상
    emotionHappy: "#F472B6", // 핑크
    emotionProud: "#FBBF24", // 노란색
    emotionPeaceful: "#34D399", // 그린
    emotionDepressed: "#60A5FA", // 블루
    emotionAnnoyed: "#9CA3AF", // 그레이
    emotionFurious: "#8B5CF6", // 보라색
  },
  borders: {
    width: 3,
    color: "#8b5cf6",
  },
  // 반응형 브레이크포인트
  breakpoints: {
    phone: 0,
    tablet: 600,
    largeTablet: 900,
  },
  // 반응형 레이아웃
  layout: {
    // 최대 컨텐츠 너비
    maxContentWidth: {
      phone: "100%",
      tablet: 700,
      largeTablet: 900,
    },
    // 그리드 컬럼 수
    gridColumns: {
      phone: 1,
      tablet: 2,
      largeTablet: 3,
    },
    // 사이드바 너비 (태블릿용)
    sidebarWidth: {
      tablet: 320,
      largeTablet: 380,
    },
  },
};

// 반응형 spacing 헬퍼 함수들
export const getResponsiveSpacing = () => ({
  sectionMargin: responsiveSpacing(24),
  sectionPadding: responsiveSpacing(16),
  cardMargin: responsiveSpacing(16),
  cardPadding: responsiveSpacing(12),
  componentGap: responsiveSpacing(16),
  smallGap: responsiveSpacing(8),
});

// 반응형 typography 헬퍼 함수들
export const getResponsiveTypography = () => ({
  sectionTitleSize: responsiveValue(20, 24, 28),
  cardTitleSize: responsiveValue(16, 18, 20),
  bodySize: responsiveValue(14, 15, 16),
  smallSize: responsiveValue(12, 13, 14),
});

export default DesignTokens;
