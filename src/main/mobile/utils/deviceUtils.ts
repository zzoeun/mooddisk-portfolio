import { Dimensions, Platform } from "react-native";

/**
 * 디바이스 타입 감지 유틸리티
 */

export interface DeviceInfo {
  isPhone: boolean;
  isTablet: boolean;
  isLargeTablet: boolean;
  width: number;
  height: number;
  aspectRatio: number;
}

/**
 * 현재 디바이스가 태블릿인지 확인
 */
export const isTablet = (): boolean => {
  const { width, height } = Dimensions.get("window");
  const minDimension = Math.min(width, height);
  const maxDimension = Math.max(width, height);
  const aspectRatio = maxDimension / minDimension;

  // 디버깅용 로그 제거됨 (무한 루프 방지)

  // iPad 감지 (iOS)
  if (Platform.OS === "ios" && Platform.isPad) {
    return true;
  }

  // 안드로이드 태블릿 감지
  // 최소 너비 600dp 이상이면 태블릿으로 간주 (aspectRatio 제한 제거)
  // 이유: 16:9 비율 태블릿(1.78)도 지원하기 위함
  return minDimension >= 600;
};

/**
 * 대형 태블릿 감지 (iPad Pro 등)
 */
export const isLargeTablet = (): boolean => {
  if (!isTablet()) return false;

  const { width, height } = Dimensions.get("window");
  const minDimension = Math.min(width, height);

  // 최소 너비 900dp 이상이면 대형 태블릿
  return minDimension >= 900;
};

/**
 * 디바이스 정보 가져오기
 */
export const getDeviceInfo = (): DeviceInfo => {
  const { width, height } = Dimensions.get("window");
  const aspectRatio = height / width;
  const tablet = isTablet();

  return {
    isPhone: !tablet,
    isTablet: tablet,
    isLargeTablet: isLargeTablet(),
    width,
    height,
    aspectRatio,
  };
};

/**
 * 반응형 값 계산 (폰/태블릿에 따라 다른 값 반환)
 */
export const responsiveValue = <T>(
  phoneValue: T,
  tabletValue: T,
  largeTabletValue?: T
): T => {
  if (isLargeTablet() && largeTabletValue !== undefined) {
    return largeTabletValue;
  }
  return isTablet() ? tabletValue : phoneValue;
};

/**
 * 반응형 폰트 크기 계산
 */
export const responsiveFontSize = (baseSize: number): number => {
  const { width } = Dimensions.get("window");
  const scale = width / 375; // iPhone X 기준
  const newSize = baseSize * scale;

  // 최소/최대 크기 제한
  return Math.min(Math.max(newSize, baseSize * 0.85), baseSize * 1.3);
};

/**
 * 반응형 간격 계산
 */
export const responsiveSpacing = (baseSpacing: number): number => {
  return responsiveValue(baseSpacing, baseSpacing * 1.5, baseSpacing * 2);
};

/**
 * 반응형 너비 계산 (최대 너비 제한)
 */
export const getMaxWidth = (): number => {
  return responsiveValue(
    Dimensions.get("window").width, // 폰: 전체 너비
    700, // 태블릿: 최대 700
    900 // 대형 태블릿: 최대 900
  );
};
