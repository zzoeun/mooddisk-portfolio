import { useState, useCallback } from "react";
import * as Location from "expo-location";
import { Alert, Linking, Platform } from "react-native";

export interface LocationInfo {
  latitude: number;
  longitude: number;
  locationName?: string;
  address?: string;
}

export interface UseLocationReturn {
  location: LocationInfo | null;
  isLoading: boolean;
  error: string | null;
  getCurrentLocation: () => Promise<LocationInfo | null>;
  clearLocation: () => void;
  hasPermission: boolean | null; // null = 아직 확인 안함, true/false = 권한 상태
}

/**
 * 위치 정보를 관리하는 커스텀 훅
 *
 * @returns 위치 정보, 로딩 상태, 에러, 위치 가져오기 함수 등
 */
export const useLocation = (): UseLocationReturn => {
  const [location, setLocation] = useState<LocationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  /**
   * 위치 권한 확인 및 요청
   */
  const checkAndRequestPermission = useCallback(async (): Promise<boolean> => {
    try {
      // 현재 권한 상태 확인
      const { status: existingStatus } =
        await Location.getForegroundPermissionsAsync();

      if (existingStatus === "granted") {
        setHasPermission(true);
        return true;
      }

      // 권한이 없으면 요청
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status === "granted") {
        setHasPermission(true);
        return true;
      }

      // 권한이 거부된 경우
      setHasPermission(false);

      if (status === "denied") {
        // iOS에서 영구적으로 거부된 경우
        if (Platform.OS === "ios") {
          Alert.alert(
            "위치 권한 필요",
            "위치 정보를 사용하려면 위치 권한이 필요합니다. 설정에서 위치 권한을 허용해주세요.",
            [
              { text: "취소", style: "cancel" },
              {
                text: "설정으로 이동",
                onPress: () => Linking.openSettings(),
              },
            ]
          );
        } else {
          // Android
          Alert.alert(
            "위치 권한 필요",
            "위치 정보를 사용하려면 위치 권한이 필요합니다. 설정에서 위치 권한을 허용해주세요.",
            [
              { text: "취소", style: "cancel" },
              {
                text: "설정으로 이동",
                onPress: () => Linking.openSettings(),
              },
            ]
          );
        }
      }

      return false;
    } catch (err) {
      console.error("위치 권한 확인 실패:", err);
      setHasPermission(false);
      setError("위치 권한을 확인하는 중 오류가 발생했습니다.");
      return false;
    }
  }, []);

  /**
   * 현재 위치 가져오기
   */
  const getCurrentLocation =
    useCallback(async (): Promise<LocationInfo | null> => {
      setIsLoading(true);
      setError(null);

      try {
        // 권한 확인 및 요청
        const hasPermission = await checkAndRequestPermission();

        if (!hasPermission) {
          setError("위치 권한이 필요합니다.");
          setIsLoading(false);
          return null;
        }

        // 위치 서비스 활성화 확인 (Android)
        if (Platform.OS === "android") {
          const isEnabled = await Location.hasServicesEnabledAsync();
          if (!isEnabled) {
            Alert.alert(
              "위치 서비스 비활성화",
              "위치 서비스를 활성화해주세요.",
              [
                { text: "취소", style: "cancel" },
                {
                  text: "설정으로 이동",
                  onPress: () => Linking.openSettings(),
                },
              ]
            );
            setError("위치 서비스가 비활성화되어 있습니다.");
            setIsLoading(false);
            return null;
          }
        }

        // 현재 위치 가져오기
        const locationResult = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced, // 정확도와 배터리 사용량의 균형
          // High accuracy는 더 정확하지만 배터리를 많이 사용
          // Low accuracy는 배터리를 적게 사용하지만 정확도가 낮음
        });

        const locationInfo: LocationInfo = {
          latitude: locationResult.coords.latitude,
          longitude: locationResult.coords.longitude,
          // locationName과 address는 나중에 Google Places API로 역지오코딩하여 설정
        };

        setLocation(locationInfo);
        setIsLoading(false);
        return locationInfo;
      } catch (err: any) {
        console.error("위치 가져오기 실패:", err);

        let errorMessage = "위치 정보를 가져오는 중 오류가 발생했습니다.";

        if (err.code === "E_LOCATION_UNAVAILABLE") {
          errorMessage =
            "위치 서비스를 사용할 수 없습니다. GPS가 켜져 있는지 확인해주세요.";
        } else if (err.code === "E_LOCATION_TIMEOUT") {
          errorMessage =
            "위치 정보를 가져오는 데 시간이 초과되었습니다. 다시 시도해주세요.";
        } else if (err.message) {
          errorMessage = err.message;
        }

        setError(errorMessage);
        setIsLoading(false);

        Alert.alert("위치 가져오기 실패", errorMessage);
        return null;
      }
    }, [checkAndRequestPermission]);

  /**
   * 위치 정보 초기화
   */
  const clearLocation = useCallback(() => {
    setLocation(null);
    setError(null);
  }, []);

  return {
    location,
    isLoading,
    error,
    getCurrentLocation,
    clearLocation,
    hasPermission,
  };
};

