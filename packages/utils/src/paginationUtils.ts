// 페이지네이션 유틸리티
export const handlePaginationResponse = <T, R>(
  response: any,
  mapper: (item: T) => R
) => {
  return {
    data: response.content?.map(mapper) || [],
    totalPages: response.totalPages || 0,
    currentPage: response.number || 0,
    totalElements: response.totalElements || 0,
  };
};

export const handleCounselingPaginationResponse = <T, R>(
  response: any,
  mapper: (item: T) => R
) => {
  return {
    content: response.content?.map(mapper) || [],
    hasNext: response.hasNext || false,
    lastId: response.lastId,
  };
};
