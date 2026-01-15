// 파일 관련 유틸리티
export const FILE_SIZE_LIMITS = {
  IMAGE_MAX_SIZE: 5 * 1024 * 1024, // 5MB (프로덕션 환경과 일치)
  IMAGE_MAX_COUNT: 3,
  DIARY_IMAGE: 5 * 1024 * 1024, // 5MB (프로덕션 환경과 일치)
  // 개발 환경에서는 더 큰 제한을 사용할 수 있도록 상수 추가
  IMAGE_MAX_SIZE_DEV: 10 * 1024 * 1024, // 10MB (개발 환경용)
};

export const validateFileSize = (
  file: File,
  maxSize: number = FILE_SIZE_LIMITS.IMAGE_MAX_SIZE
): boolean => {
  return file.size <= maxSize;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};
