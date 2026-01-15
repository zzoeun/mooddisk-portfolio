// packages/api/src/diskbookApi.ts
import instance from "./instance";

// 타입 정의
interface OrderData {
  productIdx: number;
  quantity: number;
  address: string;
  // 기타 주문 관련 필드들
}

// Safari 감지 유틸리티
const isSafari = (): boolean => {
  if (typeof navigator === "undefined") return false;
  return (
    /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)
  );
};

// 모든 활성화된 디스크북 상품 조회 API
export const getAllDiskbooks = async (): Promise<any> => {
  console.log("🔍 getAllDiskbooks 호출 시작");
  console.log("🔍 instance baseURL:", instance.defaults.baseURL);
  console.log("�� 요청 URL:", "/api/diskbook/products");

  const safari = isSafari();

  try {
    if (safari) {
      console.log("�� Safari 감지 - 최적화된 API 호출 적용");
      // Safari에서 더 안전한 헤더 사용
      const response = await instance.get("/diskbook/products", {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
          "X-Requested-With": "XMLHttpRequest",
        },
        timeout: 20000, // Safari에서 더 긴 타임아웃
      });
      console.log("🔍 Safari 최적화 API 응답 성공:", response);
      console.log("🔍 응답 상태:", response.status);
      console.log("🔍 응답 헤더:", response.headers);
      console.log("�� 응답 데이터 타입:", typeof response.data);
      console.log("🔍 응답 데이터:", response.data);
      return response.data;
    } else {
      // 일반 API 호출
      const response = await instance.get("/diskbook/products");
      console.log("🔍 API 응답 성공:", response);
      console.log("🔍 응답 상태:", response.status);
      console.log("🔍 응답 헤더:", response.headers);
      console.log("�� 응답 데이터 타입:", typeof response.data);
      console.log("�� 응답 데이터:", response.data);
      return response.data;
    }
  } catch (error: any) {
    console.error("�� API 호출 실패:", error);

    // Safari 전용 에러 처리
    if (safari) {
      console.log("�� Safari에서 API 호출 실패 - 상세 에러 정보:");
      console.error("�� 에러 타입:", error.constructor.name);
      console.error("🍎 에러 메시지:", error.message);
      console.error("🍎 에러 스택:", error.stack);
      if (error.message?.includes("timeout")) {
        console.log("🍎 Safari 타임아웃 감지 - 재시도 권장");
      }
    }
    throw error;
  }
};

// 특정 디스크북 상품 조회 API
export const getDiskbookById = async (productIdx: number): Promise<any> => {
  const response = await instance.get(`/diskbook/products/${productIdx}`);
  return response.data;
};

// 디스크북 주문 생성 API
export const createDiskbookOrder = async (
  orderData: OrderData
): Promise<any> => {
  const response = await instance.post("/diskbook/orders", orderData);
  return response.data;
};

// 사용자별 디스크북 주문 목록 조회 API
export const getUserDiskbookOrders = async (): Promise<any> => {
  const response = await instance.get("/diskbook/orders");
  return response.data;
};

// 특정 디스크북 주문 조회 API
export const getDiskbookOrderById = async (orderIdx: number): Promise<any> => {
  const response = await instance.get(`/diskbook/orders/${orderIdx}`);
  return response.data;
};
