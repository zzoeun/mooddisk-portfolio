import React, { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { UserProvider } from './context/UserContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { setAuthContext } from '@mooddisk/api';
import AppRouter from './AppRouter';
import { useAppState } from './hooks/common/useAppState';
// 빌드테스트
// AuthContext와 API 인스턴스를 연결하는 컴포넌트
const AuthContextConnector: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const authContext = useAuth();
  const authContextRef = React.useRef(authContext);
  
  // ref를 항상 최신으로 유지
  React.useEffect(() => {
    authContextRef.current = authContext;
  }, [authContext]);
  
  useEffect(() => {
    // API 인스턴스에 AuthContext 연결 (마운트 시 한 번만)
    setAuthContext(authContextRef.current);
  }, []); // 빈 dependency 배열 - 마운트 시 한 번만 실행
  
  return <>{children}</>;
};

// AppRouter를 렌더링하는 내부 컴포넌트
const AppContent: React.FC = () => {
  const appState = useAppState();
  
  return (
    <UserProvider>
      <AppRouter {...appState} />
    </UserProvider>
  );
};

function App() {
  return (
    <Router>
      <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_AUTH_CLIENT_ID || ''}>
        <AuthProvider>
          <AuthContextConnector>
            <AppContent />
          </AuthContextConnector>
        </AuthProvider>
      </GoogleOAuthProvider>
    </Router>
  );
}

export default App;