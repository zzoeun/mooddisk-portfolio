// packages/api/src/index.ts (업데이트)
// 웹용 API 인스턴스
export { default as instance, setAuthContext } from "./instance";

// API 함수들
export * from "./challengeApi";
export * from "./diaryApi";
export * from "./userApi";
export * from "./diskbookApi";
