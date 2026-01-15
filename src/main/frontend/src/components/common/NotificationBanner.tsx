import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

// 모바일 디바이스 감지
const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
};

interface NotificationBannerProps {
  isVisible: boolean;
  message: string;
  onClose: () => void;
  duration?: number; // 자동 닫기 시간 (ms), 0이면 자동 닫기 안함
  type?: 'success' | 'info' | 'warning' | 'error';
  icon?: string; // 커스텀 아이콘
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  isVisible,
  message,
  onClose,
  duration = 3000,
  type = 'success',
  icon
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
    const handleResize = () => {
      setIsMobile(isMobileDevice());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      
      // 자동 닫기 설정
      if (duration > 0) {
        const timer = setTimeout(() => {
          handleClose();
        }, duration);
        
        return () => clearTimeout(timer);
      }
    }
  }, [isVisible, duration]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 300); // 애니메이션 완료 후 닫기
  };

  if (!isVisible && !isAnimating) {
    return null;
  }

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-purple-50',
          border: 'border-purple-200',
          icon: 'text-purple-600',
          text: 'text-purple-800'
        };
      case 'info':
        return {
          bg: 'bg-violet-50',
          border: 'border-violet-200',
          icon: 'text-violet-600',
          text: 'text-violet-800'
        };
      case 'warning':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          icon: 'text-amber-600',
          text: 'text-amber-800'
        };
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          icon: 'text-red-600',
          text: 'text-red-800'
        };
      default:
        return {
          bg: 'bg-purple-50',
          border: 'border-purple-200',
          icon: 'text-purple-600',
          text: 'text-purple-800'
        };
    }
  };

  const styles = getTypeStyles();

  // 모바일에서는 헤더 아래에 배치 (헤더 높이: 52px)
  const topPosition = isMobile ? '52px' : '0';

  return (
    <div
      className={`fixed left-0 right-0 z-[60] transform transition-all duration-300 ease-in-out ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}
      style={{ top: topPosition }}
    >
      <div className={`${styles.bg} ${styles.border} border-b shadow-lg`}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`${styles.icon} flex-shrink-0 text-2xl`}>
                {icon || '💾'}
              </div>
              <p className={`${styles.text} text-base font-semibold`}>
                {message}
              </p>
            </div>
            <button
              onClick={handleClose}
              className={`${styles.text} hover:opacity-70 transition-opacity flex-shrink-0 p-1 rounded-full hover:bg-black hover:bg-opacity-10`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
