import type { ExpoConfig } from "expo/config";
import fs from "fs";
import path from "path";

// Load .env file for local development and local builds
// This ensures .env values are available during build time (expo run:ios, expo run:android)
// 단, EXPO_PUBLIC_API_URL은 .env에서 읽지 않음 (Archive 빌드 시 프로덕션 URL 사용을 위해)
const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  try {
    const envFile = fs.readFileSync(envPath, "utf-8");
    envFile.split("\n").forEach((line) => {
      const trimmedLine = line.trim();
      // 주석이나 빈 줄 건너뛰기
      if (trimmedLine && !trimmedLine.startsWith("#")) {
        const equalIndex = trimmedLine.indexOf("=");
        if (equalIndex > 0) {
          const key = trimmedLine.substring(0, equalIndex).trim();
          const value = trimmedLine.substring(equalIndex + 1).trim();
          // 따옴표 제거 (있는 경우)
          const cleanValue = value.replace(/^["']|["']$/g, "");
          // EXPO_PUBLIC_API_URL은 .env에서 읽지 않음 (Archive 빌드 시 프로덕션 URL 사용을 위해)
          // 기존 환경 변수가 없을 때만 설정 (환경 변수가 우선)
          if (key && key !== "EXPO_PUBLIC_API_URL" && !process.env[key]) {
            process.env[key] = cleanValue;
          }
        }
      }
    });
  } catch (error) {
    console.warn("⚠️ Failed to load .env file:", error);
  }
}

// Load base config from app.json
// eslint-disable-next-line @typescript-eslint/no-var-requires
const base = require("./app.json");
const baseExpo: ExpoConfig = base.expo as ExpoConfig;

function readRootVersion() {
  try {
    const rootPath = path.resolve(__dirname, "../../..", "version.json");
    const text = fs.readFileSync(rootPath, "utf-8");
    const parsed = JSON.parse(text);
    return {
      version: parsed.version as string | undefined,
      runtimeVersion: parsed.runtimeVersion as string | undefined,
    };
  } catch {
    return {} as { version?: string; runtimeVersion?: string };
  }
}

export default (): ExpoConfig => {
  const buildProfile = process.env.EAS_BUILD_PROFILE;
  const appEnv = process.env.APP_ENV;
  const nodeEnv = process.env.NODE_ENV;
  const isProd =
    buildProfile === "production" ||
    appEnv === "production" ||
    nodeEnv === "production";
  const isPreview = buildProfile === "preview";

  // 환경별 API URL 설정
  // Archive 빌드 시에는 항상 프로덕션 URL을 사용합니다.
  // 로컬 개발 시에만 .env 파일이나 환경변수를 사용합니다.

  // Archive 빌드 감지: EAS 빌드가 아니고, 프로덕션 환경변수도 없으면 Archive 빌드로 간주
  // 단, 로컬 개발 환경(expo start, expo run:android 등)은 Archive 빌드가 아님
  const isArchiveBuild =
    !buildProfile &&
    !isProd &&
    !isPreview &&
    process.env.EXPO_PUBLIC_API_URL === undefined;

  let apiBaseUrl: string;

  if (isArchiveBuild) {
    // Archive 빌드 시 무조건 프로덕션 URL 사용
    apiBaseUrl = "https://api.example.com";
  } else if (isProd || isPreview) {
    // EAS 프로덕션/프리뷰 빌드
    apiBaseUrl = process.env.EXPO_PUBLIC_API_URL || "https://api.example.com";
  } else {
    // 로컬 개발 환경: app.json의 apiBaseUrl 사용 (환경변수 우선)
    const explicitApiUrl = process.env.EXPO_PUBLIC_API_URL;

    // 개발 환경일 때만 .env 파일에서 EXPO_PUBLIC_API_URL을 읽음
    let envApiUrl: string | undefined;
    if (fs.existsSync(envPath)) {
      try {
        const envFile = fs.readFileSync(envPath, "utf-8");
        for (const line of envFile.split("\n")) {
          const trimmedLine = line.trim();
          if (
            trimmedLine &&
            !trimmedLine.startsWith("#") &&
            trimmedLine.startsWith("EXPO_PUBLIC_API_URL=")
          ) {
            const value = trimmedLine
              .substring("EXPO_PUBLIC_API_URL=".length)
              .trim();
            envApiUrl = value.replace(/^["']|["']$/g, "");
            break;
          }
        }
      } catch (error) {
        // 무시
      }
    }

    // 환경변수나 .env 파일이 있으면 사용, 없으면 app.json의 apiBaseUrl 사용
    apiBaseUrl =
      explicitApiUrl ||
      envApiUrl ||
      baseExpo.extra?.apiBaseUrl ||
      "https://api.example.com";
  }

  const rootVersion = readRootVersion();

  return {
    ...baseExpo,
    version: rootVersion.version ?? baseExpo.version,
    runtimeVersion:
      rootVersion.runtimeVersion ?? (baseExpo as any).runtimeVersion,
    extra: {
      ...baseExpo.extra,
      apiBaseUrl,
      googlePlacesApiKey:
        process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ||
        baseExpo.extra?.googlePlacesApiKey ||
        "",
      googlePlacesApiKeyAndroid:
        process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY_ANDROID ||
        baseExpo.extra?.googlePlacesApiKeyAndroid ||
        "",
      googlePlacesApiKeyIos:
        process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY_IOS ||
        baseExpo.extra?.googlePlacesApiKeyIos ||
        "",
      // Google OAuth 설정
      googleWebClientId:
        process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
        baseExpo.extra?.googleWebClientId ||
        "",
      googleIosClientId:
        process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
        baseExpo.extra?.googleIosClientId ||
        "",
      googleAndroidClientId:
        process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ||
        baseExpo.extra?.googleAndroidClientId ||
        "",
      googleIosRedirectUri:
        process.env.EXPO_PUBLIC_GOOGLE_IOS_REDIRECT_URI ||
        baseExpo.extra?.googleIosRedirectUri ||
        "",
      googleAndroidRedirectUri:
        process.env.EXPO_PUBLIC_GOOGLE_ANDROID_REDIRECT_URI ||
        baseExpo.extra?.googleAndroidRedirectUri ||
        "",
      // Kakao OAuth 설정
      kakaoNativeAppKey:
        process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY ||
        baseExpo.extra?.kakaoNativeAppKey ||
        "",
    },
  } as ExpoConfig;
};
