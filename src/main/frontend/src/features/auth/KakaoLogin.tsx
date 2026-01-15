import React from "react";
import styled from "styled-components";
import axios from "axios";
import customJwtDecode from './jwtDecode';

interface KakaoLoginProps {
  onLoginSuccess: (userData: { userIdx: number; nickname: string; profileImage?: string }) => void;
}

const KakaoLogin: React.FC<KakaoLoginProps> = ({ onLoginSuccess }) => {
  const rest_api_key = process.env.REACT_APP_KAKAO_REST_APP_KEY;
  const apiUrl = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? 'https://api.mooddisk.com' : 'http://localhost:8080');
  const frontendUrl = process.env.NODE_ENV === 'production' ? 'https://mooddisk.com' : window.location.origin;
  const redirect_uri = `${frontendUrl}/login/oauth2/code/kakao`;

  const handleKakaoLogin = () => {
    if (!rest_api_key) {
      console.error('Kakao REST API key is not set');
      return;
    }
    window.location.href = kakaoURL;
  };

  const kakaoURL = `https://kauth.kakao.com/oauth/authorize?client_id=${rest_api_key}&redirect_uri=${redirect_uri}&response_type=code&prompt=login`;

  return (
    <KakaoButton onClick={handleKakaoLogin}>
      <KakaoIcon>
        <svg width="18" height="18" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g clipPath="url(#clip0_122_67)">
            <path fillRule="evenodd" clipRule="evenodd" d="M18 1.20001C8.05835 1.20001 0 7.42593 0 15.1046C0 19.8801 3.11681 24.09 7.86305 26.5939L5.86606 33.889C5.68962 34.5336 6.42683 35.0474 6.99293 34.6739L15.7467 28.8964C16.4854 28.9677 17.2362 29.0093 18 29.0093C27.9409 29.0093 35.9999 22.7836 35.9999 15.1046C35.9999 7.42593 27.9409 1.20001 18 1.20001Z" fill="black"/>
          </g>
          <defs>
            <clipPath id="clip0_122_67">
              <rect width="35.9999" height="36" fill="white"/>
            </clipPath>
          </defs>
        </svg>
      </KakaoIcon>
      <KakaoText>카카오 로그인</KakaoText>
    </KakaoButton>
  );
};

export default KakaoLogin;

const KakaoButton = styled.button`
  width: 100%;
  max-width: 200px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 0 12px;
  background-color: #fee500;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  font-family: 'Apple SD Gothic Neo', sans-serif;
  color: rgba(0, 0, 0, 0.85);
  cursor: pointer;
  transition: transform 0.2s;
  position: relative;

  &:hover {
    transform: scale(1.02);
  }
`;

const KakaoIcon = styled.div`
  width: 18px;
  height: 18px;
  margin-right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const KakaoText = styled.span`
  flex: 1;
  text-align: center;
  margin-left: -26px; /* 아이콘 너비(18px) + margin-right(8px)를 상쇄 */
`; 