import React from 'react';
import { X } from 'lucide-react';

interface BottomSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  maxHeight?: string;
  responsive?: boolean; // 웹에서는 중앙 모달로, 모바일에서는 하단 시트로
}

export const BottomSheetModal: React.FC<BottomSheetModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className = '',
  showCloseButton = true,
  closeOnOverlayClick = true,
  maxHeight = '70vh',
  responsive = true
}) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  // 웹에서는 중앙 정렬, 모바일에서는 하단 정렬
  const isMobile = window.innerWidth <= 768;
  const shouldUseBottomSheet = !responsive || isMobile;

  return (
    <div 
      className={`fixed inset-0 bg-black bg-opacity-50 z-[9999] ${className} ${
        shouldUseBottomSheet 
          ? 'flex items-end justify-center' 
          : 'flex items-center justify-center'
      }`}
      onClick={handleOverlayClick}
    >
      <div 
        className={`bg-white w-full overflow-hidden shadow-xl ${
          shouldUseBottomSheet 
            ? 'rounded-t-xl mb-14' // 모바일에서 하단 여백 추가 (탭바 높이만큼)
            : 'rounded-lg max-w-md mx-4'
        }`}
        style={{ maxHeight }}
      >
        {/* 모달 헤더 */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            {title && (
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            )}
            {showCloseButton && (
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            )}
          </div>
        )}

        {/* 모달 내용 */}
        <div 
          className="p-4 overflow-y-auto" 
          style={{ maxHeight: `calc(${maxHeight} - 80px)` }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};


