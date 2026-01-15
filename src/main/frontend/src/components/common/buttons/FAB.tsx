import React from 'react';
import { LucideIcon } from 'lucide-react';
import DesignTokens from '../../../constants/designTokens';

interface FABProps {
  onClick: () => void;
  icon: LucideIcon;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'accent' | 'custom';
  customStyle?: React.CSSProperties;
  className?: string;
}

export const FAB: React.FC<FABProps> = ({
  onClick,
  icon: Icon,
  position = 'bottom-right',
  size = 'md',
  color = 'primary',
  customStyle,
  className = ''
}) => {
  const sizeStyles = {
    sm: { width: '40px', height: '40px' },
    md: { width: '56px', height: '56px' },
    lg: { width: '72px', height: '72px' }
  };

  const iconSizes = {
    sm: 20,
    md: 28,
    lg: 36
  };

  const positionStyles = {
    'bottom-right': { bottom: '30px', right: '30px' },
    'bottom-left': { bottom: '30px', left: '30px' },
    'top-right': { top: '30px', right: '30px' },
    'top-left': { top: '30px', left: '30px' }
  };

  const colorStyles = {
    primary: {
      backgroundColor: DesignTokens.colors.alert,
      border: `3px solid ${DesignTokens.colors.text}`
    },
    secondary: {
      backgroundColor: DesignTokens.colors.accent,
      border: `3px solid ${DesignTokens.colors.text}`
    },
    accent: {
      backgroundColor: DesignTokens.colors.accent,
      border: `3px solid ${DesignTokens.colors.text}`
    },
    custom: {}
  };

  return (
    <button
      onClick={onClick}
      className={`fixed transition-transform hover:scale-105 ${className}`}
      style={{
        ...positionStyles[position],
        ...sizeStyles[size],
        ...colorStyles[color],
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 50,
        ...customStyle
      }}
    >
      <Icon size={iconSizes[size]} color={DesignTokens.colors.text} />
    </button>
  );
};


