/**
 * 이미지 URL 상수 관리
 * Static 버킷의 이미지 URL을 중앙에서 관리합니다.
 */

import Constants from 'expo-constants';

// Static 버킷 기본 URL (환경변수 또는 Expo extra로 오버라이드 가능)
const getStaticBucketBaseUrl = (): string => {
  // 1. EAS 빌드 환경변수 (최우선)
  const easUrl = (process.env as any)?.EXPO_PUBLIC_STATIC_BUCKET_URL as string | undefined;
  
  // 2. 로컬 환경변수
  const localUrl = (process.env as any)?.MOBILE_STATIC_BUCKET_URL as string | undefined;
  
  // 3. Expo extra 설정
  const expoExtra =
    (Constants as any)?.expoConfig?.extra ||
    (Constants as any)?.manifest2?.extra ||
    (Constants as any)?.manifest?.extra ||
    {};
  const extraUrl = (expoExtra as any)?.staticBucketUrl as string | undefined;
  
  // 4. 기본 fallback
  const fallbackUrl = 'https://mooddisk-static.s3.ap-northeast-2.amazonaws.com';
  
  const finalUrl = easUrl || localUrl || extraUrl || fallbackUrl;
  
  if (__DEV__) {
    console.log('🔧 Static Bucket URL 설정:', {
      easUrl,
      localUrl,
      extraUrl,
      finalUrl,
      source: easUrl ? 'EAS' : localUrl ? 'LOCAL_ENV' : extraUrl ? 'EXPO_EXTRA' : 'FALLBACK',
    });
  }
  
  return finalUrl;
};

const STATIC_BUCKET_BASE_URL = getStaticBucketBaseUrl();

/**
 * 기본 이미지 URL
 */
export const DEFAULT_IMAGES = {
  /** 프로필 기본 이미지 */
  PROFILE: `${STATIC_BUCKET_BASE_URL}/profile.png`,
} as const;

/**
 * 이미지 경로 헬퍼 함수
 * @param path S3 키 (경로 포함 가능)
 * @returns 전체 URL
 */
export const getStaticImageUrl = (path: string): string => {
  // 이미 전체 URL인 경우 그대로 반환
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // 경로만 있는 경우 기본 URL과 결합
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${STATIC_BUCKET_BASE_URL}/${cleanPath}`;
};

