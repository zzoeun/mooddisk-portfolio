import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APPLE_CONFIG, API_ENDPOINTS } from '../../config/auth';

interface AppleSignInProps {
  onSignIn?: (userInfo: any) => void;
  onError?: (error: string) => void;
}

export default function AppleSignIn({ onSignIn, onError }: AppleSignInProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAppleLogin = async () => {
    Alert.alert(
      '웹 환경 Apple 로그인',
      '웹 환경에서는 Apple 로그인이 지원되지 않습니다.\n\n테스트 로그인을 사용하거나 실제 iOS 앱에서 Apple 로그인을 테스트해주세요.',
      [
        {
          text: '테스트 로그인',
          onPress: () => {
            // 더미 사용자 데이터로 로그인 테스트
            const dummyUser = {
              id: 'apple-web-test-user-123',
              name: 'Apple 웹 테스트 사용자',
              email: 'apple-web-test@example.com',
              profileImage: '',
              provider: 'apple'
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
        onPress={handleAppleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Text style={styles.buttonText}>Apple로 로그인</Text>
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
    backgroundColor: '#000', // Apple black
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
