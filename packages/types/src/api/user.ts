// packages/types/src/api/user.ts
export interface ApiUserInfo {
  userIdx: number;
  email: string;
  nickname: string;
  profileImage?: string;
  bio?: string;
  phone?: string;
  oauthProvider?: string;
  createdAt: string;
}

// API 응답 래퍼 타입
export interface ApiResponse<T> {
  data: T;
  error: any;
  isSuccess: boolean;
}

export interface ApiUserActivity {
  createdAt: string;
  activityType: string;
  description: string;
  color: string;
}
