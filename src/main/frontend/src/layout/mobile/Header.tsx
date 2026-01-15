import React from 'react';
import { useScrollDirection } from '../../hooks/common/useScrollDirection';
import { AppLogo } from '../../components/common/brand';
import DesignTokens from '../../constants/designTokens';
import WriteButton from './WriteButton';

interface HeaderProps {
  title: string;
  activeSection?: string;
  isWritingMode?: boolean;
  isDetailMode?: boolean;
  onBack?: () => void;
  showBackButton?: boolean;
  onSubmit?: () => void;
}

const MobileHeader: React.FC<HeaderProps> = ({ 
  title, 
  activeSection = 'diary',
  isWritingMode = false,
  isDetailMode = false,
  onBack,
  showBackButton = false,
  onSubmit
}) => {
  const scrollDirection = useScrollDirection();

  // HeaderMenu 컴포넌트 - 피그마 디자인에 맞춰 3색 아이콘
  const HeaderMenu = () => {
    // 작성 모드일 때는 표시하지 않음
    if (isWritingMode) return null;
    
    return (
      <div className="flex items-center space-x-1">
        {/* 청록색 아이콘 */}
        <div className="w-2 h-2 bg-[#66ffcc] border border-[#663366]"></div>
        {/* 보라색 아이콘 */}
        <div className="w-2 h-2 bg-[#9a66cc] border border-[#663366]"></div>
        {/* 빨간색 아이콘 */}
        <div className="w-2 h-2 bg-[#f87171] border border-[#663366]"></div>
      </div>
    );
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out ${
        scrollDirection === 'down' ? '-translate-y-full' : 'translate-y-0'
      }`}
      style={{ 
        height: '52px', 
        minHeight: '52px',
        background: '#ffffff',
        borderBottom: 'none'
      }}
    >
      {/* 메인 컨텐츠 */}
      <div className="flex items-center justify-between px-5 h-full">
        {/* 왼쪽 영역 - 로고와 텍스트 */}
        <div className="flex items-center space-x-3">
          {showBackButton ? (
            <button 
              onClick={onBack} 
              className="w-7 h-7 bg-[#642e8c] rounded flex items-center justify-center hover:bg-[#5a2a7a] transition-colors"
              style={{ borderRadius: '4.67px' }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M8 2L4 6L8 10" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          ) : (
            <AppLogo 
              size="sm" 
              onClick={() => console.log('AppLogo clicked')}
            />
          )}
          
          <h1 
            style={{ 
              fontSize: '18px',
              lineHeight: '21.78px',
              fontFamily: DesignTokens.fonts.default,
              fontWeight: 700,
              color: DesignTokens.colors.secondary
            }}
          >
            {title}
          </h1>
        </div>
        
        {/* 오른쪽 영역 - 작성 버튼 또는 헤더 메뉴 */}
        <div className="flex items-center space-x-2">
          <WriteButton onSubmit={onSubmit} isWritingMode={isWritingMode} />
          <HeaderMenu />
        </div>
      </div>
    </header>
  );
};

export default MobileHeader; 