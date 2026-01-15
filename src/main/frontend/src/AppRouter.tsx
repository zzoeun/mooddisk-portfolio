import React, { useCallback, useRef } from 'react';
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import KakaoLoginCallback from './features/auth/KakaoLoginCallback';
import LoginPage from './pages/web/LoginSection';
import DesktopLayout from './layout/DesktopLayout';
import MobileLayout from './layout/MobileLayout';
import Background from './styles/global/Background';
import GlobalStyle from './styles/global/GlobalStyle';
import { AppState, AppActions } from '@mooddisk/types';

interface AppRouterProps extends AppState, AppActions {}

export default function AppRouter({
  isLoggedIn,
  isMobile,
  activeSection,
  setActiveSection,
  ...actions
}: AppRouterProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const isNavigatingRef = useRef(false);
  const lastPathRef = useRef(location.pathname);
  
  // onLogin 함수를 useCallback으로 메모이제이션
  const handleLogin = useCallback(() => {
    actions.setIsLoggedIn(true);
  }, [actions.setIsLoggedIn]);
  
  // URL에서 섹션 추출 및 activeSection 동기화 (URL 변경 시에만, 프로그래밍 방식 네비게이션이 아닐 때)
  React.useEffect(() => {
    if (!isLoggedIn || isNavigatingRef.current) return;
    
    const path = location.pathname;
    // URL이 실제로 변경되었는지 확인
    if (path === lastPathRef.current) return;
    lastPathRef.current = path;
    
    const section = path.substring(1) || 'calendar';
    const validSections = ['diary', 'write', 'mood', 'challenge', 'diskbook', 'mypage', 'calendar', 'trash'];
    
    // URL이 변경되었고 유효한 섹션이면 activeSection 업데이트
    if (validSections.includes(section)) {
      setActiveSection(section);
    }
  }, [location.pathname, isLoggedIn, setActiveSection]);

  // activeSection 변경 시 URL 동기화 (사용자가 탭을 클릭한 경우)
  React.useEffect(() => {
    if (!isLoggedIn) return;
    
    const currentPath = location.pathname.substring(1) || 'calendar';
    const validSections = ['diary', 'write', 'mood', 'challenge', 'diskbook', 'mypage', 'calendar', 'trash'];
    
    // URL이 이미 올바른 섹션을 가리키고 있으면 리다이렉트하지 않음
    if (validSections.includes(activeSection) && activeSection !== currentPath) {
      isNavigatingRef.current = true;
      lastPathRef.current = `/${activeSection}`;
      navigate(`/${activeSection}`, { replace: true });
      // navigate가 완료된 후 ref 리셋 (더 긴 딜레이로 확실하게 처리)
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 100);
    }
  }, [activeSection, isLoggedIn, navigate]);

  const renderContent = () => {
    if (!isLoggedIn) {
      return (
        <>
          <GlobalStyle />
          <Background />
          <LoginPage onLogin={handleLogin} />
        </>
      );
    }

    if (isMobile) {
      return (
        <>
          <GlobalStyle />
          <Background />
          <MobileLayout activeSection={activeSection} onSectionChange={setActiveSection} />
        </>
      );
    }

    return (
      <>
        <GlobalStyle />
        <Background />
        <DesktopLayout 
          activeSection={activeSection} 
          setActiveSection={setActiveSection} 
          setIsLoggedIn={actions.setIsLoggedIn} 
        />
      </>
    );
  };

  return (
    <Routes>
      <Route path="/login/oauth2/code/kakao" element={<KakaoLoginCallback onLogin={handleLogin} />} />
      
      {/* 로그인된 상태에서만 접근 가능한 섹션들 */}
      {isLoggedIn ? (
        <>
          <Route path="/diary" element={renderContent()} />
          <Route path="/mood" element={renderContent()} />
          <Route path="/challenge" element={renderContent()} />
          <Route path="/diskbook" element={renderContent()} />
          <Route path="/mypage" element={renderContent()} />
          <Route path="/calendar" element={renderContent()} />
          <Route path="/trash" element={renderContent()} />
          <Route path="/" element={<Navigate to="/calendar" replace />} />
        </>
      ) : (
        <>
          <Route path="/" element={renderContent()} />
          {/* 카카오 로그인 콜백 후 리다이렉트를 위해 /calendar 경로도 허용 (isLoggedIn이 곧 true가 됨) */}
          <Route path="/calendar" element={renderContent()} />
        </>
      )}
      
      <Route path="*" element={renderContent()} />
    </Routes>
  );
} 