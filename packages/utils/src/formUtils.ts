// FormData 생성 유틸리티
export const createFormData = (data: Record<string, any>): FormData => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value);
    }
  });
  return formData;
};

// 일기용 FormData 생성 유틸리티
export const createDiaryFormData = (data: {
  content: string;
  images?: File[];
}): {
  formData: FormData;
  queryString: string;
} => {
  const formData = new FormData();
  formData.append("content", data.content);

  if (data.images && data.images.length > 0) {
    data.images.forEach((image, index) => {
      formData.append("images", image);
    });
  }

  const queryString = `content=${encodeURIComponent(data.content)}`;

  return {
    formData,
    queryString,
  };
};

// 모바일용 일기 FormData 생성 유틸리티
export const createMobileDiaryFormData = (data: {
  content: string;
  images?: any[]; // React Native에서는 File 대신 다른 타입 사용
}): {
  formData: FormData;
  queryString: string;
} => {
  const formData = new FormData();
  formData.append("content", data.content);

  if (data.images && data.images.length > 0) {
    data.images.forEach((image, index) => {
      formData.append("images", image);
    });
  }

  const queryString = `content=${encodeURIComponent(data.content)}`;

  return {
    formData,
    queryString,
  };
};
