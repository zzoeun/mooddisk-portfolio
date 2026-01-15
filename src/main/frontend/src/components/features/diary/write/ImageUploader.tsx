import React from 'react';
import { Image } from 'lucide-react';
import { FILE_SIZE_LIMITS, validateFileSize, formatFileSize } from '@mooddisk/utils';
import { ActionButton } from '../../../common/buttons';

interface ImageUploaderProps {
  selectedImageFiles?: File[];
  setSelectedImageFiles?: React.Dispatch<React.SetStateAction<File[]>>;
  maxImages?: number;
  className?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  selectedImageFiles = [],
  setSelectedImageFiles,
  maxImages = 3,
  className = ''
}) => {
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    console.log('=== 이미지 업로드 시작 ===');
    console.log('선택된 파일들:', files);
    
    if (files && selectedImageFiles.length < maxImages) {
      const newFiles = Array.from(files).slice(0, maxImages - selectedImageFiles.length);
      
      // 파일 크기 검증
      const oversizedFiles = newFiles.filter(file => !validateFileSize(file, FILE_SIZE_LIMITS.DIARY_IMAGE));
      if (oversizedFiles.length > 0) {
        const fileNames = oversizedFiles.map(file => 
          `${file.name} (${formatFileSize(file.size)})`
        ).join(', ');
        
        alert(`다음 파일은 ${formatFileSize(FILE_SIZE_LIMITS.DIARY_IMAGE)}를 초과하여 첨부할 수 없습니다:\n${fileNames}`);
        return;
      }
      
      // 파일 타입 검증 (SVG 제외)
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      const invalidFiles = newFiles.filter(file => !allowedTypes.includes(file.type));
      if (invalidFiles.length > 0) {
        const fileNames = invalidFiles.map(file => file.name).join(', ');
        alert(`지원하지 않는 파일 형식입니다. JPG, PNG, GIF 파일만 업로드 가능합니다: ${fileNames}`);
        return;
      }
      
      console.log('새로 추가할 파일들:', newFiles);
      setSelectedImageFiles?.([...selectedImageFiles, ...newFiles]);
    }
  };

  const removeImage = (index: number) => {
    console.log('=== 이미지 제거 시작 ===');
    console.log('제거할 이미지 인덱스:', index);
    
    const newFiles = selectedImageFiles.filter((_, i) => i !== index);
    setSelectedImageFiles?.(newFiles);
  };

  const handleUploadClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      if (files.length > 0) {
        const totalImages = selectedImageFiles.length + files.length;
        if (totalImages > maxImages) {
          alert(`이미지는 최대 ${maxImages}개까지 첨부할 수 있습니다.`);
          return;
        }
        
        // 파일 크기 및 타입 검증 (SVG 제외)
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        const validFiles = files.filter(file => {
          if (!validateFileSize(file, FILE_SIZE_LIMITS.DIARY_IMAGE)) {
            alert(`${file.name}은 ${formatFileSize(FILE_SIZE_LIMITS.DIARY_IMAGE)}를 초과하여 첨부할 수 없습니다.`);
            return false;
          }
          if (!allowedTypes.includes(file.type)) {
            alert(`${file.name}은 지원하지 않는 파일 형식입니다. JPG, PNG, GIF 파일만 업로드 가능합니다.`);
            return false;
          }
          return true;
        });
        
        if (validFiles.length > 0) {
          setSelectedImageFiles?.([...selectedImageFiles, ...validFiles]);
        }
      }
    };
    input.click();
  };

  return (
    <div className={`${className}`}>
      {/* 이미지 첨부 버튼 */}
      <ActionButton
        icon={Image}
        text="이미지 첨부"
        onClick={handleUploadClick}
        variant="secondary"
        disabled={selectedImageFiles.length >= maxImages}
        badge={`${selectedImageFiles.length}/${maxImages}`}
      />

      {/* 선택된 이미지 미리보기 */}
      {selectedImageFiles.length > 0 && (
        <div className="mt-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="p-4">
            <h4 className="text-sm font-medium text-gray-800 mb-3">첨부된 이미지</h4>
          </div>
          <div className="px-4 pb-4 space-y-4">
            {selectedImageFiles.map((file, index) => (
              <div key={index} className="relative group">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`첨부 이미지 ${index + 1}`}
                  className="w-full h-auto object-contain rounded-lg border border-gray-200 shadow-sm"
                />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold shadow-md"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};


