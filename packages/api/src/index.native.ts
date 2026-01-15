// packages/api/src/index.native.ts (업데이트)
// 모바일용 API 인스턴스
export { default as instance, setAuthContext } from "./instance.native";

// API 함수들
export * from "./challengeApi";
export * from "./diaryApi";
export * from "./diskbookApi";
export * from "./userApi";
