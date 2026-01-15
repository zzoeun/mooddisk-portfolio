import React from 'react';
import { TimelineItem } from './GenericTimeline';

interface TimelineAvatarProps {
  item: TimelineItem;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const TimelineAvatar: React.FC<TimelineAvatarProps> = ({
  item,
  size = 'md',
  className = ""
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  // 아바타 이미지가 있는 경우
  if (item.author?.avatar) {
    return (
      <img
        src={item.author.avatar}
        alt={item.author.name || 'User'}
        className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
        onError={(e) => {
          // 이미지 로드 실패 시 기본 아바타로 fallback
          (e.target as HTMLImageElement).style.display = 'none';
          const fallback = (e.target as HTMLImageElement).nextSibling as HTMLElement;
          if (fallback) {
            fallback.style.display = 'flex';
          }
        }}
      />
    );
  }

  // 기본 아바타 (이름 첫 글자)
  return (
    <div className={`${sizeClasses[size]} bg-gray-300 rounded-full flex items-center justify-center ${className}`}>
      <span className={`${textSizes[size]} text-gray-600 font-medium`}>
        {item.author?.name?.charAt(0) || 'U'}
      </span>
    </div>
  );
};
