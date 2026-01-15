// packages/hooks/src/common/useProgressAnimation.ts
import { useState, useEffect } from "react";

// 진행률 애니메이션 반환 타입
interface UseProgressAnimationReturn {
  progress: number;
  isLoading: boolean;
}

/**
 * 진행률 애니메이션을 관리하는 커스텀 훅
 */
export const useProgressAnimation = (): UseProgressAnimationReturn => {
  const [progress, setProgress] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setIsLoading(false);
          return 100;
        }
        return prev + Math.random() * 15 + 5;
      });
    }, 200);

    return () => {
      clearInterval(progressTimer);
    };
  }, []);

  return { progress, isLoading };
};
