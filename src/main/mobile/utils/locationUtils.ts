import Constants from "expo-constants";
import { Platform } from "react-native";
import {
  getGooglePlacesApiKey,
  getPlaceDetails,
  PlaceDetails,
} from "./googlePlaces";

/**
 * 위치 정보 타입
 */
export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

/**
 * 역지오코딩 결과 타입
 */
export interface ReverseGeocodeResult {
  locationName: string; // 장소명 (예: "센소지", "스카이트리")
  address: string; // 전체 주소
  placeId?: string; // Google Places place_id
}

/**
 * Google Places API 키 가져오기
 */
const getApiKey = (): string => {
  return getGooglePlacesApiKey();
};

/**
 * 좌표로부터 근처 장소 리스트를 찾기 (Places API Nearby Search)
 *
 * @param latitude 위도
 * @param longitude 경도
 * @param maxCount 최대 반환 개수 (기본값: 10)
 * @returns PlaceDetails 배열
 */
export const findNearbyPlaces = async (
  latitude: number,
  longitude: number,
  maxCount: number = 10
): Promise<PlaceDetails[]> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("Google Places API 키가 설정되지 않았습니다.");
    return [];
  }

  try {
    // Places API (New) - Search Nearby 엔드포인트
    const url = "https://places.googleapis.com/v1/places:searchNearby";

    // 요청 본문 구성
    // 지원되는 타입만 사용 (point_of_interest, establishment는 지원되지 않음)
    const requestBody = {
      includedTypes: [
        "tourist_attraction",
        "lodging",
        "restaurant",
        "cafe",
        "store",
        "shopping_mall",
        "museum",
        "park",
      ], // 확실히 지원되는 타입만 사용
      maxResultCount: Math.min(maxCount, 20), // 최대 20개까지 (API 제한)
      locationRestriction: {
        circle: {
          center: {
            latitude: latitude,
            longitude: longitude,
          },
          radius: 500.0, // 500미터 반경 내에서 검색 (더 많은 결과를 위해 확대)
        },
      },
      languageCode: "ko",
    };

    // 헤더 구성
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.location,places.addressComponents,places.types",
    };

    // iOS 번들 ID 추가
    if (Platform.OS === "ios") {
      const bundleId =
        Constants.expoConfig?.ios?.bundleIdentifier || "com.mooddisk.mobile";
      headers["X-Ios-Bundle-Identifier"] = bundleId;
    }

    // Android 패키지명 추가
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

    // Places API (New) 응답 형식 처리
    if (data.places && Array.isArray(data.places) && data.places.length > 0) {
      const places: PlaceDetails[] = [];

      // 각 장소에 대해 Place Details를 가져오기 (선택적 - 성능 고려)
      // 우선 Nearby Search 결과를 사용하고, 필요시 Place Details 호출
      for (const place of data.places) {
        const placeId = place.id;
        const lat = place.location?.latitude ?? place.location?.lat ?? latitude;
        const lng =
          place.location?.longitude ?? place.location?.lng ?? longitude;
        const displayName = place.displayName?.text || "";
        const formattedAddress = place.formattedAddress || "";

        // Place Details를 가져와서 더 자세한 정보 획득 (선택적)
        let placeDetails: PlaceDetails | null = null;
        if (placeId) {
          placeDetails = await getPlaceDetails(placeId, apiKey);
        }

        if (placeDetails) {
          places.push(placeDetails);
        } else {
          // Place Details를 가져오지 못한 경우, Nearby Search 결과를 변환
          // displayName이 있으면 우선 사용
          places.push({
            place_id: placeId || "",
            displayName: displayName || undefined, // Nearby Search에서 가져온 displayName
            geometry: {
              location: {
                lat: lat,
                lng: lng,
              },
            },
            formatted_address: formattedAddress || displayName || "",
            address_components:
              place.addressComponents?.map((comp: any) => ({
                long_name: comp.longText || comp.long_name || "",
                short_name: comp.shortText || comp.short_name || "",
                types: comp.types || [],
              })) || [],
          });
        }
      }

      return places;
    }

    // 오류 처리
    if (data.error) {
      console.error("Places Nearby Search API 오류:", data.error.code);
      if (data.error.message) {
        console.error("오류 메시지:", data.error.message);
      }
    }

    return [];
  } catch (error) {
    console.error("Nearby Places 검색 실패:", error);
    return [];
  }
};

