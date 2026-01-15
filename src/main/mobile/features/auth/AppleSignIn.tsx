import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { setSecureItem, STORAGE_KEYS, clearAllSecureItems } from '../../utils/secureStorage';
import { APPLE_CONFIG, API_ENDPOINTS } from '../../config/auth';

// Apple Authentication Button import
let AppleAuthenticationButton: any = null;
if (Platform.OS === 'ios') {
  try {
    const AppleAuthentication = require('@invertase/react-native-apple-authentication');
    AppleAuthenticationButton = AppleAuthentication.AppleAuthenticationButton;
  } catch (error) {
  }
}

// iOS에서만 Apple 로그인 import
let appleAuth: any = null;
if (Platform.OS === 'ios') {
  try {
    const AppleAuthentication = require('@invertase/react-native-apple-authentication');
    appleAuth = AppleAuthentication.default || AppleAuthentication;
  } catch (error) {
  }
}

interface AppleSignInProps {
  onSignIn?: (userInfo: any, token?: string) => void;
  onError?: (error: string) => void;
}

// Apple 로고 SVG 컴포넌트
const AppleLogo = () => (
  <Svg width="16" height="16" viewBox="0 0 24 24" style={styles.appleLogo}>
    <Path
      d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"
      fill="#000000"
    />
  </Svg>
);

export default function AppleSignIn({ onSignIn, onError }: AppleSignInProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Android에서는 버튼 자체를 렌더링하지 않음
  if (Platform.OS === 'android') {
    return null;
  }

  const handleAppleLogin = async () => {
    // iOS에서만 동작


    if (!appleAuth) {
      Alert.alert('오류', 'Apple 로그인 모듈을 사용할 수 없습니다.');
      return;
    }

    // Apple 로그인 사용 가능 여부 확인 (isAvailable이 undefined이므로 제거)
   
    setIsLoading(true);

    try {
      // Apple 로그인 실행

      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });


      // 백엔드로 Apple 인증 정보 전송
      const loginResponse = await fetch(API_ENDPOINTS.APPLE_LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identityToken: appleAuthRequestResponse.identityToken,
          authorizationCode: appleAuthRequestResponse.authorizationCode,
          user: appleAuthRequestResponse.user,
          fullName: appleAuthRequestResponse.fullName,
          email: appleAuthRequestResponse.email,
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
    } catch (error) {

      const errorMessage = error instanceof Error ? error.message : 'Apple 로그인 중 오류가 발생했습니다.';
      
      if (onError) {
        onError(errorMessage);
      } else {
        Alert.alert('Apple 로그인 오류', errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // iOS에서 Apple SDK 버튼 사용
  if (Platform.OS === 'ios' && AppleAuthenticationButton) {
    return (
      <View style={styles.container}>
        <AppleAuthenticationButton
          buttonType={AppleAuthenticationButton.Type.SIGN_IN}
          buttonStyle={AppleAuthenticationButton.Style.WHITE}
          cornerRadius={10}
          style={styles.appleSDKButton}
          onPress={handleAppleLogin}
        />
      </View>
    );
  }

  // Android 또는 fallback 커스텀 버튼
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleAppleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#000" size="small" />
        ) : (
          <>
            <AppleLogo />
            <Text style={styles.buttonText}>Sign in with Apple</Text>
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
  appleSDKButton: {
    width: 200,
    height: 48, // 통일된 버튼 높이
  },
  button: {
    backgroundColor: '#ffffff',
    borderRadius: 10, // Apple 가이드: 8-12pt 범위 내
    width: 200, // Apple 가이드: 표준 소셜 로그인 버튼 너비
    height: 48, // 통일된 버튼 높이
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  buttonDisabled: {
    backgroundColor: '#f3f4f6',
  },
  appleLogo: {
    marginRight: 8,
  },
  buttonText: {
    color: '#000000',
    fontSize: 16, // Apple 가이드: 더 큰 폰트 사이즈
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    textAlign: 'center',
  },
});
