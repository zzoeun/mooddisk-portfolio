import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, Dimensions, Platform, StyleSheet } from 'react-native';
// import { useDiaryYear } from '../../../hooks/useQueries'; // DiskScreen에서 통합 관리
import { DiaryEntry } from '@mooddisk/types';
import { getEmotionDisplayName } from '@mooddisk/utils';
import DesignTokens from '../../../constants/designTokens';
import { isTablet } from '../../../utils/deviceUtils';

interface EmotionBitmapProps {
  style?: any;
  yearDiaries?: DiaryEntry[]; // DiskScreen에서 전달받은 데이터
}

const EmotionBitmap: React.FC<EmotionBitmapProps> = ({ style, yearDiaries = [] }) => {
  const [tooltip, setTooltip] = useState<{ visible: boolean; text: string; x: number; y: number }>({
    visible: false,
    text: '',
    x: 0,
    y: 0
  });

  // 태블릿 감지
  const tablet = isTablet();
  const pixelSize = tablet ? 18 : 12; // 태블릿: 18px, 모바일: 12px
  const pixelMargin = tablet ? 1.5 : 1; // 태블릿: 1.5px, 모바일: 1px

  // props로 받은 데이터 사용 (DiskScreen에서 통합 관리)

  // 감정 비트맵 데이터 메모이제이션
  const emotionBitmap = useMemo(() => {
    const bitmap: Record<string, string> = {};
    
    yearDiaries.forEach((diary: DiaryEntry) => {
      const date = new Date(diary.date);
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      bitmap[dateKey] = diary.emotion;
    });
    
    return bitmap;
  }, [yearDiaries]);

  // 감정 색상 매핑 (PixelEmotion과 동일) - useCallback으로 메모이제이션
  const getEmotionColor = useCallback((emotion: string) => {
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
  }, []);

  // React Query로 데이터가 로드되면 로그 출력
  useEffect(() => {
    if (yearDiaries.length > 0) {
      console.log(`감정비트맵 로드 완료: ${yearDiaries.length}개 일기 데이터`);
    }
  }, [yearDiaries]);

  // 감정 비트맵 렌더링 함수 - useMemo로 메모이제이션
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
      
      const emotionColor = emotion ? getEmotionColor(emotion) : DesignTokens.colors.lightGray;
      
      days.push(
        <TouchableOpacity
          key={dateKey}
          style={{
            width: pixelSize,
            height: pixelSize,
            backgroundColor: hasDiary ? emotionColor : DesignTokens.colors.lightGray,
            borderWidth: 1,
            borderColor: DesignTokens.colors.text,
            margin: pixelMargin,
          }}
          onPressIn={(event) => {
            const date = new Date(dateKey);
            const formattedDate = `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
            
            let tooltipText = formattedDate;
            if (hasDiary) {
              tooltipText += `\n마지막 감정: ${getEmotionDisplayName(emotion)}`;
            } else {
              tooltipText += '\n일기 없음';
            }
            
            const screenWidth = Dimensions.get('window').width;
            const tooltipWidth = 120; // 툴팁 예상 너비
            let tooltipX = event.nativeEvent.pageX - tooltipWidth / 2;
            
            // 화면 왼쪽으로 벗어나는 경우
            if (tooltipX < 10) {
              tooltipX = 10;
            }
            // 화면 오른쪽으로 벗어나는 경우
            else if (tooltipX + tooltipWidth > screenWidth - 10) {
              tooltipX = screenWidth - tooltipWidth - 10;
            }
            
            // 툴팁을 상단에 표시하기 위해 Y 좌표 조정
            const yOffset = Platform.OS === 'ios' ? -210 : -200;
            
            setTooltip({
              visible: true,
              text: tooltipText,
              x: tooltipX,
              y: event.nativeEvent.pageY + yOffset
            });
          }}
          onPressOut={() => {
            setTooltip(prev => ({ ...prev, visible: false }));
          }}
        />
      );
    }
    
    return days;
  }, [emotionBitmap, getEmotionColor]);

  // 감정 범례 메모이제이션
  const emotionLegend = useMemo(() => {
    const legendSize = tablet ? 18 : 14; // 태블릿: 18px, 모바일: 14px
    
    return (
      <View style={{ 
        flexDirection: 'row', 
        flexWrap: 'wrap', 
        justifyContent: 'center',
        marginTop: DesignTokens.spacing.tinyGap 
      }}>
        {[
          { emotion: 'HAPPY', color: DesignTokens.colors.emotionHappy, displayName: '행복' },
          { emotion: 'PROUD', color: DesignTokens.colors.emotionProud, displayName: '뿌듯' },
          { emotion: 'PEACEFUL', color: DesignTokens.colors.emotionPeaceful, displayName: '평온' },
          { emotion: 'DEPRESSED', color: DesignTokens.colors.emotionDepressed, displayName: '우울' },
          { emotion: 'ANNOYED', color: DesignTokens.colors.emotionAnnoyed, displayName: '짜증' },
          { emotion: 'FURIOUS', color: DesignTokens.colors.emotionFurious, displayName: '분노' }
        ].map(({ emotion, color, displayName }) => (
          <View key={emotion} style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            marginRight: DesignTokens.spacing.componentGap,
            marginBottom: DesignTokens.spacing.tinyGap 
          }}>
            <View style={{
              width: legendSize,
              height: legendSize,
              backgroundColor: color,
              borderWidth: 1,
              borderColor: DesignTokens.colors.text,
              marginRight: DesignTokens.spacing.tinyGap
            }} />
            <Text style={styles.emotionLabel}>
              {displayName}
            </Text>
          </View>
        ))}
      </View>
    );
  }, [tablet]);

  // React Query가 자동으로 데이터를 로드하므로 useEffect 제거

  return (
    <View style={style}>
      <View style={styles.bitmapContainer}>
        {renderEmotionBitmap}
      </View>
      
      {/* 툴팁 */}
      {tooltip.visible && (
        <View style={[styles.tooltip, { left: tooltip.x, top: tooltip.y }]}>
          <Text style={styles.tooltipText}>
            {tooltip.text}
          </Text>
        </View>
      )}
      
      {/* 감정 범례 - useMemo로 메모이제이션 */}
      {emotionLegend}
    </View>
  );
};

const styles = StyleSheet.create({
  bitmapContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: DesignTokens.spacing.smallGap,
    backgroundColor: DesignTokens.colors.background,
    marginBottom: DesignTokens.spacing.cardMargin,
  },
  emotionLabel: {
    fontSize: 11,
    color: DesignTokens.colors.text,
    fontFamily: DesignTokens.typography.sectionTitle.fontFamily,
    fontWeight: 'bold',
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: DesignTokens.colors.text,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: DesignTokens.colors.primary,
    zIndex: 1000,
  },
  tooltipText: {
    color: DesignTokens.colors.background,
    fontSize: 12,
    textAlign: 'center',
    fontFamily: DesignTokens.typography.sectionTitle.fontFamily,
  },
});

export default EmotionBitmap;
