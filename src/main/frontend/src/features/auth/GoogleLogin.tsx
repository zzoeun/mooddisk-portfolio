import React, { useEffect, useCallback, useMemo } from "react";
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { instance } from '@mooddisk/api';
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import customJwtDecode from './jwtDecode';

declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string | undefined;
            callback: (response: CredentialResponse) => void;
          }) => void;
        };
      };
    };
  }
}

interface GoogleLoginProps {
  onLoginSuccess: (userData: { userIdx: number; nickname: string; profileImage?: string }) => void;
}

// 환경 변수를 컴포넌트 외부에서 계산하여 매번 새로 계산하지 않도록 함
const getApiUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return process.env.REACT_APP_API_URL || 'https://api.mooddisk.com';
  }
  return 'http://localhost:8080';
};

const getFrontendUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return 'https://mooddisk.com';
  }
  return window.location.origin;
};

const GoogleLoginButton: React.FC<GoogleLoginProps> = React.memo(({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  // 환경 변수를 메모이제이션
  const apiUrl = useMemo(() => getApiUrl(), []);
  const frontendUrl = useMemo(() => getFrontendUrl(), []);

  // 프로덕션에서는 디버깅 로그 제거
  if (process.env.NODE_ENV === 'development') {
    console.log("🔍 GoogleLogin 컴포넌트 렌더링:", {
      apiUrl,
      frontendUrl,
      NODE_ENV: process.env.NODE_ENV,
      GOOGLE_CLIENT_ID: process.env.REACT_APP_GOOGLE_AUTH_CLIENT_ID,
      windowGoogle: !!window.google
    });
  }

  const handleCredentialResponse = useCallback(async (response: CredentialResponse) => {
    console.log("🎯 Google 로그인 콜백 실행:", {
      hasCredential: !!response.credential,
      credentialLength: response.credential?.length
    });

    const token = response.credential;
    if (!token) {
      console.log("❌ Google 토큰이 없습니다");
      return;
    }

    try {
      console.log("📡 Google 로그인 API 요청 시작:", {
        url: `${apiUrl}/api/auth/google`,
        frontendRedirectUri: `${frontendUrl}/main`
      });

      // 공용 axios 인스턴스 사용: baseURL=/api, withCredentials 설정 일원화
      const response = await instance.post(
        '/auth/social/google',
        {
          idToken: token,
          frontendRedirectUri: `${frontendUrl}/calendar`
        }
      );

      console.log("✅ Google 로그인 API 응답:", {
        status: response.status,
        hasBearerToken: !!response.headers['bearer_token']
      });

      const bearer_token = response.headers['bearer_token'];
      
      // HttpOnly 쿠키 방식에서는 토큰이 쿠키에 저장되므로
      // 프론트엔드에서는 토큰을 직접 처리하지 않음
      if (bearer_token) {
        // AuthContext를 통해 로그인 처리 (호환성을 위해)
        login(bearer_token);
        
        // 기존 호환성을 위해 onLoginSuccess도 호출
        const userInfo = customJwtDecode(bearer_token);
        if (userInfo) {
          onLoginSuccess({
            userIdx: userInfo.loginIdx,
            nickname: userInfo.nickname,
            profileImage: userInfo.profileImage
          });
        }
      } else {
        // HttpOnly 쿠키 방식: 토큰이 없어도 로그인 성공
        // 사용자 정보를 가져오기 위해 API 호출
        try {
          const userResponse = await instance.get('/user/me');
          const envelope = userResponse?.data;
          const userData = envelope?.data ?? envelope;
          if (userData) {
            onLoginSuccess({
              userIdx: userData.userIdx,
              nickname: userData.nickname,
              profileImage: userData.profileImage
            });
          }
        } catch (userError) {
          console.error('사용자 정보 가져오기 실패:', userError);
        }
      }

      // 상태 업데이트가 완료된 후 리다이렉트 (다음 이벤트 루프에서 실행)
      setTimeout(() => {
        const redirectUri = response.headers['frontend-redirect-uri'];
        if (redirectUri) {
          navigate(redirectUri.replace(frontendUrl, '') || '/calendar', { replace: true });
        } else {
          navigate('/calendar', { replace: true });
        }
      }, 0);
    } catch (error) {
      if (process.env.NODE_ENV === 'production') {
        window.location.replace(frontendUrl);
      } else {
        navigate('/');
      }
    }
  }, [apiUrl, frontendUrl, navigate, onLoginSuccess]);

  const handleError = useCallback(() => {
    if (process.env.NODE_ENV === 'production') {
      window.location.replace(frontendUrl);
    } else {
      navigate('/');
    }
  }, [frontendUrl, navigate]);

  useEffect(() => {
    console.log("🔄 GoogleLogin useEffect 실행:", {
      windowGoogle: !!window.google,
      clientId: process.env.REACT_APP_GOOGLE_AUTH_CLIENT_ID,
      windowLocation: window.location.origin
    });

    // Google SDK가 로드될 때까지 대기
    const checkGoogleSDK = () => {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        try {
          console.log("✅ Google SDK 초기화 시작");
          window.google.accounts.id.initialize({
            client_id: process.env.REACT_APP_GOOGLE_AUTH_CLIENT_ID,
            callback: handleCredentialResponse,
          });
          console.log("✅ Google SDK 초기화 완료");
        } catch (error) {
          console.error('❌ Google SDK initialization error:', error);
        }
      } else {
        console.log("⏳ Google SDK 로딩 대기 중...");
        setTimeout(checkGoogleSDK, 100);
      }
    };

    checkGoogleSDK();
  }, [handleCredentialResponse]);

  console.log("🎯 GoogleLogin 렌더링 - 버튼 준비됨");

  return (
    <GoogleLogin
      onSuccess={handleCredentialResponse}
      onError={handleError}
      theme="outline"
      size="large"
      text="signin_with"
      shape="rectangular"
      logo_alignment="center"
    />
  );
});

export default GoogleLoginButton; 