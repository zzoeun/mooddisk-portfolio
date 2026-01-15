/**
 * 이미지 URL 상수 관리
 * Static 버킷의 이미지 URL을 중앙에서 관리합니다.
 */

// Static 버킷 기본 URL (환경변수로 오버라이드 가능)
const STATIC_BUCKET_BASE_URL =
  process.env.REACT_APP_STATIC_BUCKET_URL ||
  'https://mooddisk-static.s3.ap-northeast-2.amazonaws.com';

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