/**
 * 좌표로부터 가장 가까운 장소를 찾기 (Places API Nearby Search)
 *
 * @param latitude 위도
 * @param longitude 경도
 * @returns PlaceDetails 또는 null
 */
const findNearbyPlace = async (
  latitude: number,
  longitude: number
): Promise<PlaceDetails | null> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("Google Places API 키가 설정되지 않았습니다.");
    return null;
  }

  try {
    // Places API (New) - Search Nearby 엔드포인트
    const url = "https://places.googleapis.com/v1/places:searchNearby";

    // 요청 본문 구성
    // 지원되는 타입만 사용 (point_of_interest, establishment는 지원되지 않음)
    const requestBody = {
      includedTypes: [
        "tourist_attraction",
        "lodging",
        "restaurant",
        "cafe",
        "store",
        "shopping_mall",
        "museum",
        "park",
      ], // 확실히 지원되는 타입만 사용
      maxResultCount: 1, // 가장 가까운 장소 1개만
      locationRestriction: {
        circle: {
          center: {
            latitude: latitude,
            longitude: longitude,
          },
          radius: 100.0, // 100미터 반경 내에서 검색
        },
      },
      languageCode: "ko",
    };

    // 헤더 구성
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.location,places.addressComponents,places.types",
    };

    // iOS 번들 ID 추가
    if (Platform.OS === "ios") {
      const bundleId =
        Constants.expoConfig?.ios?.bundleIdentifier || "com.mooddisk.mobile";
      headers["X-Ios-Bundle-Identifier"] = bundleId;
    }

    // Android 패키지명 추가
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

    // Places API (New) 응답 형식 처리
    if (data.places && Array.isArray(data.places) && data.places.length > 0) {
      const place = data.places[0];
      const placeId = place.id;

      // Place Details를 가져와서 더 자세한 정보 획득
      if (placeId) {
        const placeDetails = await getPlaceDetails(placeId, apiKey);
        if (placeDetails) {
          return placeDetails;
        }
      }

      // Place Details를 가져오지 못한 경우, Nearby Search 결과를 변환
      const lat = place.location?.latitude ?? place.location?.lat ?? latitude;
      const lng = place.location?.longitude ?? place.location?.lng ?? longitude;

      return {
        place_id: placeId || "",
        geometry: {
          location: {
            lat: lat,
            lng: lng,
          },
        },
        formatted_address:
          place.formattedAddress || place.displayName?.text || "",
        address_components:
          place.addressComponents?.map((comp: any) => ({
            long_name: comp.longText || comp.long_name || "",
            short_name: comp.shortText || comp.short_name || "",
            types: comp.types || [],
          })) || [],
      };
    }

    // 오류 처리
    if (data.error) {
      console.error("Places Nearby Search API 오류:", data.error.code);
      if (data.error.message) {
        console.error("오류 메시지:", data.error.message);
      }
    }

    return null;
  } catch (error) {
    console.error("Nearby Place 검색 실패:", error);
    return null;
  }
};

/**
 * Google Geocoding API를 사용한 역지오코딩 (대체 방법)
 * Places API로 장소를 찾지 못한 경우 사용
 *
 * @param latitude 위도
 * @param longitude 경도
 * @returns ReverseGeocodeResult 또는 null
 */
