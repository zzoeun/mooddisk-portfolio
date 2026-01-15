// 에러 처리 유틸리티
export const getErrorMessage = (error: any): string => {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.message) {
    return error.message;
  }
  return "알 수 없는 오류가 발생했습니다.";
};
