import React, { useState } from 'react';
import { Platform, View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { GOOGLE_CONFIG, API_ENDPOINTS } from '../../config/auth';
import { setSecureItem, STORAGE_KEYS, clearAllSecureItems } from '../../utils/secureStorage';

// Google Sign-in 설정
GoogleSignin.configure({
  webClientId: GOOGLE_CONFIG.WEB_CLIENT_ID,
  iosClientId: GOOGLE_CONFIG.IOS_CLIENT_ID,
  offlineAccess: true,
});

interface GoogleSignInProps {
  onSignIn?: (userInfo: any, token?: string) => void;
  onError?: (error: string) => void;
}

// Google 로고 SVG 컴포넌트
const GoogleLogo = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" style={styles.googleLogo}>
    <Path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <Path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <Path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <Path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </Svg>
);

export default function GoogleSignIn({ onSignIn, onError }: GoogleSignInProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    if (Platform.OS === 'web') {
      Alert.alert(
        '웹 환경 Google 로그인',
        '웹 환경에서는 Google 로그인이 지원되지 않습니다.\n\n테스트 로그인을 사용하거나 실제 모바일 앱에서 Google 로그인을 테스트해주세요.',
        [
          {
            text: '테스트 로그인',
            onPress: () => {
              const dummyUser = {
                id: 'google-web-test-user-123',
                name: 'Google 웹 테스트 사용자',
                email: 'google-web-test@example.com',
                profileImage: '',
                provider: 'google'
              };
              if (onSignIn) {
                onSignIn(dummyUser);
              }
            }
          },
          { text: '확인', style: 'cancel' }
        ]
      );
      return;
    }

    setIsLoading(true);

    try {
      // Google Play Services 확인 (Android만)
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices();
      }

      // Google 로그인 실행
      const userInfo = await GoogleSignin.signIn();

      // 백엔드로 토큰 전송하여 인증
      const loginResponse = await fetch(API_ENDPOINTS.GOOGLE_MOBILE_LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken: userInfo.idToken,
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
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        return;
      } else if (error.code === statusCodes.IN_PROGRESS) {
        return;
      }
      
      const errorMessage = error.message || 'Google 로그인 중 오류가 발생했습니다.';
      
      if (onError) {
        onError(errorMessage);
      } else {
        Alert.alert('Google 로그인 오류', errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleGoogleSignIn}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#5F6368" size="small" />
        ) : (
          <>
            <View style={styles.googleIcon}>
              <GoogleLogo />
            </View>
            <Text style={styles.buttonText}>Google 계정으로 로그인</Text>
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
    width: 200, // 고정 너비(필요시 조정 가능)
    height: 48, // 통일된 버튼 높이
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start', // Google 가이드: 좌측 정렬 + 텍스트 중앙은 flex로 처리
    paddingLeft: 12, // Google 가이드 좌우 12dp
    paddingRight: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#747775', // Google 공식 테두리 색상
    borderRadius: 4, // Google 가이드: 4dp
    // Google 가이드는 그림자 비권장
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  buttonDisabled: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
  },
  googleIcon: {
    width: 18, // Google 가이드: 로고 18dp
    height: 18,
    marginRight: 10, // Google 가이드: 로고와 텍스트 간격 10dp
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleLogo: {
    // SVG 스타일링
  },
  buttonText: {
    flex: 1, // 텍스트 중앙 정렬을 위해 flex 확장
    textAlign: 'center',
    fontSize: 14, // Google 가이드: 14sp
    fontWeight: '500', // Roboto Medium 500
    fontFamily: Platform.OS === 'ios' ? 'Roboto' : 'Roboto',
    color: '#1F1F1F', // Google 가이드 텍스트 색상
  },
});