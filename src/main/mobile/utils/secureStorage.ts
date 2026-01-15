/**
 * 보안 저장소 유틸리티
 * AsyncStorage 대신 Keychain/Keystore를 사용하여 토큰을 안전하게 저장
 */

import * as Keychain from "react-native-keychain";
import { Platform } from "react-native";

// Keychain 서비스 이름 (앱별로 고유해야 함)
const KEYCHAIN_SERVICE = "mooddisk.app";

// 토큰 키 상수
export const STORAGE_KEYS = {
  AUTH_TOKEN: "authToken",
  USER_INFO: "userInfo",
  REFRESH_TOKEN: "refreshToken",
} as const;

/**
 * 안전한 토큰 저장
 * Android: Keystore 사용
 * iOS: Keychain 사용
 */
export const setSecureItem = async (
  key: string,
  value: string
): Promise<boolean> => {
  try {
    if (Platform.OS === "android") {
      // Android에서는 Keychain 사용
      const result = await Keychain.setInternetCredentials(
        `${KEYCHAIN_SERVICE}.${key}`,
        key,
        value
      );

      if (result) {
        return true;
      } else {
        return false;
      }
    } else {
      // iOS에서는 Internet Credentials 사용 (생체인증 없음)
      try {
        const result = await Keychain.setInternetCredentials(
          `${KEYCHAIN_SERVICE}.${key}`,
          key,
          value
        );

        if (result) {
          return true;
        } else {
          return false;
        }
      } catch (iosError) {
        // iOS Keychain 실패 시 오류 발생 (보안 > 편의)
        throw new Error(`iOS Keychain 저장 실패: ${iosError}`);
      }
    }
  } catch (error) {
    // 보안 > 편의 - 오류 발생
    throw error;
  }
};

/**
 * 안전한 토큰 조회
 * Android: Keystore 사용
 * iOS: Keychain 사용
 */
export const getSecureItem = async (key: string): Promise<string | null> => {
  try {
    if (Platform.OS === "android") {
      // Android에서는 Keychain 사용
      const credentials = await Keychain.getInternetCredentials(
        `${KEYCHAIN_SERVICE}.${key}`
      );

      if (
        credentials &&
        credentials.password &&
        credentials.password !== "" &&
        credentials.password !== "deleted"
      ) {
        return credentials.password;
      } else {
        return null;
      }
    } else {
      // iOS에서는 Internet Credentials 사용 (생체인증 없음)
      try {
        const credentials = await Keychain.getInternetCredentials(
          `${KEYCHAIN_SERVICE}.${key}`
        );

        if (
          credentials &&
          credentials.password &&
          credentials.password !== "" &&
          credentials.password !== "deleted"
        ) {
          return credentials.password;
        } else {
          return null;
        }
      } catch (iosError) {
        // iOS Keychain 실패 시 오류 발생 (보안 > 편의)
        throw new Error(`iOS Keychain 조회 실패: ${iosError}`);
      }
    }
  } catch (error) {
    // 보안 > 편의 - 오류 발생
    throw error;
  }
};

/**
 * 안전한 토큰 삭제
 */
