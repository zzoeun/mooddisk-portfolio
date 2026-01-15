import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import {
  setSecureItem,
  getSecureItem,
  removeSecureItem,
  clearAllSecureItems,
  STORAGE_KEYS
} from '../utils/secureStorage';
import Constants from 'expo-constants';
import { API_ENDPOINTS } from '../config/auth';
import { instance } from '@mooddisk/api';

/**
 * 타임아웃을 위한 AbortSignal 생성 (React Native 호환)
 * 메모리 누수 방지를 위해 타이머 정리 로직 포함
 */
const createTimeoutSignal = (timeoutMs: number): { signal: AbortSignal; cleanup: () => void } => {
  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  timeoutId = setTimeout(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    controller.abort();
  }, timeoutMs);
  
  // cleanup 함수: 타이머를 확실히 정리
  const cleanup = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };
  
  // abort 이벤트 발생 시에도 타이머 정리
  if (controller.signal.addEventListener) {
    controller.signal.addEventListener('abort', cleanup);
  }
  
  return { signal: controller.signal, cleanup };
};

/**
 * JWT 토큰의 만료 시간 확인
 */
const isTokenExpired = (token: string): boolean => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return true; // 잘못된 형식은 만료된 것으로 간주
    }
    
    // Base64 디코딩 (URL-safe Base64 처리)
    const payload = parts[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    
    // React Native에서 Base64 디코딩
    // 패딩 추가 (Base64는 4의 배수여야 함)
    const paddedBase64 = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    
    let decoded;
    try {
      // 브라우저 환경에서는 atob 사용
      if (typeof atob !== 'undefined') {
        const decodedString = atob(paddedBase64);
        decoded = JSON.parse(decodedString);
      } else {
        // React Native 환경에서는 expo-crypto 또는 다른 방법 사용
        // 간단한 Base64 디코딩 (JWT payload만을 위한 간단한 구현)
        // expo-crypto를 사용하지 않고 직접 구현
        const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        let result = '';
        let i = 0;
        
        // Base64 디코딩
        while (i < paddedBase64.length) {
          const enc1 = base64Chars.indexOf(paddedBase64.charAt(i++));
          const enc2 = base64Chars.indexOf(paddedBase64.charAt(i++));
          const enc3 = base64Chars.indexOf(paddedBase64.charAt(i++));
          const enc4 = base64Chars.indexOf(paddedBase64.charAt(i++));
          
          const chr1 = (enc1 << 2) | (enc2 >> 4);
          const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
          const chr3 = ((enc3 & 3) << 6) | enc4;
          
          result += String.fromCharCode(chr1);
          if (enc3 !== 64) result += String.fromCharCode(chr2);
          if (enc4 !== 64) result += String.fromCharCode(chr3);
        }
        
        decoded = JSON.parse(result);
      }
    } catch (decodeError) {
      // 디코딩 실패 시 만료된 것으로 간주
      return true;
    }
    
    if (!decoded || !decoded.exp) {
      return true; // exp 클레임이 없으면 만료된 것으로 간주
    }
    
    // exp는 초 단위이므로 현재 시간(초)와 비교
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    // 파싱 실패 시 만료된 것으로 간주
    return true;
  }
};

/**
 * JSON 파싱 안전 함수 (에러 처리 포함)
 */
const safeJsonParse = <T,>(jsonString: string | null, fallback: T | null = null): T | null => {
  if (!jsonString) {
    return fallback;
  }
  
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    return fallback;
  }
};

interface User {
  id: string;
  name: string;
  email: string;
  picture?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  token: string | null;
  login: (userData: User, token?: string) => Promise<void>;
  updateToken: (newToken: string) => Promise<void>;
  refreshToken: () => Promise<string | null>;
  logout: () => Promise<void>;
  checkAuthState: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // 자동로그인은 checkAuthState에서 처리 (토큰 검증 포함)
  // autoLogin useEffect 제거 - checkAuthState가 토큰 검증 및 갱신을 모두 처리