const reverseGeocodeWithGeocodingAPI = async (
  latitude: number,
  longitude: number
): Promise<ReverseGeocodeResult | null> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    return null;
  }

  try {
    // Google Geocoding API 엔드포인트
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&language=ko&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.results && data.results.length > 0) {
      const result = data.results[0];

      // 주소 컴포넌트에서 장소명 추출
      let locationName = "";
      const addressComponents = result.address_components || [];

      // 관광지, 명소, 장소명 찾기
      for (const component of addressComponents) {
        if (
          component.types.includes("point_of_interest") ||
          component.types.includes("establishment") ||
          component.types.includes("tourist_attraction")
        ) {
          locationName = component.long_name;
          break;
        }
      }

      // 장소명을 찾지 못한 경우, 첫 번째 주소 컴포넌트 사용
      if (!locationName && addressComponents.length > 0) {
        locationName = addressComponents[0].long_name;
      }

      return {
        locationName: locationName || result.formatted_address.split(",")[0],
        address: result.formatted_address,
      };
    }

    return null;
  } catch (error) {
    console.error("Geocoding API 역지오코딩 실패:", error);
    return null;
  }
};

/**
 * 좌표를 장소명과 주소로 변환 (역지오코딩)
 *
 * 1. Places API Nearby Search로 가장 가까운 장소 찾기 시도
 * 2. 실패 시 Geocoding API 사용
 *
 * @param latitude 위도
 * @param longitude 경도
 * @returns ReverseGeocodeResult 또는 null
 */
export const reverseGeocode = async (
  latitude: number,
  longitude: number
): Promise<ReverseGeocodeResult | null> => {
  if (
    latitude === null ||
    latitude === undefined ||
    longitude === null ||
    longitude === undefined ||
    isNaN(latitude) ||
    isNaN(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    console.warn("유효하지 않은 좌표:", { latitude, longitude });
    return null;
  }

  try {
    // 1. Places API로 가장 가까운 장소 찾기 시도
    const nearbyPlace = await findNearbyPlace(latitude, longitude);

    if (nearbyPlace) {
      // 장소명 추출 (formatted_address의 첫 부분 또는 address_components에서)
      let locationName = "";

      // address_components에서 장소명 찾기
      const addressComponents = nearbyPlace.address_components || [];
      for (const component of addressComponents) {
        if (
          component.types.includes("point_of_interest") ||
          component.types.includes("establishment") ||
          component.types.includes("tourist_attraction") ||
          component.types.includes("lodging")
        ) {
          locationName = component.long_name;
          break;
        }
      }

      // 장소명을 찾지 못한 경우, formatted_address의 첫 부분 사용
      if (!locationName && nearbyPlace.formatted_address) {
        locationName = nearbyPlace.formatted_address.split(",")[0].trim();
      }

      return {
        locationName: locationName || "위치",
        address: nearbyPlace.formatted_address || "",
        placeId: nearbyPlace.place_id,
      };
    }

    // 2. Places API로 찾지 못한 경우, Geocoding API 사용
    const geocodeResult = await reverseGeocodeWithGeocodingAPI(
      latitude,
      longitude
    );

    if (geocodeResult) {
      return geocodeResult;
    }

    // 3. 둘 다 실패한 경우
    console.warn("역지오코딩 실패:", { latitude, longitude });
    return {
      locationName: "위치",
      address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
    };
  } catch (error) {
    console.error("역지오코딩 중 오류 발생:", error);
    return null;
  }
};

/**
 * LocationInfo 타입에 locationName과 address 추가
 *
 * @param location 좌표 정보
 * @returns locationName과 address가 포함된 LocationInfo
 */
export const enrichLocationWithPlaceInfo = async (location: {
  latitude: number;
  longitude: number;
}): Promise<{
  latitude: number;
  longitude: number;
  locationName?: string;
  address?: string;
  placeId?: string;
}> => {
  const reverseGeocodeResult = await reverseGeocode(
    location.latitude,
    location.longitude
  );

  if (reverseGeocodeResult) {
    return {
      latitude: location.latitude,
      longitude: location.longitude,
      locationName: reverseGeocodeResult.locationName,
      address: reverseGeocodeResult.address,
      placeId: reverseGeocodeResult.placeId,
    };
  }

  return {
    latitude: location.latitude,
    longitude: location.longitude,
  };
};
