import React from 'react';
import DesignTokens from '../../../constants/designTokens';

interface SettingsInfoProps {}

export const SettingsInfo: React.FC<SettingsInfoProps> = () => {
  const appVersion = '1.0.0'; // 프론트엔드 버전
  
  const clickableItems = [
    {
      title: '개인정보 처리방침',
      onPress: () => window.open('https://www.notion.so/Privacy-Policy-2837035cda4f8048b9cccbb5fbd46f58?source=copy_link', '_blank')
    },
    {
      title: '서비스 이용약관',
      onPress: () => window.open('https://www.notion.so/2837035cda4f80afa969fe04828c58e3?source=copy_link', '_blank')
    },
    {
      title: '오픈소스 라이브러리',
      onPress: () => window.open('https://www.notion.so/2957035cda4f80998b78cb5bf5e38fa3?source=copy_link', '_blank')
    },
    {
      title: '의견 보내기',
      onPress: () => {
        const subject = encodeURIComponent('feedback.log');
        const body = encodeURIComponent('안녕하세요. mood.disk 개발자입니다.\n\n앱을 사용하며 느낀 생각이나 감정을 들려주세요.\n여러분의 이야기가 업데이트의 영감이 됩니다. 💾\n─────────────────────');
        window.location.href = `mailto:mooddisk.app@gmail.com?subject=${subject}&body=${body}`;
      }
    }
  ];
  
  const versionItem = {
    title: '버전 정보',
    version: appVersion
  };

  return (
    <div 
      className="mx-4 p-4"
      style={{
        backgroundColor: DesignTokens.colors.background,
        border: `${DesignTokens.borders.width} solid ${DesignTokens.colors.border}`,
      }}
    >
      <div 
        className="px-3 py-1.5 mb-4 inline-block font-bold uppercase"
        style={{
          backgroundColor: DesignTokens.colors.sectionBackground,
          color: DesignTokens.colors.secondary,
          fontSize: '18px',
        }}
      >
        앱 정보
      </div>
      
      <div style={{ backgroundColor: DesignTokens.colors.background }}>
        {clickableItems.map((item, index) => (
          <button
            key={index}
            onClick={item.onPress}
            className="w-full flex items-center justify-between px-4 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
            style={{
              borderBottom: `2px solid ${DesignTokens.colors.text}`,
            }}
          >
            <span className="text-base font-bold uppercase" style={{ color: DesignTokens.colors.text }}>
              {item.title}
            </span>
            <span className="text-lg font-bold" style={{ color: DesignTokens.colors.primary }}>
              ›
            </span>
          </button>
        ))}
        
        {/* 버전 정보는 별도로 렌더링 */}
        <div
          className="flex items-center justify-between px-4 py-4"
          style={{
            borderBottom: `2px solid ${DesignTokens.colors.text}`,
          }}
        >
          <span className="text-base font-bold uppercase" style={{ color: DesignTokens.colors.text }}>
            {versionItem.title}
          </span>
          <span className="text-sm font-bold" style={{ color: DesignTokens.colors.primary }}>
            {versionItem.version}
          </span>
        </div>
      </div>
    </div>
  );
};


