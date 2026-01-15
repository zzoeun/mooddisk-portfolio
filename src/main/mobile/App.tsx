import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert, ActivityIndicator, Platform } from 'react-native';
import { Asset } from 'expo-asset';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import FastImage from 'react-native-fast-image';
import Y2KProgressBar from './components/features/login/Y2KProgressBar';
import StarField from './components/features/login/StarField';
import SystemStatus from './components/features/login/SystemStatus';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import GoogleSignIn from './features/auth/GoogleSignIn';
import KakaoSignIn from './features/auth/KakaoSignIn';
import AppleSignIn from './features/auth/AppleSignIn';
import MainScreen from './screens/MainScreen';
import DesignTokens from './constants/designTokens';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GOOGLE_CONFIG } from './config/auth';
import { setAuthContext } from '@mooddisk/api';
import { getDiaryCalendar, getAllChallenges, getMyChallenges, getUserInfo as getUserInfoApi, getDiaryYear } from '@mooddisk/api';
import { useDeviceInfo } from './hooks/useDeviceInfo';
import { responsiveValue } from './utils/deviceUtils';
import ErrorBoundary from './components/common/ErrorBoundary';

// 스플래시 화면이 자동으로 숨겨지지 않도록 방지
SplashScreen.preventAutoHideAsync();

// AuthContext 타입 정의 (API 패키지의 타입과 동일)
interface AuthContext {
  token?: string;
  isLoggingOut?: boolean;
  login?: (userData: any, token?: string) => Promise<void>;
  logout?: () => Promise<void>;
  user?: any;
  isAuthenticated?: boolean;
}

interface AppProps {}

const App: React.FC<AppProps> = () => {
  const queryClientRef = useRef<QueryClient>();
  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 1000 * 60 * 5, // 5분
          gcTime: 1000 * 60 * 30, // 30분 (v5: cacheTime -> gcTime)
          refetchOnReconnect: true,
          refetchOnMount: false,
          refetchOnWindowFocus: false,
        },
      },
    });
  }
  return (
    <ErrorBoundary>
    <SafeAreaProvider>
      <QueryClientProvider client={queryClientRef.current}>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
    </ErrorBoundary>
  );
};

