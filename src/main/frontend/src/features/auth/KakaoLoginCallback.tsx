import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import customJwtDecode from './jwtDecode';

interface KakaoLoginCallbackProps {
  onLogin?: () => void;
}

const KakaoLoginCallback: React.FC<KakaoLoginCallbackProps> = ({ onLogin }) => {
  const { setUserIdx, setNickname, setProfileImage } = useUser();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [accessTokenFetching, setAccessTokenFetching] = useState(false);
  const apiUrl = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? 'https://api.mooddisk.com' : 'http://localhost:8080');
  const frontendUrl = process.env.NODE_ENV === 'production' ? 'https://mooddisk.com' : window.location.origin;

  const PARAMS = new URLSearchParams(window.location.search);
  const KAKAO_CODE = PARAMS.get("code");

  const getLoginInfo = async () => {
    if (accessTokenFetching) {
      return;
    }
    
    setAccessTokenFetching(true);

    try {
      const response = await axios.post(
        `${apiUrl}/api/auth/social/kakao`,
        { 
          code: KAKAO_CODE,
          redirectUri: `${frontendUrl}/login/oauth2/code/kakao`,
          frontendRedirectUri: `${frontendUrl}/calendar`
        },
        { 
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true
        }
      );

      const bearer_token = response.headers['bearer_token'];
      
      // HttpOnly 쿠키 방식에서는 토큰이 쿠키에 저장되므로
      // 프론트엔드에서는 토큰을 직접 처리하지 않음
      if (bearer_token) {
        // AuthContext를 통해 로그인 처리 (호환성을 위해)
        login(bearer_token);
        
        // GoogleLogin과 동일하게 즉시 setUserIdx, setNickname, setProfileImage 호출
        // UserContext의 useEffect는 비동기로 실행되므로, 리다이렉트 전에 동기적으로 설정해야 함
        const userInfo = customJwtDecode(bearer_token);
        if (userInfo && userInfo.loginIdx != null) {
          setUserIdx(userInfo.loginIdx);
          setNickname(userInfo.nickname || null);
          setProfileImage(userInfo.profileImage || null);
        }
      } else {
        // HttpOnly 쿠키 방식: 토큰이 없어도 로그인 성공
        // 사용자 정보를 가져오기 위해 API 호출
        try {
          const userResponse = await axios.get(`${apiUrl}/api/user/me`, {
            withCredentials: true
          });
          
          // GoogleLogin과 동일하게 응답 구조 처리
          const envelope = userResponse?.data;
          const userData = envelope?.data ?? envelope;
          
          if (userData && userData.userIdx != null) {
            setUserIdx(userData.userIdx);
            setNickname(userData.nickname || null);
            setProfileImage(userData.profileImage || null);
          }
        } catch (userError) {
          console.error('사용자 정보 가져오기 실패:', userError);
        }
      }
      
      // 기존 호환성을 위해 localStorage에도 저장
      localStorage.setItem("isKakao", "true");
      
      // GoogleLogin과 동일하게 onLogin 호출하여 AppRouter의 isLoggedIn 상태 즉시 업데이트
      if (onLogin) {
        onLogin();
      }
      
      // 상태 업데이트가 완료된 후 리다이렉트 (다음 이벤트 루프에서 실행)
      // GoogleLogin과 동일한 방식
      setTimeout(() => {
        navigate('/calendar', { replace: true });
      }, 0);
    } catch (error) {
      console.error('Kakao login error:', error);
      if (process.env.NODE_ENV === 'production') {
        window.location.replace(frontendUrl);
      } else {
        navigate('/');
      }
    } finally {
      setAccessTokenFetching(false);
    }
  };

  useEffect(() => {
    if (KAKAO_CODE) {
      getLoginInfo();
    } else {
      if (process.env.NODE_ENV === 'production') {
        window.location.replace(frontendUrl);
      } else {
        navigate('/');
      }
    }
  }, [KAKAO_CODE]);

  return <div style={{ display: 'none' }} />;
};

export default KakaoLoginCallback; 