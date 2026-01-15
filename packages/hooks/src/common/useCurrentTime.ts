// packages/hooks/src/common/useCurrentTime.ts
import { useState, useEffect } from "react";

/**
 * 현재 시간을 관리하는 커스텀 훅
 */
export const useCurrentTime = (): Date => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timeTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timeTimer);
    };
  }, []);

  return currentTime;
};
