// packages/api/src/instance.native.ts
import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from "axios";
import Constants from "expo-constants";
declare const __DEV__: boolean;
import AsyncStorage from "@react-native-async-storage/async-storage";

// AuthContext 타입 정의
interface AuthContext {
  token?: string;
  isLoggingOut?: boolean;
  login?: (userData: any, token?: string) => Promise<void>;
  logout?: () => Promise<void>;
  user?: any;
  isAuthenticated?: boolean;
}

// Environment-specific API URL (robust across dev/EAS/production)
const getApiUrl = (): string => {
  const expoExtra =
    (Constants as any)?.expoConfig?.extra ||
    (Constants as any)?.manifest2?.extra ||
    (Constants as any)?.manifest?.extra ||
    {};
  const extraUrl = (expoExtra as any)?.apiBaseUrl as string | undefined;
  const easUrl = (process.env as any)?.EXPO_PUBLIC_API_URL as
    | string
    | undefined;
  const localUrl = (process.env as any)?.MOBILE_API_URL as string | undefined;
  const fallbackUrl = "https://api.mooddisk.com";

  // 로컬 개발 환경: 환경변수 우선, 없으면 extraUrl 사용
  // 프로덕션: extraUrl 우선, 없으면 환경변수 사용
  let finalUrl: string;
  let source: string;

  if (__DEV__) {
    // 개발 환경: 환경변수 > extraUrl > fallback
    finalUrl = easUrl || localUrl || extraUrl || fallbackUrl;
    source = easUrl
      ? "EAS"
      : localUrl
      ? "LOCAL_ENV"
      : extraUrl
      ? "EXPO_EXTRA"
      : "FALLBACK";
  } else {
    // 프로덕션: extraUrl > 환경변수 > fallback
    finalUrl = extraUrl || easUrl || localUrl || fallbackUrl;
    source = extraUrl
      ? "EXPO_EXTRA"
      : easUrl
      ? "EAS"
      : localUrl
      ? "LOCAL_ENV"
      : "FALLBACK";
  }

  console.log("🔧 API URL 설정:", {
    extraUrl,
    easUrl,
    localUrl,
    finalUrl,
    source,
    __DEV__,
  });

  return finalUrl;
};

const apiUrl = getApiUrl();

if (__DEV__) {
  console.log("🔧 [Native] API URL setup:", {
    finalApiUrl: apiUrl,
  });
}

const instance: AxiosInstance = axios.create({
  baseURL: `${apiUrl}/api`,
  withCredentials: false, // React Native에서는 쿠키 대신 토큰 사용
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

let authContext: AuthContext | null = null;

export const setAuthContext = (context: AuthContext): void => {
  authContext = context;
};

instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (authContext?.isLoggingOut) {
      return Promise.reject(new Error("Logging out - request cancelled"));
    }

    const token = authContext?.token;
    if (token) {
      config.headers = config.headers || {};
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    if (__DEV__) {
      console.error("Native API - 요청 인터셉터 에러:", error);
    }
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  (response: AxiosResponse) => {
    const bearer_token = response.headers["bearer_token"] as string;
    if (
      typeof bearer_token === "string" &&
      bearer_token.trim().length > 10 &&
      (authContext as any)?.updateToken
    ) {
      // 새 토큰 수신 시 컨텍스트 토큰만 갱신 (불필요한 로그인 방지)
      (authContext as any).updateToken(bearer_token);
    }
    return response;
  },
  async (error) => {
    if (authContext?.isLoggingOut) {
      return new Promise(() => {});
    }

    if (error.response?.status === 401) {
      // 토큰 갱신 시도 (한 번만)
      if (!error.config._retry) {
        error.config._retry = true;

        try {
          // AuthContext를 통해 토큰 갱신 (SecureStorage 사용)
          if ((authContext as any)?.refreshToken) {
            // AuthContext의 refreshToken 메서드 사용 (SecureStorage 사용)
            const newToken = await (authContext as any).refreshToken();

            if (newToken) {
              // 갱신된 토큰으로 원 요청 재시도
              const originalConfig = error.config as InternalAxiosRequestConfig;
              originalConfig.headers = originalConfig.headers || {};
              originalConfig.headers["Authorization"] = `Bearer ${newToken}`;
              return instance.request(originalConfig);
            } else {
              throw new Error("Token refresh failed");
            }
          } else {
            throw new Error("No refresh token method");
          }
        } catch (e) {
          // 토큰 갱신 실패 시 에러만 전파 (로그아웃은 checkAuthState에서 처리)
          return Promise.reject(error);
        }
      } else {
        // 이미 재시도했는데도 401이면 에러만 전파
        return Promise.reject(error);
      }
    } else if (error.response?.status === 503) {
      // 서버 점검 중 (Service Unavailable)
      const maintenanceShown = await AsyncStorage.getItem("maintenanceShown");
      if (!maintenanceShown) {
        alert("서버 점검 중입니다. 잠시 후 다시 시도해 주시기 바랍니다.");
        await AsyncStorage.setItem("maintenanceShown", "true");
        setTimeout(() => {
          AsyncStorage.removeItem("maintenanceShown");
        }, 5000);
      }
    } else if (
      error.code === "NETWORK_ERROR" ||
      error.message?.includes("Network Error")
    ) {
      // 네트워크 연결 오류
      const networkErrorShown = await AsyncStorage.getItem("networkErrorShown");
      if (!networkErrorShown) {
        alert("네트워크 연결을 확인해 주시기 바랍니다.");
        await AsyncStorage.setItem("networkErrorShown", "true");
        setTimeout(() => {
          AsyncStorage.removeItem("networkErrorShown");
        }, 3000);
      }
    }

    return Promise.reject(error);
  }
);

export default instance;
