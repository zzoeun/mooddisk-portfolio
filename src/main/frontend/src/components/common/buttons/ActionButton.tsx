import React from 'react';
import { LucideIcon } from 'lucide-react';

// 일기쓰기에서 챌린지 선택, 이미지 첨부 등에 사용
interface ActionButtonProps {
  icon: LucideIcon;
  text: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  badge?: string | number;
  customStyle?: React.CSSProperties;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  icon: Icon,
  text,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  badge,
  customStyle
}) => {
  const variantClasses = {
    primary: 'text-purple-800 border-transparent',
    secondary: 'text-blue-800 border-transparent',
    success: 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200',
    danger: 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200',
    warning: 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-200'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={customStyle}
      className={`
        flex items-center gap-2 rounded-lg transition-colors border
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      <Icon className={iconSizes[size]} />
      <span className="font-medium">{text}</span>
      {badge && (
        <span className="ml-auto text-xs font-medium">
          ({badge})
        </span>
      )}
    </button>
  );
};



