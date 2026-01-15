import React, { useState } from 'react';
import { Platform, View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { setSecureItem, STORAGE_KEYS, clearAllSecureItems } from '../../utils/secureStorage';
import { KAKAO_CONFIG, API_ENDPOINTS } from '../../config/auth';

// 카카오 로그인 import
let kakaoLogin: any = null;
try {
  kakaoLogin = require('@react-native-seoul/kakao-login');
      } catch (error) {
      }

interface KakaoSignInProps {
  onSignIn?: (userInfo: any, token?: string) => void;
  onError?: (error: string) => void;
}

// 카카오 로고 SVG 컴포넌트
const KakaoLogo = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" style={styles.kakaoLogo}>
    <Path
      d="M12 3C6.48 3 2 6.48 2 10.8c0 2.7 1.8 5.1 4.5 6.4L5.5 21l4.2-2.1c.8.1 1.6.1 2.3.1 5.52 0 10-3.48 10-7.8S17.52 3 12 3z"
      fill="#3C1E1E"
    />
  </Svg>
);

export default function KakaoSignIn({ onSignIn, onError }: KakaoSignInProps) {
  const [isLoading, setIsLoading] = useState(false);

  // 카카오 SDK 초기화
  React.useEffect(() => {
    if (kakaoLogin && Platform.OS !== 'web') {
      try {
        if (kakaoLogin.init) {
          kakaoLogin.init(KAKAO_CONFIG.NATIVE_APP_KEY);
        }
      } catch (error) {
      }
    }
  }, []);

  const handleKakaoLogin = async () => {
    // 웹 환경에서는 테스트 로그인만 제공
    if (Platform.OS === 'web') {
      handleWebLogin();
      return;
    }

    if (!kakaoLogin) {
      Alert.alert('오류', '카카오 로그인 모듈을 사용할 수 없습니다.');
      return;
    }

    setIsLoading(true);

    try {
      let loginResult;

      // 1. 카카오톡으로 로그인 시도 (권장 방법)
      try {
        loginResult = await kakaoLogin.login();
      } catch (kakaoTalkError) {
        // 2. 카카오톡이 실패한 경우 카카오계정으로 로그인
        try {
          loginResult = await kakaoLogin.loginWithKakaoAccount();
        } catch (accountError) {
          throw accountError;
        }
      }

      // 3. 사용자 프로필 정보 가져오기
      const profile = await kakaoLogin.getProfile();

      // 4. 백엔드로 카카오 사용자 정보 전송하여 로그인
      const loginResponse = await fetch(API_ENDPOINTS.KAKAO_MOBILE_LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken: loginResult.accessToken,
          refreshToken: loginResult.refreshToken,
          profile: profile,
          platform: Platform.OS
        }),
      });

      if (!loginResponse.ok) {
        const errorText = await loginResponse.text();
        throw new Error(`로그인 실패: ${errorText}`);
      }

      const loginData = await loginResponse.json();

      // 기존 Keychain 데이터 정리 (손상된 데이터 방지)
      await clearAllSecureItems();

      // 새 토큰을 secureStorage에 저장 (access + refresh)
      await setSecureItem(STORAGE_KEYS.AUTH_TOKEN, loginData.token);
      if (loginData.refreshToken) {
        await setSecureItem(STORAGE_KEYS.REFRESH_TOKEN, loginData.refreshToken);
      }
      await setSecureItem(STORAGE_KEYS.USER_INFO, JSON.stringify(loginData.user));
      
      // 토큰 저장 완료 확인을 위한 짧은 지연
      await new Promise(resolve => setTimeout(resolve, 50));
      
      if (onSignIn) {
        onSignIn(loginData.user, loginData.token);
      }
    } catch (error: any) {
      // 사용자가 로그인을 취소한 경우
      if (error?.code === 'CANCELLED') {
        return;
      }
      
      const errorMessage = error instanceof Error ? error.message : '카카오 로그인 중 오류가 발생했습니다.';
      
      if (onError) {
        onError(errorMessage);
      } else {
        Alert.alert('카카오 로그인 오류', errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleWebLogin = () => {
    Alert.alert(
      '웹 환경 카카오 로그인',
      '웹 환경에서는 카카오 로그인이 지원되지 않습니다.\n\n테스트 로그인을 사용하거나 실제 모바일 앱에서 카카오 로그인을 테스트해주세요.',
      [
        {
          text: '테스트 로그인',
          onPress: () => {
            // 더미 사용자 데이터로 로그인 테스트
            const dummyUser = {
              id: 'kakao-web-test-user-123',
              name: '카카오 웹 테스트 사용자',
              email: 'kakao-web-test@example.com',
              profileImage: '',
              provider: 'kakao'
            };
            if (onSignIn) {
              onSignIn(dummyUser);
            }
          }
        },
        {
          text: '확인',
          style: 'cancel'
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleKakaoLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="rgba(0, 0, 0, 0.85)" size="small" />
        ) : (
          <>
            <View style={styles.kakaoIcon}
            >
              <KakaoLogo />
            </View>
            <Text style={styles.buttonText}>카카오로 로그인</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
    width: 200, // Apple 가이드: 표준 소셜 로그인 버튼 너비
    height: 48, // 통일된 버튼 높이 (카카오 권장과 일치)
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start', // Google과 동일하게 좌측 정렬 + 텍스트 중앙은 flex로 처리
    paddingLeft: 12, // Google 가이드와 동일한 좌우 패딩
    paddingRight: 12,
    backgroundColor: '#fee500', // 카카오 공식 색상
    borderWidth: 0,
    borderRadius: 10, // Apple 가이드: 8-12pt 범위 내
    // 카카오 가이드: 그림자 사용하지 않음
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  kakaoIcon: {
    width: 18,
    height: 18,
    marginRight: 10, // Google과 동일한 간격
    alignItems: 'center',
    justifyContent: 'center',
  },
  kakaoLogo: {
    // SVG 스타일링
  },
  buttonText: {
    flex: 1, // 텍스트를 가운데 정렬하기 위해 남은 공간을 채움
    textAlign: 'center',
    fontSize: 15, // 카카오 가이드 권장 폰트 사이즈
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    color: 'rgba(0, 0, 0, 0.85)', // 카카오 가이드: 라벨 색상
  },
});