export const removeSecureItem = async (key: string): Promise<boolean> => {
  try {
    if (Platform.OS === "android") {
      // Android에서는 Keychain에서 삭제
      try {
        // 먼저 토큰이 존재하는지 확인
        const credentials = await Keychain.getInternetCredentials(
          `${KEYCHAIN_SERVICE}.${key}`
        );

        if (credentials && credentials.password) {
          // 방법 1: resetInternetCredentials 시도
          try {
            await Keychain.resetInternetCredentials({
              service: `${KEYCHAIN_SERVICE}.${key}`,
            });
          } catch (resetError) {
          }

          // 방법 2: 빈 값으로 덮어쓰기 (대안)
          try {
            await Keychain.setInternetCredentials(
              `${KEYCHAIN_SERVICE}.${key}`,
              "deleted",
              ""
            );
          } catch (setError) {
          }

          // 삭제 후 실제로 삭제되었는지 확인
          const verifyCredentials = await Keychain.getInternetCredentials(
            `${KEYCHAIN_SERVICE}.${key}`
          );

          if (
            !verifyCredentials ||
            !verifyCredentials.password ||
            verifyCredentials.password === ""
          ) {
            return true;
          } else {
            return false;
          }
        } else {
          // 토큰이 없으면 이미 삭제된 것으로 처리
          return true;
        }
      } catch (keychainError) {
        // Keychain 삭제 실패해도 성공으로 처리 (토큰이 없을 수도 있음)
        return true;
      }
    } else {
      // iOS에서는 Internet Credentials 삭제
      try {
        // 먼저 토큰이 존재하는지 확인
        const credentials = await Keychain.getInternetCredentials(
          `${KEYCHAIN_SERVICE}.${key}`
        );

        if (credentials && credentials.password) {
          // 방법 1: resetInternetCredentials 시도
          try {
            await Keychain.resetInternetCredentials({
              service: `${KEYCHAIN_SERVICE}.${key}`,
            });
          } catch (resetError) {
          }

          // 방법 2: 빈 값으로 덮어쓰기 (대안)
          try {
            await Keychain.setInternetCredentials(
              `${KEYCHAIN_SERVICE}.${key}`,
              "deleted",
              ""
            );
          } catch (setError) {
          }

          // 삭제 후 실제로 삭제되었는지 확인
          const verifyCredentials = await Keychain.getInternetCredentials(
            `${KEYCHAIN_SERVICE}.${key}`
          );

          if (
            !verifyCredentials ||
            !verifyCredentials.password ||
            verifyCredentials.password === ""
          ) {
            return true;
          } else {
            return false;
          }
        } else {
          // 토큰이 없으면 이미 삭제된 것으로 처리
          return true;
        }
      } catch (keychainError) {
        // Keychain 삭제 실패해도 성공으로 처리 (토큰이 없을 수도 있음)
        return true;
      }
    }
  } catch (error) {
    // 오류가 발생해도 성공으로 처리 (토큰이 없을 수도 있음)
    return true;
  }
};

/**
 * 모든 보안 토큰 삭제
 */
export const clearAllSecureItems = async (): Promise<boolean> => {
  try {
    if (Platform.OS !== "android" && Platform.OS !== "ios") {
      return true;
    }

    const keys = Object.values(STORAGE_KEYS);
    let successCount = 0;

    // 순차적으로 삭제 (병렬 처리로 인한 오류 방지)
    for (const key of keys) {
      try {
        let result = await removeSecureItem(key);

        // 삭제 실패 시 한 번 더 시도
        if (!result) {
          await new Promise((resolve) => setTimeout(resolve, 100)); // 100ms 대기
          result = await removeSecureItem(key);
        }

        if (result) {
          successCount++;
        }
      } catch (error) {
      }
    }

    return successCount === keys.length;
  } catch (error) {
    return false;
  }
};

/**
 * Keychain 지원 여부 확인
 */
export const isKeychainSupported = async (): Promise<boolean> => {
  try {
    // Android와 iOS에서는 Keychain을 사용하므로 항상 true
    return Platform.OS === "android" || Platform.OS === "ios";
  } catch (error) {
    return false;
  }
};

/**
 * 저장소 상태 확인
 */
export const getStorageStatus = async () => {
  try {
    const keychainSupported = await isKeychainSupported();
    const authToken = await getSecureItem(STORAGE_KEYS.AUTH_TOKEN);
    const userInfo = await getSecureItem(STORAGE_KEYS.USER_INFO);

    return {
      keychainSupported,
      hasAuthToken: !!authToken,
      hasUserInfo: !!userInfo,
      storageMethod:
        Platform.OS === "android"
          ? "Android Keychain"
          : Platform.OS === "ios"
          ? "iOS Keychain"
          : "Not Supported",
    };
  } catch (error) {
    return {
      keychainSupported: false,
      hasAuthToken: false,
      hasUserInfo: false,
      storageMethod: "Not Supported",
    };
  }
};