  const login = useCallback(async (userData: User, token?: string) => {
    try {
      // 중복 로그인 방지: 이미 같은 사용자로 로그인되어 있으면 스킵
      if (user && user.id === userData.id && token === null) {
        return;
      }
      
      const userInfoSaved = await setSecureItem(STORAGE_KEYS.USER_INFO, JSON.stringify(userData));
      if (!userInfoSaved) {
        throw new Error('사용자 정보 저장 실패');
      }

      if (token && typeof token === 'string' && token.trim().length > 0) {
        const tokenSaved = await setSecureItem(STORAGE_KEYS.AUTH_TOKEN, token);
        if (!tokenSaved) {
          throw new Error('인증 토큰 저장 실패');
        }
        setToken(token);
      }

      setUser(userData);
    } catch (error) {
      throw error;
    }
  }, [user]);

  const updateToken = useCallback(async (newToken: string) => {
    try {
      // 토큰 유효성 검증
      if (!newToken || typeof newToken !== 'string' || newToken.trim().length === 0) {
        return;
      }

      // 토큰이 같으면 스킵
      if (token === newToken) {
        return;
      }
      
      const tokenSaved = await setSecureItem(STORAGE_KEYS.AUTH_TOKEN, newToken);
      if (!tokenSaved) {
        throw new Error('토큰 저장 실패');
      }
      
      setToken(newToken);
    } catch (error) {
      throw error;
    }
  }, [token]);

  const refreshToken = useCallback(async (): Promise<string | null> => {
    try {
      // SecureStorage에서 refresh token 가져오기
      const refreshTokenValue = await getSecureItem(STORAGE_KEYS.REFRESH_TOKEN);
      
      if (!refreshTokenValue) {
        throw new Error("No refresh token");
      }

      // API URL 가져오기 (instance.native.ts와 동일한 로직)
      const easUrl = (process.env as any)?.EXPO_PUBLIC_API_URL as string | undefined;
      const localUrl = (process.env as any)?.MOBILE_API_URL as string | undefined;
      const expoExtra = (Constants as any)?.expoConfig?.extra || 
                        (Constants as any)?.manifest2?.extra || 
                        (Constants as any)?.manifest?.extra || {};
      const extraUrl = (expoExtra as any)?.apiBaseUrl as string | undefined;
      const apiUrl = easUrl || localUrl || extraUrl || 'https://api.mooddisk.com';

      // 토큰 갱신 API 호출
      const response = await fetch(`${apiUrl}/api/auth/refresh/mobile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: refreshTokenValue }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Refresh failed: ${response.status}`);
      }
      
      const data = await response.json();

      // SecureStorage에 새 토큰 저장
      await setSecureItem(STORAGE_KEYS.AUTH_TOKEN, data.token);
      await setSecureItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
      
      // 상태 업데이트
      setToken(data.token);
      
      return data.token;
    } catch (error: unknown) {
      return null;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      // 1. 사용자 상태 즉시 초기화
      setUser(null);
      setToken(null);
      
      // 2. 백엔드 로그아웃 API 호출 (선택적)
      const authToken = await getSecureItem(STORAGE_KEYS.AUTH_TOKEN);
      if (authToken) {
        try {
          await fetch(API_ENDPOINTS.LOGOUT, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json',
            },
          });
        } catch (apiError) {
          // 백엔드 호출 실패해도 로컬 로그아웃은 진행
        }
      }

