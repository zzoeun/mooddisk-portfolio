import React from 'react';
import KakaoLogin from '../../../../features/auth/KakaoLogin';
import GoogleLogin from '../../../../features/auth/GoogleLogin';

interface LoginButtonsProps {
  onLoginSuccess: (userData: { userIdx: number; nickname: string; profileImage?: string }) => void;
}

export const LoginButtons: React.FC<LoginButtonsProps> = ({ onLoginSuccess }) => {
  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <KakaoLogin onLoginSuccess={onLoginSuccess} />
      <GoogleLogin onLoginSuccess={onLoginSuccess} />
    </div>
  );
};

export default LoginButtons; 