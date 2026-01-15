import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * Google Places API 키 가져오기 (플랫폼별)
 */
export const getGooglePlacesApiKey = (): string => {
  const extra = Constants.expoConfig?.extra || {};

  // 플랫폼별 키 우선 사용
  let apiKey: string | undefined;
  if (Platform.OS === "ios") {
    apiKey = extra.googlePlacesApiKeyIos;
  } else if (Platform.OS === "android") {
    apiKey = extra.googlePlacesApiKeyAndroid;
  }

  if (!apiKey) {
    console.warn(
      `Google Places API 키가 설정되지 않았습니다. (플랫폼: ${Platform.OS})`
    );
    return "";
  }

  return apiKey;
};

/**
 * 검색 결과 타입
 */
export interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  types: string[];
}

/**
 * Place Details 결과 타입
 */
export interface PlaceDetails {
  place_id: string;
  displayName?: string; // 장소명 (예: "스타벅스 강남점", "미소야 행신점")
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  formatted_address: string;
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
}

/**
 * Session Token 생성
 * Session Token을 사용하면 Autocomplete는 무료이고 Place Details만 과금됩니다.
 */
export const generateSessionToken = (): string => {
  // 간단한 UUID 생성 (실제로는 더 안전한 방법 사용 가능)
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

/**
 * Google Places Autocomplete API 호출 (Places API New - Session Token 사용)
 */
export const searchPlaces = async (
  query: string,
  apiKey: string,
  sessionToken?: string
): Promise<PlacePrediction[]> => {
  if (!query.trim() || !apiKey) {
    return [];
  }

  try {
    // Places API (New) 엔드포인트
    const url = "https://places.googleapis.com/v1/places:autocomplete";

    // 요청 본문 구성
    const requestBody: any = {
      input: query.trim(),
      languageCode: "ko",
      includedRegionCodes: [], // 모든 지역 검색
    };

    // Session Token이 있으면 추가
    if (sessionToken) {
      requestBody.sessionToken = sessionToken;
    }

    // 헤더 구성
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
    };

    // iOS 번들 ID 추가 (iOS 앱에서 필수)
    if (Platform.OS === "ios") {
      const bundleId =
        Constants.expoConfig?.ios?.bundleIdentifier || "com.mooddisk.mobile";
      headers["X-Ios-Bundle-Identifier"] = bundleId;
    }

    // Android 패키지명 추가 (Android 앱에서 필수)
    if (Platform.OS === "android") {
      const packageName =
        Constants.expoConfig?.android?.package || "com.mooddisk.mobile";
      headers["X-Goog-Android-Package"] = packageName;
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    // Places API (New) 응답 형식 변환
    if (data.suggestions && Array.isArray(data.suggestions)) {
      return data.suggestions.map((suggestion: any) => {
        const placePrediction = suggestion.placePrediction;
        return {
          place_id: placePrediction.placeId,
          description: placePrediction.text?.text || "",
          structured_formatting: {
            main_text: placePrediction.text?.text?.split(",")[0] || "",
            secondary_text: placePrediction.text?.text || "",
          },
          types: placePrediction.types || [],
        };
      });
    }

    // 오류 처리
    if (data.error) {
      console.error("Google Places API 오류:", data.error.code);
      if (data.error.message) {
        console.error("오류 메시지:", data.error.message);
      }
    }
    return [];
  } catch (error) {
    console.error("Places 검색 실패:", error);
    return [];
  }
};

/**
 * Google Places Details API 호출 (Places API New - Session Token 사용)
 * Session Token을 사용하면 Autocomplete는 무료이고 Place Details만 과금됩니다.
 */
export const getPlaceDetails = async (
  placeId: string,
  apiKey: string,
  sessionToken?: string
): Promise<PlaceDetails | null> => {
  if (!placeId || !apiKey) {
    return null;
  }

  try {
    // 필드 마스크 구성 (displayName 포함하여 정확한 장소명 가져오기)
    const fields = "id,displayName,location,formattedAddress,addressComponents";

    // Places API (New) 엔드포인트 (URL 쿼리 파라미터로 fields 전달)
    let url = `https://places.googleapis.com/v1/places/${encodeURIComponent(
      placeId
    )}?fields=${fields}&key=${apiKey}`;

    // Session Token이 있으면 추가 (Autocomplete를 무료로 만들기 위해)
    if (sessionToken) {
      url += `&sessionToken=${encodeURIComponent(sessionToken)}`;
    }

    // 헤더 구성
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // iOS 번들 ID 추가 (iOS 앱에서 필수)
    if (Platform.OS === "ios") {
      const bundleId =
        Constants.expoConfig?.ios?.bundleIdentifier || "com.mooddisk.mobile";
      headers["X-Ios-Bundle-Identifier"] = bundleId;
    }

    // Android 패키지명 추가 (Android 앱에서 필수)
    if (Platform.OS === "android") {
      const packageName =
        Constants.expoConfig?.android?.package || "com.mooddisk.mobile";
      headers["X-Goog-Android-Package"] = packageName;
    }

    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    const data = await response.json();

    // Places API (New) 응답 형식 변환
    if (data.id) {
      const lat = data.location?.latitude ?? data.location?.lat ?? 0;
      const lng = data.location?.longitude ?? data.location?.lng ?? 0;
      const displayName = data.displayName?.text || "";

      return {
        place_id: data.id,
        displayName: displayName, // 정확한 장소명
        geometry: {
          location: {
            lat: lat,
            lng: lng,
          },
        },
        formatted_address: data.formattedAddress || "",
        address_components:
          data.addressComponents?.map((comp: any) => ({
            long_name: comp.longText || comp.long_name || "",
            short_name: comp.shortText || comp.short_name || "",
            types: comp.types || [],
          })) || [],
      };
    }

    // 오류 처리
    if (data.error) {
      console.error("Place Details API 오류:", data.error.code);
      if (data.error.message) {
        console.error("오류 메시지:", data.error.message);
      }
    }
    return null;
  } catch (error) {
    console.error("Place Details 조회 실패:", error);
    return null;
  }
};

/**
 * 장소 타입을 한글로 변환
 */
export const getPlaceTypeLabel = (types: string[]): string => {
  // 나라
  if (types.includes("country")) {
    return "나라";
  }
  // 도시
  if (types.includes("locality")) {
    return "도시";
  }
  // 행정 구역 (주/도, 시/군 등)
  if (
    types.includes("administrative_area_level_1") ||
    types.includes("administrative_area_level_2")
  ) {
    return "지역";
  }
  // 숙소
  if (types.includes("lodging") || types.includes("establishment")) {
    return "숙소";
  }
  // 명소
  if (
    types.includes("tourist_attraction") ||
    types.includes("point_of_interest")
  ) {
    return "명소";
  }
  return "장소";
};

/**
 * 장소 타입에 따른 아이콘 이름 반환
 */
export const getPlaceIcon = (types: string[]): string => {
  // 나라
  if (types.includes("country")) {
    return "globe"; // 지구본 아이콘
  }
  // 도시
  if (types.includes("locality")) {
    return "map-pin"; // 위치 핀
  }
  // 행정 구역
  if (
    types.includes("administrative_area_level_1") ||
    types.includes("administrative_area_level_2")
  ) {
    return "map-pin";
  }
  // 숙소
  if (types.includes("lodging") || types.includes("establishment")) {
    return "home";
  }
  // 명소
  if (
    types.includes("tourist_attraction") ||
    types.includes("point_of_interest")
  ) {
    return "map-pin";
  }
  return "map-pin";
};
