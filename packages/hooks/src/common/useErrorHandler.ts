// packages/hooks/src/common/useErrorHandler.ts
import { useState, useCallback } from "react";

// 에러 타입 정의
interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

// 에러 처리 유틸리티
const getErrorMessage = (error: ApiError | unknown): string => {
  // ApiError 타입인지 확인
  if (error && typeof error === "object") {
    const apiError = error as ApiError;
    if (apiError?.response?.data?.message) {
      return apiError.response.data.message;
    }
    if (apiError?.message) {
      return apiError.message;
    }
  }

  // Error 객체인지 확인
  if (error instanceof Error) {
    return error.message;
  }

  // 문자열인지 확인
  if (typeof error === "string") {
    return error;
  }

  return "알 수 없는 오류가 발생했습니다.";
};

// 에러 핸들러 반환 타입
interface UseErrorHandlerReturn {
  errorMessage: string;
  showErrorModal: boolean;
  handleError: (error: ApiError | unknown) => void;
  clearError: () => void;
}

/**
 * 에러 처리와 모달 관리를 통합한 커스텀 훅
 */
export const useErrorHandler = (): UseErrorHandlerReturn => {
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showErrorModal, setShowErrorModal] = useState<boolean>(false);

  const handleError = useCallback((error: ApiError | unknown) => {
    const message = getErrorMessage(error);
    setErrorMessage(message);
    setShowErrorModal(true);
  }, []);

  const clearError = useCallback(() => {
    setErrorMessage("");
    setShowErrorModal(false);
  }, []);

  return {
    errorMessage,
    showErrorModal,
    handleError,
    clearError,
  };
};