const AppContent: React.FC = () => {
  const { user, isAuthenticated, token, login, updateToken, refreshToken, logout, checkAuthState, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [isLogoLoading, setIsLogoLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [appIsReady, setAppIsReady] = useState(false);
  const hasPreloadedRef = useRef(false);
  const { isTablet } = useDeviceInfo();


  // Google Sign-In 초기화 (앱 시작 시 1회만 실행)
  useEffect(() => {
    try {
      GoogleSignin.configure({
        webClientId: GOOGLE_CONFIG.WEB_CLIENT_ID, // 웹 클라이언트 ID 사용 (서버 인증용)
        iosClientId: GOOGLE_CONFIG.IOS_CLIENT_ID, // iOS 클라이언트 ID
        offlineAccess: true,
      });
    } catch (e) {
      console.warn('Google Sign-In configuration failed:', e);
    }
  }, []);

  // 안드로이드에서 status bar 표시 설정
  useEffect(() => {
    if (Platform.OS === 'android' && !isAuthenticated) {
      SystemUI.setBackgroundColorAsync(DesignTokens.colors.text);
    }
  }, [isAuthenticated]);

  // 로그인 화면 시계 제거 (주기적 렌더링 방지)

  // 중간 프로그레스 바 애니메이션 (100%에서 멈춤)
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + 1;
      });
    }, 50);
    return () => clearInterval(timer);
  }, []);

  // 앱 초기화 및 스플래시 화면 제어
  useEffect(() => {
    async function prepare() {
      try {
        // 로고 이미지 사전 로드
        const module = require('./assets/images/floppy_mooddisk.png');
        const asset = Asset.fromModule(module);
        await asset.downloadAsync();
        
        // FastImage 프리로드 (URI가 유효한 경우에만)
        const uri = asset.uri;
        if (uri && uri.trim() !== '') {
          try {
            FastImage.preload([{ uri }]);
          } catch (e) {
            console.warn('FastImage preload failed:', e);
          }
        }
        
        setIsLogoLoading(false);
      } catch (e) {
        console.warn('Asset preload failed:', e);
      } finally {
        // 앱이 준비되었음을 표시
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  // 앱이 준비되면 스플래시 화면 숨기기
  const onLayoutRootView = useCallback(async () => {
    if (appIsReady && !authLoading) {
      // 스플래시 화면을 숨깁니다
      await SplashScreen.hideAsync();
    }
  }, [appIsReady, authLoading]);

  // API 인터셉터에 AuthContext 설정
  useEffect(() => {
    try {
      const authContext: AuthContext = {
        token: token || undefined,
        isLoggingOut: false,
        login: async (userData: any, token?: string) => {
          // API 인터셉터에서 호출되는 login 함수 (토큰만 받음)
          if (typeof userData === 'string') {
            // 토큰 갱신의 경우 - updateToken 사용
            await updateToken(userData);
          } else {
            // 일반 로그인의 경우
            await login(userData, token);
          }
        },
        // 401 처리 시 인터셉터에서 사용할 토큰 갱신 메서드 연결
        // (mobile AuthContext의 refreshToken을 그대로 전달)
        // @ts-ignore - 인터페이스에 명시되지 않았을 수 있으나 네이티브 인스턴스에서 사용
        refreshToken,
        logout,
        user,
        isAuthenticated,
      };
      setAuthContext(authContext);
    } catch (e) {
      console.warn('setAuthContext failed:', e);
    }
  }, [user, isAuthenticated, token, login, updateToken, refreshToken, logout]);

  // 로그인 후 백그라운드 데이터 프리로딩 (1회)
  useEffect(() => {
    const preload = async () => {
      if (!isAuthenticated || !user || hasPreloadedRef.current) return;
      hasPreloadedRef.current = true;
      try {
        const now = new Date();
        const year = now.getFullYear();
        const previousYear = year - 1;
        const month = now.getMonth() + 1;
        await Promise.allSettled([
          getDiaryCalendar(year, month),
          getAllChallenges(),
          getMyChallenges(),
          getDiaryYear(year), // 감정 비트맵 데이터 프리로딩 (현재 년도)
          getDiaryYear(previousYear), // 감정 비트맵 데이터 프리로딩 (이전 년도)
          user?.id ? getUserInfoApi(parseInt(user.id)) : Promise.resolve(null),
        ]);
      } catch (e) {
        // Preload failed
      }
    };
    preload();
  }, [isAuthenticated, user]);

  const handleSignIn = async (userData: any, token?: string) => {
    try {
      // 로그인 성공 시 토큰이 제공되면 직접 login() 호출
      // 토큰이 없으면 Keychain에서 읽어서 검증
      if (token) {
        await login(userData, token);
      } else {
        // 토큰이 없으면 Keychain에서 읽어서 검증 (기존 로직)
        await new Promise(resolve => setTimeout(resolve, 100));
        await checkAuthState();
      }
    } catch (error: unknown) {
      Alert.alert('오류', '로그인 상태를 확인하는 중 오류가 발생했습니다.');
    }
  };

  const handleLogout = async () => {
    try {
      // React Query 캐시 초기화 (사용자별 데이터 분리)
      queryClient.clear();
      
      await logout();
      Alert.alert('로그아웃', '로그아웃되었습니다.');
    } catch (error: unknown) {
      Alert.alert('오류', '로그아웃 중 오류가 발생했습니다.');
    }
  };

  const handleError = (error: string) => {
    setIsLoading(false);
    Alert.alert('로그인 오류', error);
  };

  // 앱 또는 인증 초기화가 끝나기 전에는 스플래시 유지 (깜빡임 방지)
  if (!appIsReady || authLoading) {
    return null;
  }

  // 로그인 상태에 따라 화면 렌더링
  if (isAuthenticated && user) {
    const mainScreenStartTime = Date.now();
    return (
      <View style={{ flex: 1, backgroundColor: DesignTokens.colors.background }} onLayout={onLayoutRootView}>
        <MainScreen startTime={mainScreenStartTime} />
      </View>
    );
  }

  const dynamicStyles = getStyles(isTablet);

  return (
    <>
      {Platform.OS === 'android' && (
        <StatusBar style="light" backgroundColor={DesignTokens.colors.text} translucent={true} />
      )}
      <SafeAreaView style={dynamicStyles.container} onLayout={onLayoutRootView}>
        <StarField />
        <View style={styles.gradientOverlay} pointerEvents="none" />
        <View style={dynamicStyles.content}>

        <View style={dynamicStyles.panel}>
          <View style={dynamicStyles.logoContainer}>
            {isLogoLoading ? (
              <ActivityIndicator color={DesignTokens.colors.background} />
            ) : (
              <FastImage
                source={require('./assets/images/floppy_mooddisk.png')}
                style={dynamicStyles.logoImage}
                resizeMode={FastImage.resizeMode.contain}
                onLoadEnd={() => setIsLogoLoading(false)}
              />
            )}
            <Text style={dynamicStyles.tagline}>feel, write, save</Text>
            <Text style={dynamicStyles.subtitle}>당신의 감정을 기록 중입니다.</Text>
          </View>
          <Y2KProgressBar progress={progress} />
        </View>

        <View style={styles.loginSection}>
          <View style={dynamicStyles.buttonContainer}>
            <KakaoSignIn 
              onSignIn={handleSignIn}
              onError={handleError}
            />
            <View style={styles.buttonSpacing} />
            <GoogleSignIn 
              onSignIn={handleSignIn}
              onError={handleError}
            />
            <View style={styles.buttonSpacing} />
            <AppleSignIn 
              onSignIn={handleSignIn}
              onError={handleError}
            />
          </View>
        </View>

        <View style={styles.footer}>
          <SystemStatus currentTime={new Date(0)} variant="login" showDate={false} showTime={false} showSystemInfo />
        </View>
      </View>
    </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  starLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.4,
    backgroundColor: 'transparent',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  loginSection: {
    width: "100%",
    alignItems: "center",
  },
  buttonSpacing: {
    height: 16,
  },
  footer: {
    marginTop: 40,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: DesignTokens.colors.gray,
    textAlign: "center",
    lineHeight: 18,
  },
});

// 반응형 스타일 생성 함수
const getStyles = (isTablet: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: DesignTokens.colors.text,
    padding: responsiveValue(20, 40, 60),
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    maxWidth: responsiveValue('100%' as any, 600, 800),
  },
  panel: {
    width: '100%',
    maxWidth: responsiveValue(320, 480, 600),
    backgroundColor: 'transparent',
    borderRadius: 0,
    paddingHorizontal: responsiveValue(20, 40, 60),
    paddingVertical: responsiveValue(24, 32, 40),
    marginBottom: responsiveValue(120, 80, 60),
    alignItems: 'center',
    shadowColor: DesignTokens.colors.text,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  logoContainer: {
    marginTop: responsiveValue(60, 40, 20),
    marginBottom: responsiveValue(32, 40, 48),
    alignItems: 'center',
  },
  logoImage: {
    width: responsiveValue(160, 200, 240),
    height: responsiveValue(160, 200, 240),
  },
  tagline: {
    marginTop: 12,
    fontSize: responsiveValue(18, 22, 26),
    fontWeight: 'bold',
    letterSpacing: 1.2,
    color: DesignTokens.colors.background,
  },
  subtitle: {
    fontSize: responsiveValue(14, 16, 18),
    color: DesignTokens.colors.lightGray,
    textAlign: "center",
    marginTop: 8,
  },
  buttonContainer: {
    width: "100%",
    maxWidth: responsiveValue(320, 400, 480),
    alignItems: "center",
  },
});

export default App;
