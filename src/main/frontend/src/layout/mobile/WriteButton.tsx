

import React from 'react';
import DesignTokens from '../../constants/designTokens';

interface WriteButtonProps {
  onSubmit?: () => void;
  isWritingMode: boolean;
}

const WriteButton: React.FC<WriteButtonProps> = ({ onSubmit, isWritingMode }) => {
  if (!isWritingMode || !onSubmit) return null;
  
  return (
    <button 
      onClick={onSubmit}
      style={{
        padding: '8px 12px',
        backgroundColor: DesignTokens.colors.accent,
        border: `2px solid ${DesignTokens.colors.border}`,
        borderRadius: '0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'opacity 0.2s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = '0.8';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = '1';
      }}
    >
      <span
        style={{
          color: DesignTokens.colors.text,
          fontSize: '14px',
          fontWeight: 'bold',
          fontFamily: DesignTokens.fonts.default,
          textTransform: 'uppercase'
        }}
      >
        작성
      </span>
    </button>
  );
};

export default WriteButton;
