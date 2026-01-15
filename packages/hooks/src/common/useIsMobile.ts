// packages/hooks/src/common/useIsMobile.ts
import { useState, useEffect } from "react";

/**
 * 모바일 화면 여부를 감지하는 커스텀 훅
 */
export const useIsMobile = (): boolean => {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const checkIsMobile = (): void => {
      setIsMobile(window.innerWidth < 768); // md 브레이크포인트
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);

    return () => {
      window.removeEventListener("resize", checkIsMobile);
    };
  }, []);

  return isMobile;
};
