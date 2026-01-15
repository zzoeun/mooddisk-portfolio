import React, { useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { useUser } from "../../context/UserContext";
import logo from "../../assets/images/logos/logo.png";
import { Y2KProgressBar } from "../../components/features/login/status/Y2KProgressBar";
import { LoginButtons } from "../../components/features/login/buttons/LoginButtons";
import { SystemStatus } from "../../components/features/login/status/SystemStatus";
import { useProgressAnimation, useCurrentTime } from "@mooddisk/hooks";

interface LoginPageProps {
  onLogin: () => void;
}
const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const { login } = useAuth();
  const { setUserIdx, setNickname, setProfileImage } = useUser();
  // 커스텀 훅 사용
  const { progress, isLoading } = useProgressAnimation();
  const currentTime = useCurrentTime();
  useEffect(() => {
    document.body.classList.add("login-page");
    
    return () => {
      document.body.classList.remove("login-page");
    };
  }, []);

  const handleLoginSuccess = useCallback((userData: { userIdx: number; nickname: string; profileImage?: string }) => {
    setUserIdx(userData.userIdx);
    setNickname(userData.nickname);
    if (userData.profileImage) {
      setProfileImage(userData.profileImage);
    }
    // AuthContext의 login은 토큰이 필요하지만, 
    // GoogleLogin/KakaoLogin에서 이미 토큰 처리가 완료되었으므로
    // 여기서는 onLogin만 호출
    // 리다이렉트는 GoogleLogin/KakaoLogin 컴포넌트에서 처리
    onLogin();
  }, [setUserIdx, setNickname, setProfileImage, onLogin]);


  return (
    <div className="min-h-[100svh] flex flex-col px-4 py-8 relative overflow-y-auto">
      {/* 별 배경 */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* 별 패턴 배경 */}
        <div 
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `
              radial-gradient(4px 4px at 20px 30px, #642E8C, transparent),
              radial-gradient(3px 3px at 40px 70px, #8B5CF6, transparent),
              radial-gradient(1px 1px at 90px 40px, #A855F7, transparent),
              radial-gradient(2px 2px at 130px 80px, #C084FC, transparent),
              radial-gradient(3px 3px at 160px 30px, #642E8C, transparent),
              radial-gradient(1px 1px at 200px 60px, #8B5CF6, transparent),
              radial-gradient(4px 4px at 240px 20px, #A855F7, transparent),
              radial-gradient(2px 2px at 280px 90px, #C084FC, transparent),
              radial-gradient(1px 1px at 320px 50px, #642E8C, transparent),
              radial-gradient(3px 3px at 360px 10px, #8B5CF6, transparent),
              radial-gradient(1px 1px at 50px 120px, #A855F7, transparent),
              radial-gradient(4px 4px at 80px 150px, #8B5CF6, transparent),
              radial-gradient(2px 2px at 120px 180px, #C084FC, transparent),
              radial-gradient(1px 1px at 180px 200px, #642E8C, transparent),
              radial-gradient(3px 3px at 220px 250px, #A855F7, transparent),
              radial-gradient(1px 1px at 260px 280px, #8B5CF6, transparent),
              radial-gradient(4px 4px at 300px 320px, #C084FC, transparent),
              radial-gradient(2px 2px at 340px 350px, #642E8C, transparent),
              radial-gradient(1px 1px at 380px 380px, #A855F7, transparent),
              radial-gradient(3px 3px at 420px 420px, #8B5CF6, transparent),
              radial-gradient(4px 4px at 60px 300px, #A855F7, transparent),
              radial-gradient(2px 2px at 100px 330px, #8B5CF6, transparent),
              radial-gradient(3px 3px at 140px 360px, #C084FC, transparent),
              radial-gradient(1px 1px at 180px 390px, #642E8C, transparent),
              radial-gradient(4px 4px at 220px 420px, #A855F7, transparent)
            `,
            backgroundRepeat: 'repeat',
            backgroundSize: '450px 450px'
          }}
        />
        
        {/* 미묘한 그라데이션 오버레이 */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-blue-900/20" />
      </div>

      {/* 메인 컨텐츠를 세로 중앙에 배치 */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10">
        <div className="w-full max-w-md mx-auto flex flex-col items-center space-y-6">
          {/* 로고 */}
          <div className="flex items-center justify-center">
            <img
              src={logo}
              alt="mood.disk logo"
              className="w-40 h-40 md:w-48 md:h-48 object-contain select-none"
              draggable={false}
            />
          </div>
          
          {/* 태그라인 & 서브텍스트 */}
          <div className="text-center">
            <p className="text-xl font-semibold tracking-wide text-white">feel, write, save</p>
            <p className="mt-2 text-base text-gray-300">당신의 감정을 기록 중입니다.</p>
          </div>

          {/* 프로그레스 바 */}
          <div className="w-full flex flex-col items-center">
            <Y2KProgressBar progress={progress} />
          </div>
        </div>
      </div>

      {/* 로그인 버튼 - 하단 배치 */}
      <div className="w-full max-w-sm mx-auto relative mb-8">
        <LoginButtons onLoginSuccess={handleLoginSuccess} />
      </div>
      
      {/* 하단 시스템 상태 */}
      <div className="w-full max-w-md mx-auto relative z-10 pb-8">
        <SystemStatus currentTime={currentTime} />
      </div>
    </div>
  );
};

export default LoginPage;