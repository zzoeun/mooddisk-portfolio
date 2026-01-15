import React, { useState, useEffect } from 'react';
import { ImageModal } from './ImageModal';
import DesignTokens from '../../../constants/designTokens';

export interface TimelineItem {
  id: string;
  content: string;
  imageUrls?: string[];
  createdAt: string;
  type?: string; // 타입 추가
  author?: {
    name: string;
    avatar?: string;
    emotion?: string;
  };
  actions?: {
    onEdit?: (item: TimelineItem) => void;
    onDelete?: (itemId: string) => void;
  };
}

interface GenericTimelineProps {
  items: TimelineItem[];
  renderAvatar?: (item: TimelineItem) => React.ReactNode;
  renderActions?: (item: TimelineItem) => React.ReactNode;
  formatTime?: (dateString: string) => string;
  className?: string;
}

export const GenericTimeline: React.FC<GenericTimelineProps> = ({ 
  items, 
  renderAvatar, 
  renderActions, 
  formatTime,
  className = ""
}) => {
  const [imageModal, setImageModal] = useState<{
    isOpen: boolean;
    images: string[];
    initialIndex: number;
  }>({
    isOpen: false,
    images: [],
    initialIndex: 0
  });

  const handleImageClick = (images: string[], initialIndex: number) => {
    setImageModal({
      isOpen: true,
      images,
      initialIndex
    });
  };

  const closeImageModal = () => {
    setImageModal({
      isOpen: false,
      images: [],
      initialIndex: 0
    });
  };

  const defaultFormatTime = (dateString: string) => {
    try {
      if (dateString && dateString.includes('T')) {
        const date = new Date(dateString);
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const seconds = date.getSeconds();
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      } else {
        const cleanDate = dateString.replace(/\./g, '').replace(/\s/g, '');
        const year = cleanDate.substring(0, 4);
        const month = cleanDate.substring(4, 6);
        const day = cleanDate.substring(6, 8);
        
        const date = new Date(`${year}-${month}-${day}`);
        const hours = Math.floor(Math.random() * 24);
        const minutes = Math.floor(Math.random() * 60);
        const seconds = Math.floor(Math.random() * 60);
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
    } catch (error) {
      console.error('시간 포맷팅 오류:', error);
      return '08:18:00';
    }
  };

  return (
    <div className={`space-y-0 pb-20 ${className}`}>
      {items.map((item, index) => {
        return (
          <div key={item.id} className="relative">
            {/* 타임라인 연결선 */}
            {index < items.length - 1 && (
              <div 
                className="absolute" 
                style={{ 
                  left: '32px', // 패딩 16px + 아바타 중앙 16px = 32px (정중앙)
                  top: index === 0 ? '16px' : '50px', // 첫 번째 아이템은 아바타 중앙(16px)에서 시작
                  height: '100%',
                  width: '0.5px',
                  borderLeft: `0.5px dashed ${DesignTokens.colors.secondary}`,
                  opacity: 0.5,
                  backgroundColor: 'transparent'
                }}
              ></div>
            )}
            
            {/* 타임라인 항목 */}
            <div className={`relative flex items-start pr-8 ${index === 0 ? 'px-4 pb-4' : 'p-4'}`}>
              {/* 아바타 */}
              <div 
                className="flex-shrink-0"
                style={{
                  marginRight: '16px',
                  zIndex: 10
                }}
              >
                {renderAvatar ? renderAvatar(item) : (
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-xs text-gray-600">
                      {item.author?.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                )}
              </div>
              
              {/* 내용 */}
              <div className="flex-1 min-w-0">
                {/* 시간과 닉네임 표시 */}
                <div className="flex items-center gap-2" style={{ fontSize: '14px', color: DesignTokens.colors.gray, marginBottom: '8px' }}>
                  {item.author?.name && item.author.name.trim() !== '' && item.author.name !== '나' && (
                    <span style={{ fontWeight: '500', color: DesignTokens.colors.darkGray }}>{item.author.name}</span>
                  )}
                  {item.author?.name && item.author.name.trim() !== '' && item.author.name !== '나' && (
                    <span style={{ color: DesignTokens.colors.mediumGray, marginLeft: '8px', marginRight: '8px' }}>•</span>
                  )}
                  <span style={{ fontWeight: 'bold', fontFamily: DesignTokens.fonts.default }}>{(formatTime || defaultFormatTime)(item.createdAt)}</span>
                </div>
                
                {/* 액션 버튼 */}
                {renderActions && renderActions(item)}
                
                {/* 텍스트 내용 */}
                <p 
                  className="whitespace-pre-wrap" 
                  style={{ 
                    fontSize: '16px',
                    color: DesignTokens.colors.text,
                    lineHeight: '24px',
                    marginBottom: '12px',
                    fontFamily: DesignTokens.fonts.default
                  }}
                >
                  {item.content}
                </p>
                
                {/* 이미지 스와이프 섹션 */}
                {item.imageUrls && item.imageUrls.length > 0 && (
                  <div className="relative" style={{ marginTop: '8px' }}>
                    <div 
                      className="flex overflow-x-auto hide-scrollbar"
                      style={{
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none'
                      }}
                    >
                      {item.imageUrls.map((imageUrl: string, imgIndex: number) => (
                        <div key={imgIndex} className="flex-shrink-0 relative" style={{ marginRight: '8px' }}>
                          <img
                            src={imageUrl}
                            alt={`이미지 ${imgIndex + 1}`}
                            className="object-cover cursor-pointer hover:opacity-80 transition-opacity"
                            style={{ 
                              width: '110px',
                              height: '110px',
                              border: `2px solid ${DesignTokens.colors.text}`,
                              backgroundColor: DesignTokens.colors.background
                            }}
                            onClick={() => handleImageClick(item.imageUrls || [], imgIndex)}
                            onError={(e) => {
                              console.error(`이미지 로드 실패 (${imgIndex + 1}):`, imageUrl);
                              (e.target as HTMLImageElement).style.display = 'none';
                              const nextSibling = (e.target as HTMLImageElement).nextSibling as HTMLElement;
                              if (nextSibling) {
                                nextSibling.style.display = 'block';
                              }
                            }}
                          />
                          <div 
                            className="flex items-center justify-center text-xs" 
                            style={{ 
                              display: 'none',
                              width: '110px',
                              height: '110px',
                              backgroundColor: DesignTokens.colors.lightGray,
                              border: `2px solid ${DesignTokens.colors.text}`,
                              color: DesignTokens.colors.gray
                            }}
                          >
                            이미지 로드 실패
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* 구분선 */}
            {index < items.length - 1 && (
              <div 
                style={{ 
                  height: '1px',
                  backgroundColor: DesignTokens.colors.secondary,
                  opacity: 0.1,
                  marginLeft: '64px',
                  marginRight: '16px'
                }}
              ></div>
            )}
          </div>
        );
      })}
      
      {/* 이미지 모달 */}
      <ImageModal
        images={imageModal.images}
        initialIndex={imageModal.initialIndex}
        isOpen={imageModal.isOpen}
        onClose={closeImageModal}
      />
    </div>
  );
};
