import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { instance } from '@mooddisk/api';
import customJwtDecode from '../features/auth/jwtDecode';

interface TokenInfo {
  token: string;
  expiresAt: number;
  userInfo: {
    loginIdx: number;
    nickname: string;
    email?: string;
    profileImage?: string;
    role?: string;
  } | null;
}

interface AuthContextType {
  isLoggedIn: boolean;
  token: string | null;
  userInfo: TokenInfo['userInfo'];
  login: (token: string) => void;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  isTokenExpired: () => boolean;
  isLoggingOut: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔐 AuthProvider 렌더링');
  }
  
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const logoutTriggeredRef = useRef<boolean>(false);

  const isTokenExpired = useCallback(() => {
    if (!tokenInfo) return true;
    return Date.now() >= tokenInfo.expiresAt;
  }, [tokenInfo]);

  // isLoggedIn을 useMemo로 메모이제이션하여 불필요한 재계산 방지
  const isLoggedIn = useMemo(() => {
    if (!isInitialized || !tokenInfo) return false;
    return Date.now() < tokenInfo.expiresAt;
  }, [isInitialized, tokenInfo]);
  
  const token = tokenInfo?.token || null;
  const userInfo = tokenInfo?.userInfo || null;

  const scheduleTokenRefresh = useCallback(() => {
    if (!tokenInfo) return;
    
    // 기존 타이머 클리어
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    
    // 토큰 만료 5분 전에 갱신 시도
    const refreshTime = tokenInfo.expiresAt - Date.now() - 300000; // 5분 전
    
    if (refreshTime > 0) {
      refreshTimeoutRef.current = setTimeout(() => {
        refreshToken();
      }, refreshTime);
    }
  }, [tokenInfo]);

  const refreshToken = useCallback(async (): Promise<boolean> => {
    if (isLoggingOut) return false;
    
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 토큰 갱신 시도');
      }
      
      // API URL 설정
      const apiUrl = process.env.NODE_ENV === 'production' 
        ? (process.env.REACT_APP_API_URL || 'https://api.mooddisk.com')
        : 'http://localhost:8080';
      
      // 쿠키 기반 토큰 갱신 (서버에서 자동으로 쿠키 업데이트)
      const response = await fetch(`${apiUrl}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // 쿠키 자동 전송
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const newToken = response.headers.get('Bearer_Token');
        if (newToken) {
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ 토큰 갱신 성공');
          }
          const newUserInfo = customJwtDecode(newToken);
          if (newUserInfo) {
            setTokenInfo({
              token: newToken,
              expiresAt: newUserInfo.exp ? newUserInfo.exp * 1000 : Date.now() + 3600000,
              userInfo: {
                loginIdx: newUserInfo.loginIdx,
                nickname: newUserInfo.nickname,
                email: newUserInfo.email,
                profileImage: newUserInfo.profileImage,
                role: newUserInfo.role
              }
            });
            return true;
          }
        }
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ 토큰 갱신 실패');
      }
      return false;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('토큰 갱신 에러:', error);
      }
      return false;
    }
  }, [isLoggingOut]);

  const login = useCallback((newToken: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 AuthProvider login 호출');
    }
    
    const userInfo = customJwtDecode(newToken);
    if (!userInfo) {
      if (process.env.NODE_ENV === 'development') {
        console.error('토큰 디코딩 실패');
      }
      return;
    }
    
    const tokenInfo: TokenInfo = {
      token: newToken,
      expiresAt: userInfo.exp ? userInfo.exp * 1000 : Date.now() + 3600000,
      userInfo: {
        loginIdx: userInfo.loginIdx,
        nickname: userInfo.nickname,
        email: userInfo.email,
        profileImage: userInfo.profileImage,
        role: userInfo.role
      }
    };
    
    setTokenInfo(tokenInfo);
    // 로그인 시 초기화 상태를 true로 설정 (모바일에서 즉시 로그인 상태 반영)
    setIsInitialized(true);
    
    // localStorage 사용 중단 - 쿠키 기반 인증으로 전환
    // localStorage.setItem('token', newToken); // ❌ 제거
    // localStorage.setItem('isLoggedIn', 'true'); // ❌ 제거
    
    // 사용자 정보는 UserContext에서 관리 (기존 호환성 유지)
    // localStorage.setItem('nickname', userInfo.nickname); // ❌ 제거
    // localStorage.setItem('profileImage', userInfo.profileImage); // ❌ 제거
  }, []);

  const logout = useCallback(async () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 AuthProvider logout 호출');
    }
    
    // 이미 로그아웃 중이면 중복 실행 방지
    if (isLoggingOut || logoutTriggeredRef.current) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🚫 이미 로그아웃 중입니다.');
      }
      return;
    }
    
    logoutTriggeredRef.current = true;
    setIsLoggingOut(true);
    
    // 기존 타이머 클리어
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
    
    try {
      // API URL 설정
      const apiUrl = process.env.NODE_ENV === 'production' 
        ? (process.env.REACT_APP_API_URL || 'https://api.mooddisk.com')
        : 'http://localhost:8080';
      
      // 서버에 로그아웃 요청 (쿠키 삭제)
      await fetch(`${apiUrl}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('로그아웃 API 호출 실패:', error);
      }
    }
    
    setTokenInfo(null);
    setIsLoggingOut(false);
    logoutTriggeredRef.current = false;
    
    // localStorage 완전 정리 (모든 인증 관련 데이터)
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('isGoogle');
    localStorage.removeItem('isKakao');
    localStorage.removeItem('nickname');
    localStorage.removeItem('profileImage');
    localStorage.removeItem('userIdx');
  }, [isLoggingOut]);

  // 초기 로그인 상태 확인
  useEffect(() => {
    const checkInitialAuth = async () => {
      try {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 초기 로그인 상태 확인 중...');
        }
        
        // 공용 axios 인스턴스로 사용자 정보 조회 (쿠키/헤더 설정 일원화)
        const apiResponse = await instance.get('/user/me');
        const envelope = apiResponse?.data;
        const userData = envelope?.data ?? envelope; // ApiResponse 래핑/직접 반환 모두 대응
        
        if (userData) {
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ 기존 로그인 세션 발견');
          }
          
          // localStorage에서 토큰을 가져오지 않음 (보안: 쿠키 기반 인증만 사용)
          // HttpOnly 쿠키만 있는 경우 - 더미 토큰으로 상태 설정
          setTokenInfo({
            token: 'httpOnly-cookie-token',
            expiresAt: Date.now() + 3600000, // 1시간 후 만료
            userInfo: {
              loginIdx: userData.userIdx,
              nickname: userData.nickname,
              email: userData.email,
              profileImage: userData.profileImage,
              role: 'USER'
            }
          });
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.log('❌ 로그인되지 않은 상태');
          }
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.log('❌ 초기 로그인 상태 확인 실패:', error);
        }
      } finally {
        setIsInitialized(true);
      }
    };

    checkInitialAuth();
  }, []);

  // 토큰 갱신 스케줄링
  useEffect(() => {
    if (tokenInfo && !isTokenExpired()) {
      scheduleTokenRefresh();
    }
    
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [tokenInfo, isTokenExpired, scheduleTokenRefresh]);

  // 토큰 만료 시 자동 로그아웃
  useEffect(() => {
    // 로그아웃 중이거나 이미 초기화되지 않았으면 실행하지 않음
    if (isLoggingOut || !isInitialized || logoutTriggeredRef.current) {
      return;
    }
    
    // tokenInfo가 있고 만료되었을 때만 로그아웃 실행
    if (tokenInfo && isTokenExpired()) {
      if (process.env.NODE_ENV === 'development') {
        console.log('⏰ 토큰 만료로 인한 자동 로그아웃');
      }
      logout();
    }
  }, [tokenInfo, isTokenExpired, logout, isLoggingOut, isInitialized]);

  const value: AuthContextType = useMemo(() => ({
    isLoggedIn,
    token,
    userInfo,
    login,
    logout,
    refreshToken,
    isTokenExpired,
    isLoggingOut
  }), [isLoggedIn, token, userInfo, login, logout, refreshToken, isTokenExpired, isLoggingOut]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};