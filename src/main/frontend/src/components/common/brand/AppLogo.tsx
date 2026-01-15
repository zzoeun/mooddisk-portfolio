import React from 'react';

interface AppLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 'md',
  className = '',
  onClick
}) => {
  const sizeClasses = {
    xs: 'w-4 h-4',
    sm: 'w-7 h-7',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  return (
    <div
      className={`transition-all duration-200 hover:opacity-80 ${sizeClasses[size]} ${className}`}
      style={{ 
        cursor: onClick ? 'pointer' : 'default'
      }}
      onClick={onClick}
    >
      <svg 
        width="100%" 
        height="100%" 
        viewBox="0 0 13 14" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* 탭바 디스크 아이콘과 동일한 형태 (보라색으로 표시) */}
        <path 
          d="M10 0C11.6569 0 13 1.34315 13 3V10.8096C13 12.4664 11.6569 13.8096 10 13.8096H3C1.34315 13.8096 0 12.4664 0 10.8096V3C5.52114e-07 1.34315 1.34315 8.0532e-09 3 0H4V4H9V0H10Z" 
          fill="#642E8C"
        />
      </svg>
    </div>
  );
};


