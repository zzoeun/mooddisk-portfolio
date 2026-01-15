import { useState, useEffect, useMemo } from "react";
import { Dimensions, ScaledSize } from "react-native";
import { getDeviceInfo, DeviceInfo } from "../utils/deviceUtils";

/**
 * 디바이스 정보를 반환하는 Hook
 * 화면 회전 시 자동으로 업데이트됨
 */
export const useDeviceInfo = (): DeviceInfo => {
  const [dimensions, setDimensions] = useState(() => Dimensions.get("window"));

  useEffect(() => {
    const updateDimensions = ({ window }: { window: ScaledSize }) => {
      // 실제로 크기가 변경된 경우에만 업데이트
      setDimensions((prev) => {
        if (prev.width !== window.width || prev.height !== window.height) {
          return window;
        }
        return prev;
      });
    };

    // 화면 크기 변경 감지 (회전 등)
    const subscription = Dimensions.addEventListener(
      "change",
      updateDimensions
    );

    return () => {
      subscription?.remove();
    };
  }, []);

  // dimensions가 변경될 때만 getDeviceInfo 호출
  const deviceInfo = useMemo(() => {
    return getDeviceInfo();
  }, [dimensions.width, dimensions.height]);

  return deviceInfo;
};

/**
 * 태블릿 여부만 반환하는 간단한 Hook
 */
export const useIsTablet = (): boolean => {
  const { isTablet } = useDeviceInfo();
  return isTablet;
};