      // 3. 보안 저장소에서 모든 인증 데이터 삭제
      await clearAllSecureItems();
    } catch (error) {
      // 오류가 발생해도 사용자 상태는 초기화
      setUser(null);
      setToken(null);
      throw error;
    }
  }, []);

  const checkAuthState = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const userInfo = await getSecureItem(STORAGE_KEYS.USER_INFO);
      const authToken = await getSecureItem(STORAGE_KEYS.AUTH_TOKEN);
      
      // userInfo JSON 파싱 시도 (손상된 데이터 감지)
      const parsedUserInfo = safeJsonParse<User>(userInfo);
      
      if (!userInfo || !authToken) {
        // 토큰이나 사용자 정보가 없으면 초기화
        setUser(null);
        setToken(null);
        return;
      }
      
      // userInfo가 손상된 경우 (JSON 파싱 실패)
      if (!parsedUserInfo) {
        await clearAllSecureItems();
        setUser(null);
        setToken(null);
        return;
      }
      
      // 토큰 만료 여부 확인 (로컬에서 먼저 체크)
      if (isTokenExpired(authToken)) {
        try {
          const newToken = await refreshToken();
          
          if (newToken && !isTokenExpired(newToken)) {
            // 갱신 성공 - 새로운 토큰으로 검증
            setUser(parsedUserInfo);
            setToken(newToken);
            return;
          } else {
            // 토큰 갱신 실패 또는 갱신된 토큰도 만료됨
            throw new Error('토큰 갱신 실패 또는 만료');
          }
        } catch (refreshError) {
          await clearAllSecureItems();
          setUser(null);
          setToken(null);
          return;
        }
      }
      
      // API URL 가져오기
      const easUrl = (process.env as any)?.EXPO_PUBLIC_API_URL as string | undefined;
      const localUrl = (process.env as any)?.MOBILE_API_URL as string | undefined;
      const expoExtra = (Constants as any)?.expoConfig?.extra || 
                        (Constants as any)?.manifest2?.extra || 
                        (Constants as any)?.manifest?.extra || {};
      const extraUrl = (expoExtra as any)?.apiBaseUrl as string | undefined;
      const apiUrl = easUrl || localUrl || extraUrl || 'https://api.mooddisk.com';
      
      // 토큰 유효성 검증을 위한 API 호출 (fetch 직접 사용 - 인터셉터 우회)
      try {
        const { signal, cleanup } = createTimeoutSignal(10000);
        let response: Response;
        
        try {
          response = await fetch(`${apiUrl}/api/user/me`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json',
            },
            // 타임아웃 설정 (10초)
            signal
          });
        } finally {
          // fetch 완료 후 타이머 정리 (성공/실패 관계없이)
          cleanup();
        }
        
        if (response.status === 200) {
          // 인증 성공
          setUser(parsedUserInfo);
          setToken(authToken);
        } else if (response.status === 401 || response.status === 403) {
          // 토큰 만료 - 갱신 시도
          try {
            const newToken = await refreshToken();
            
            if (newToken && !isTokenExpired(newToken)) {
              // 토큰 갱신 성공 - 갱신된 토큰으로 다시 API 호출 시도
              const { signal: retrySignal, cleanup: retryCleanup } = createTimeoutSignal(10000);
              let retryResponse: Response;
              
              try {
                retryResponse = await fetch(`${apiUrl}/api/user/me`, {
                  method: 'GET',
                  headers: {
                    'Authorization': `Bearer ${newToken}`,
                    'Content-Type': 'application/json',
                  },
                  signal: retrySignal
                });
              } finally {
                // fetch 완료 후 타이머 정리
                retryCleanup();
              }
              
              if (retryResponse.status === 200) {
                setUser(parsedUserInfo);
                setToken(newToken);
              } else {
                throw new Error('재검증 실패');
              }
            } else {
              throw new Error('토큰 갱신 실패');
            }
          } catch (refreshError) {
            await clearAllSecureItems();
            setUser(null);
            setToken(null);
          }
        } else {
          // 기타 오류 - 로그아웃
          await clearAllSecureItems();
          setUser(null);
          setToken(null);
        }
      } catch (apiError: unknown) {
        // 네트워크 오류 또는 타임아웃
        
        // 네트워크 오류이지만 토큰이 만료되지 않았다면 사용자 정보 유지
        // 토큰이 만료되었다면 초기화
        if (isTokenExpired(authToken)) {
          await clearAllSecureItems();
          setUser(null);
          setToken(null);
        } else {
          // 네트워크 오류만 있는 경우 - 토큰은 유지하고 나중에 재시도 가능하도록
          setUser(parsedUserInfo);
          setToken(authToken);
        }
      }
    } catch (error: unknown) {
      // 예상치 못한 오류 발생 시 Keychain 초기화
      try {
        await clearAllSecureItems();
      } catch (clearError) {
        // Keychain 초기화 실패
      }
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, [refreshToken]);

  useEffect(() => {
    checkAuthState();
  }, [checkAuthState]);

  const value: AuthContextType = useMemo(() => ({
    user,
    isLoading,
    isAuthenticated,
    token,
    login,
    updateToken,
    refreshToken,
    logout,
    checkAuthState,
  }), [user, isLoading, isAuthenticated, token, login, updateToken, refreshToken, logout, checkAuthState]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

