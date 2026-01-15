// packages/api/src/instance.ts
import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from "axios";

// AuthContext 타입 정의
interface AuthContext {
  token?: string | null;
  isLoggingOut?: boolean;
  login?: (token: string) => void;
  logout?: () => void;
}

// 환경변수에 따라 API URL 설정
const getApiUrl = (): string => {
  // 환경변수가 설정되어 있으면 사용
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  // 개발 환경
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:8080";
  }
  // 배포 환경 - api.mooddisk.com 사용
  return "https://api.mooddisk.com";
};

const apiUrl = getApiUrl();

// 디버깅을 위한 로그
console.log("🔧 API URL 설정:", {
  NODE_ENV: process.env.NODE_ENV,
  REACT_APP_API_URL: process.env.REACT_APP_API_URL,
  windowLocation: (window as any).location.origin,
  finalApiUrl: apiUrl,
});

console.log("instance");

const instance: AxiosInstance = axios.create({
  baseURL: `${apiUrl}/api`,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10초 타임아웃 설정
});

// AuthContext 참조를 위한 변수 (나중에 설정됨)
let authContext: AuthContext | null = null;

// AuthContext 설정 함수
export const setAuthContext = (context: AuthContext): void => {
  authContext = context;
};

// 인증 토큰 관리 (쿠키 기반)
instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 로그아웃 중이면 요청 차단
    if (authContext?.isLoggingOut) {
      console.log("🚫 로그아웃 중 - API 요청 차단");
      return Promise.reject(new Error("로그아웃 중 - 요청 취소됨"));
    }
    // 쿠키 기반 인증: withCredentials로 쿠키 자동 전송
    config.withCredentials = true;
    // 기존 호환성을 위해 AuthContext에서 토큰이 있으면 헤더에도 추가
    const token = authContext?.token;
    if (token) {
      config.headers = config.headers || {};
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error("❌ API 요청 에러:", error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터 추가 (쿠키 기반)
instance.interceptors.response.use(
  function (response: AxiosResponse) {
    // 토큰 갱신 처리 (쿠키는 자동으로 업데이트됨)
    const bearer_token = response.headers["bearer_token"] as string;
    if (bearer_token) {
      const currentToken = authContext?.token;
      if (currentToken !== bearer_token) {
        console.log("🔄 토큰 갱신됨");
        // AuthContext를 통해 토큰 갱신
        if (authContext?.login) {
          authContext.login(bearer_token);
        }
      }
    }
    return response;
  },
  function (error) {
    // 로그아웃 중이면 에러 처리 스킵
    if (authContext?.isLoggingOut) {
      console.log("🚫 로그아웃 중 - 에러 처리 스킵");
      return new Promise(() => {}); // 무한 대기로 요청 차단
    }
    // 에러 처리
    if (error.response && error.response.status) {
      switch (error.response.status) {
        case 401:
          console.log("�� 401 인증 에러 - 로그인 페이지로 이동");
          // AuthContext를 통해 로그아웃 처리
          if (authContext?.logout) {
            authContext.logout();
          }
          // 세션 만료 알림 (한 번만)
          if (!sessionStorage.getItem("sessionExpiredShown")) {
            alert("세션이 만료되었습니다. 다시 로그인해 주시기 바랍니다.");
            sessionStorage.setItem("sessionExpiredShown", "true");
            setTimeout(() => {
              sessionStorage.removeItem("sessionExpiredShown");
            }, 1000);
          }
          (window as any).location.href = `/`;
          break;
        default:
          return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export default instance;
