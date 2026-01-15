import React, { useState, useMemo, useEffect } from 'react';
import { DiaryEntry } from '@mooddisk/types';
import { getEmotionDisplayName } from '@mooddisk/utils';
import DesignTokens from '../../../constants/designTokens';

interface EmotionBitmapProps {
  yearDiaries?: DiaryEntry[];
}

const EmotionBitmap: React.FC<EmotionBitmapProps> = ({ yearDiaries = [] }) => {
  const [tooltip, setTooltip] = useState<{ visible: boolean; text: string; x: number; y: number }>({
    visible: false,
    text: '',
    x: 0,
    y: 0
  });
  const [isTablet, setIsTablet] = useState(false);

  // 태블릿/모바일 감지 (모바일 앱과 동일한 로직)
  useEffect(() => {
    const checkDevice = () => {
      // 모바일 앱의 isTablet 로직과 유사하게 768px 이상을 태블릿으로 간주
      setIsTablet(window.innerWidth >= 768);
    };
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // 반응형 픽셀 크기 및 마진 (모바일 앱과 동일)
  const pixelSize = isTablet ? 18 : 12; // 태블릿: 18px, 모바일: 12px
  const pixelMargin = isTablet ? 1.5 : 1; // 태블릿: 1.5px, 모바일: 1px
  const legendSize = isTablet ? 18 : 14; // 태블릿: 18px, 모바일: 14px

  // 감정 색상 매핑 (디자인 토큰 사용)
  const getEmotionColor = (emotion: string): string => {
    switch (emotion) {
      case 'HAPPY':
        return DesignTokens.colors.emotionHappy;
      case 'PROUD':
        return DesignTokens.colors.emotionProud;
      case 'PEACEFUL':
        return DesignTokens.colors.emotionPeaceful;
      case 'DEPRESSED':
        return DesignTokens.colors.emotionDepressed;
      case 'ANNOYED':
        return DesignTokens.colors.emotionAnnoyed;
      case 'FURIOUS':
        return DesignTokens.colors.emotionFurious;
      default:
        return DesignTokens.colors.lightGray;
    }
  };

  // 감정 비트맵 데이터
  const emotionBitmap = useMemo(() => {
    const bitmap: Record<string, string> = {};
    
    yearDiaries.forEach((diary: DiaryEntry) => {
      const date = new Date(diary.date);
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      bitmap[dateKey] = diary.emotion;
    });
    
    return bitmap;
  }, [yearDiaries]);

  // 감정 비트맵 렌더링
  const renderEmotionBitmap = useMemo(() => {
    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    
    const days: JSX.Element[] = [];
    
    // 오늘부터 과거 1년치 날짜 생성
    for (let date = new Date(oneYearAgo); date <= today; date.setDate(date.getDate() + 1)) {
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const emotion = emotionBitmap[dateKey];
      const hasDiary = !!emotion;
      
      const emotionColor = emotion ? getEmotionColor(emotion) : '#E0E0E0';
      
      days.push(
        <div
          key={dateKey}
          className="cursor-pointer"
          style={{
            width: `${pixelSize}px`,
            height: `${pixelSize}px`,
            backgroundColor: hasDiary ? emotionColor : DesignTokens.colors.lightGray,
            margin: `${pixelMargin}px`,
            border: `1px solid ${DesignTokens.colors.text}`,
          }}
          onMouseEnter={(e) => {
            const date = new Date(dateKey);
            const formattedDate = `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
            
            let tooltipText = formattedDate;
            if (hasDiary) {
              tooltipText += `\n마지막 감정: ${getEmotionDisplayName(emotion)}`;
            } else {
              tooltipText += '\n일기 없음';
            }
            
            setTooltip({
              visible: true,
              text: tooltipText,
              x: e.clientX,
              y: e.clientY - 60
            });
          }}
          onMouseLeave={() => {
            setTooltip(prev => ({ ...prev, visible: false }));
          }}
        />
      );
    }
    
    return days;
  }, [emotionBitmap, pixelSize, pixelMargin, getEmotionColor]);

  return (
    <div className="relative">
      {/* 비트맵 컨테이너 */}
      <div className="flex flex-wrap justify-center p-4 mb-4">
        {renderEmotionBitmap}
      </div>
      
      {/* 툴팁 */}
      {tooltip.visible && (
        <div 
          className="fixed px-2 py-1 text-xs z-[1000] whitespace-pre-line text-center"
          style={{ 
            left: `${tooltip.x}px`, 
            top: `${tooltip.y}px`,
            transform: 'translateX(-50%)',
            backgroundColor: DesignTokens.colors.text,
            color: DesignTokens.colors.background,
            border: `2px solid ${DesignTokens.colors.primary}`,
          }}
        >
          {tooltip.text}
        </div>
      )}
      
      {/* 감정 범례 */}
      <div className="flex flex-wrap justify-center gap-3 mt-2">
        {[
          { emotion: 'HAPPY', color: DesignTokens.colors.emotionHappy, displayName: '행복' },
          { emotion: 'PROUD', color: DesignTokens.colors.emotionProud, displayName: '뿌듯' },
          { emotion: 'PEACEFUL', color: DesignTokens.colors.emotionPeaceful, displayName: '평온' },
          { emotion: 'DEPRESSED', color: DesignTokens.colors.emotionDepressed, displayName: '우울' },
          { emotion: 'ANNOYED', color: DesignTokens.colors.emotionAnnoyed, displayName: '짜증' },
          { emotion: 'FURIOUS', color: DesignTokens.colors.emotionFurious, displayName: '분노' }
        ].map(({ emotion, color, displayName }) => (
          <div 
            key={emotion} 
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              marginRight: '16px',
              marginBottom: '4px'
            }}
          >
            <div
              style={{
                width: `${legendSize}px`,
                height: `${legendSize}px`,
                backgroundColor: color,
                border: `1px solid ${DesignTokens.colors.text}`,
                marginRight: '4px'
              }}
            />
            <span 
              style={{ 
                color: DesignTokens.colors.text,
                fontSize: '11px',
                fontWeight: 'bold',
                fontFamily: DesignTokens.fonts.default
              }}
            >
              {displayName}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmotionBitmap;

