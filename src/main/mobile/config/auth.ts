import Constants from "expo-constants";

type MobileEnv = {
  apiBaseUrl: string;
  googleWebClientId: string;
  googleIosClientId: string;
  googleAndroidClientId: string;
  googleIosRedirectUri: string;
  googleAndroidRedirectUri: string;
  kakaoNativeAppKey: string;
};

const getEnv = (): MobileEnv => {
  // Expo 런타임에서는 Constants.expoConfig.extra를 통해서만 환경 변수에 접근 가능
  const extra = (Constants?.expoConfig as any)?.extra || {};

  // app.config.ts의 extra에서 값을 읽음 (우선순위: extra > 기본값)
  const env: MobileEnv = {
    apiBaseUrl: extra.apiBaseUrl || "https://api.example.com",
    googleWebClientId: extra.googleWebClientId || "",
    googleIosClientId: extra.googleIosClientId || "",
    googleAndroidClientId: extra.googleAndroidClientId || "",
    googleIosRedirectUri: extra.googleIosRedirectUri || "",
    googleAndroidRedirectUri: extra.googleAndroidRedirectUri || "",
    kakaoNativeAppKey: extra.kakaoNativeAppKey || "",
  };

  // 필수 값 검증
  const requiredKeys: Array<keyof MobileEnv> = [
    "apiBaseUrl",
    "googleWebClientId",
    "googleIosClientId",
    "googleAndroidClientId",
    "googleIosRedirectUri",
    "googleAndroidRedirectUri",
    "kakaoNativeAppKey",
  ];

  for (const key of requiredKeys) {
    if (!env[key]) {
      console.warn(
        `⚠️ Missing required mobile env: ${String(
          key
        )}. Please set it in .env file or app.config.ts`
      );
    }
  }

  return env;
};

const ENV = getEnv();

export const GOOGLE_CONFIG = {
  WEB_CLIENT_ID: ENV.googleWebClientId,
  IOS_CLIENT_ID: ENV.googleIosClientId,
  ANDROID_CLIENT_ID: ENV.googleAndroidClientId,
  IOS_REDIRECT_URI: ENV.googleIosRedirectUri,
  ANDROID_REDIRECT_URI: ENV.googleAndroidRedirectUri,
  API_BASE_URL: ENV.apiBaseUrl,
};

export const KAKAO_CONFIG = {
  NATIVE_APP_KEY: ENV.kakaoNativeAppKey,
  API_BASE_URL: ENV.apiBaseUrl,
};

export const APPLE_CONFIG = {
  API_BASE_URL: ENV.apiBaseUrl,
};

export const GOOGLE_SCOPES = ["openid", "profile", "email"];

export const API_ENDPOINTS = {
  GOOGLE_WEB_LOGIN: `${ENV.apiBaseUrl}/api/auth/social/google`,
  GOOGLE_MOBILE_LOGIN: `${ENV.apiBaseUrl}/api/auth/social/google/mobile`,
  KAKAO_LOGIN: `${ENV.apiBaseUrl}/api/auth/social/kakao`,
  KAKAO_MOBILE_LOGIN: `${ENV.apiBaseUrl}/api/auth/social/kakao/mobile`,
  APPLE_LOGIN: `${ENV.apiBaseUrl}/api/auth/social/apple`,
  LOGOUT: `${ENV.apiBaseUrl}/api/auth/logout`,
  REFRESH_MOBILE: `${ENV.apiBaseUrl}/api/auth/refresh/mobile`,
};
