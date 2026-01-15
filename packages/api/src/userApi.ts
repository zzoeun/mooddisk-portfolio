// packages/api/src/userApi.ts
import instance from "./instance";

// 타입 정의
interface UserInfoData {
  nickname: string;
  phone?: string;
  bio?: string;
  profileImage?: File | string | null;
}

interface AddressData {
  name: string;
  phone: string;
  address: string;
  detailAddress: string;
  postalCode: string;
  isDefault?: boolean;
}

interface ProfileImageData {
  uri: string;
  type: string;
  name: string;
}

// 사용자 정보 조회
export const getUserInfo = async (userIdx: number): Promise<any> => {
  try {
    const response = await instance.get(`/user/${userIdx}`);
    return response.data;
  } catch (error) {
    console.error("사용자 정보 조회 에러:", error);
    throw error;
  }
};

// 메인페이지용 사용자 정보 조회
export const getMainUserInfo = async (userIdx: number): Promise<any> => {
  try {
    const response = await instance.get(`/main/user/${userIdx}`);
    return response.data;
  } catch (error) {
    console.error("메인 사용자 정보 조회 에러:", error);
    throw error;
  }
};

// 사용자 정보 수정
export const updateUserInfo = async (
  userIdx: number,
  userData: UserInfoData
): Promise<any> => {
  try {
    const formData = new FormData();

    // UserInfoRequest 객체 구성 (배송지 정보 제외)
    const userInfoData = {
      nickname: userData.nickname,
      phone: userData.phone || "",
      bio: userData.bio || "",
    };

    // UserInfoRequest의 각 필드를 FormData에 추가
    Object.keys(userInfoData).forEach((key) => {
      const value = userInfoData[key as keyof typeof userInfoData];
      if (value !== null && value !== undefined) {
        formData.append(key, value);
      }
    });

    // 프로필 이미지 처리 (File, string, null)
    if (userData.profileImage !== undefined) {
      if (userData.profileImage instanceof File) {
        // 웹 환경: 파일인 경우 FormData에 추가
        formData.append("profileImage", userData.profileImage);
      } else if (typeof userData.profileImage === "string") {
        // React Native 환경: 로컬 URI를 FormData에 추가
        if (
          userData.profileImage.startsWith("file://") ||
          userData.profileImage.startsWith("content://")
        ) {
          // 로컬 파일 URI인 경우
          const profileImageData: ProfileImageData = {
            uri: userData.profileImage,
            type: "image/jpeg",
            name: "profile.jpg",
          };
          formData.append("profileImage", profileImageData as any);
        } else {
          // URL인 경우 별도 필드로 전송
          formData.append("profileImageUrl", userData.profileImage);
        }
      } else if (userData.profileImage === null) {
        // null인 경우 삭제 요청으로 전송
        formData.append("profileImageDelete", "true");
      }
    }

    console.log("FormData 생성 완료");
    const response = await instance.put(`/user/${userIdx}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("사용자 정보 수정 에러:", error);
    throw error;
  }
};

// 알림 읽음 처리
export const readNotice = async (type: string, wcIdx: number): Promise<any> => {
  try {
    const response = await instance.patch(`/notice-${type}/${wcIdx}`);
    return response.data;
  } catch (error) {
    console.error("알림 읽음 처리 에러:", error);
    throw error;
  }
};

// 알림 전체 읽음 처리
export const readAllNotices = async (type: string): Promise<any> => {
  try {
    const response = await instance.patch(`/notice-${type}`);
    return response.data;
  } catch (error) {
    console.error("알림 전체 읽음 처리 에러:", error);
    throw error;
  }
};

// 회원탈퇴
export const deleteUser = async (userIdx: number): Promise<any> => {
  try {
    const response = await instance.delete(`/user/${userIdx}`);
    return response.data;
  } catch (error) {
    console.error("회원탈퇴 에러:", error);
    throw error;
  }
};

// ========== 배송지 관련 API ==========

// 사용자의 모든 배송지 조회
export const getUserAddresses = async (userIdx: number): Promise<any> => {
  try {
    const response = await instance.get(`/user/${userIdx}/addresses`);
    return response.data;
  } catch (error) {
    console.error("배송지 조회 에러:", error);
    throw error;
  }
};

// 사용자의 기본 배송지 조회
export const getDefaultAddress = async (userIdx: number): Promise<any> => {
  try {
    const response = await instance.get(`/user/${userIdx}/addresses/default`);
    return response.data;
  } catch (error) {
    console.error("기본 배송지 조회 에러:", error);
    throw error;
  }
};

// 배송지 추가
export const addAddress = async (
  userIdx: number,
  addressData: AddressData
): Promise<any> => {
  try {
    const response = await instance.post(
      `/user/${userIdx}/addresses`,
      addressData
    );
    return response.data;
  } catch (error) {
    console.error("배송지 추가 에러:", error);
    throw error;
  }
};

// 배송지 수정
export const updateAddress = async (
  userIdx: number,
  addressIdx: number,
  addressData: AddressData
): Promise<any> => {
  try {
    const response = await instance.put(
      `/user/${userIdx}/addresses/${addressIdx}`,
      addressData
    );
    return response.data;
  } catch (error) {
    console.error("배송지 수정 에러:", error);
    throw error;
  }
};

// 배송지 삭제
export const deleteAddress = async (
  userIdx: number,
  addressIdx: number
): Promise<any> => {
  try {
    const response = await instance.delete(
      `/user/${userIdx}/addresses/${addressIdx}`
    );
    return response.data;
  } catch (error) {
    console.error("배송지 삭제 에러:", error);
    throw error;
  }
};

// 사용자 통계 정보 조회
export const getUserStats = async (userIdx: number): Promise<any> => {
  try {
    const response = await instance.get(`/user/${userIdx}/stats`);
    return response.data;
  } catch (error) {
    console.error("사용자 통계 조회 에러:", error);
    throw error;
  }
};

// 최근 활동 조회
export const getRecentActivities = async (userIdx: number): Promise<any> => {
  try {
    const response = await instance.get(`/user/${userIdx}/activities`);
    return response.data;
  } catch (error) {
    console.error("최근 활동 조회 실패:", error);
    throw error;
  }
};
