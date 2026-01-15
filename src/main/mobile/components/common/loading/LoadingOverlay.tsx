import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, AppState, AppStateStatus } from 'react-native';
import DesignTokens from '../../../constants/designTokens';

interface LoadingOverlayProps {
  message?: string;
  progress?: number; // 0-100, undefined면 자동 애니메이션
  color?: string;
  backgroundColor?: string;
  duration?: number; // 애니메이션 지속시간 (ms)
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message = 'Loading...',
  progress,
  color = DesignTokens.colors.secondary,
  backgroundColor = DesignTokens.colors.background,
  duration = 3000,
}) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const segments = 20;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const isActiveRef = useRef<boolean>(true);

  useEffect(() => {
    if (progress === undefined) {
      // 자동 애니메이션
      const startAnimation = () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        
        intervalRef.current = setInterval(() => {
          if (!isActiveRef.current) return; // 백그라운드에서는 업데이트하지 않음
          
          setAnimatedProgress(prev => {
            if (prev >= 100) {
              return 0; // 100%에 도달하면 다시 0%부터 시작
            }
            return prev + 1; // 1%씩 증가 (조금 천천히)
          });
        }, duration / 200); // duration을 200등분해서 더 부드럽게 애니메이션
      };

      const stopAnimation = () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };

      // AppState 변경 감지
      const handleAppStateChange = (nextAppState: AppStateStatus) => {
        if (nextAppState.match(/inactive|background/)) {
          // 백그라운드로 갈 때: 애니메이션 정지
          isActiveRef.current = false;
          stopAnimation();
        } else if (nextAppState === 'active') {
          // 포그라운드로 돌아올 때: 애니메이션 재시작
          isActiveRef.current = true;
          startAnimation();
        }
        appStateRef.current = nextAppState;
      };

      const subscription = AppState.addEventListener('change', handleAppStateChange);

      // 초기 애니메이션 시작
      startAnimation();

      return () => {
        subscription.remove();
        stopAnimation();
      };
    } else {
      // 고정된 progress 값 사용
      setAnimatedProgress(progress);
    }
  }, [progress, duration]);

  const filledSegments = Math.round((animatedProgress / 100) * segments);

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={[styles.progressContainer, { borderColor: color }]}>
        {Array.from({ length: segments }, (_, index) => (
          <View
            key={index}
            style={[
              styles.segment,
              {
                backgroundColor: index < filledSegments ? color : 'transparent',
                borderColor: color,
              },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.text, { color }]}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 52, // 헤더 높이만큼 아래로 이동
    marginBottom: 80, // 탭바 높이만큼 위로 이동
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 6,
    textAlign: 'center',
    fontFamily: DesignTokens.fonts.default,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderWidth: 1,
    padding: 2,
    borderRadius: 0,
  },
  segment: {
    width: 12,
    height: 20,
    borderWidth: 1,
    borderRadius: 0,
  },
});
