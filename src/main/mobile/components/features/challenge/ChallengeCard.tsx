import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, Platform } from 'react-native';
import { ChallengeEntry } from '@mooddisk/types';
import DesignTokens from '../../../constants/designTokens';
import { isTablet } from '../../../utils/deviceUtils';

interface ChallengeCardProps {
  challenge: ChallengeEntry;
  onClick: () => void;
  onJoin: () => void;
  isLastInRow?: boolean;
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({
  challenge,
  onClick,
  onJoin,
  isLastInRow = false
}) => {
  const getProgressPercentage = () => {
    if (!challenge.duration || challenge.duration === 0) return 0;
    const percentage = Math.min((challenge.progress / challenge.duration) * 100, 100);
    return percentage;
  };

  // 태블릿에서 동적 스타일 계산
  const tablet = isTablet();
  
  const cardStyle = React.useMemo(() => {
    const baseStyle = tablet ? [styles.card, styles.cardTablet] : styles.card;
    // 안드로이드에서 마지막 카드의 오른쪽 margin 제거
    if (Platform.OS === 'android' && isLastInRow) {
      return [...(Array.isArray(baseStyle) ? baseStyle : [baseStyle]), styles.cardLastInRow];
    }
    return baseStyle;
  }, [tablet, isLastInRow]);

  const imageContainerStyle = React.useMemo(() => {
    return [
      styles.imageContainer,
      tablet && { height: 180 } // 태블릿에서 이미지 높이 증가
    ];
  }, [tablet]);

  const titleStyle = React.useMemo(() => {
    return [
      styles.title,
      tablet && { fontSize: 18, lineHeight: 24 }
    ];
  }, [tablet]);

  const descriptionStyle = React.useMemo(() => {
    const baseStyle = [styles.description];
    if (tablet) {
      baseStyle.push({ fontSize: 15, lineHeight: 21 } as any);
    }
    return baseStyle;
  }, [tablet]);

  // 안드로이드에서 띄어쓰기 줄바꿈 방지: 문장의 띄어쓰기를 non-breaking space로 변환
  const processDescriptionText = (text: string): string => {
    if (Platform.OS !== 'android') return text;
    // 문장의 모든 띄어쓰기를 non-breaking space로 변환하여 자연스럽게 이어지도록
    // 단, 마지막 띄어쓰기는 제외 (마지막 단어 전의 띄어쓰기만)
    return text.replace(/\s+/g, '\u00A0');
  };

  const contentStyle = React.useMemo(() => {
    if (tablet) {
      return [styles.content, { padding: 16 }];
    } else if (Platform.OS === 'android') {
      // 안드로이드에서 contentAndroid 스타일 사용
      return [styles.contentAndroid];
    }
    return [styles.content];
  }, [tablet]);

  const progressTextStyle = React.useMemo(() => {
    return [
      styles.progressText,
      tablet && { fontSize: 14 }
    ];
  }, [tablet]);

  const joinButtonStyle = React.useMemo(() => {
    return [
      styles.joinButton,
      tablet && { paddingVertical: 12, paddingHorizontal: 20 }
    ];
  }, [tablet]);

  const joinButtonTextStyle = React.useMemo(() => {
    return [
      styles.joinButtonText,
      tablet && { fontSize: 15 }
    ];
  }, [tablet]);

  return (
    <TouchableOpacity style={cardStyle} onPress={onClick} activeOpacity={0.8}>
      {/* 이미지 영역 */}
      <View style={imageContainerStyle}>
        {challenge.imageUrl ? (
          <Image source={{ uri: challenge.imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>📝</Text>
          </View>
        )}
        
      </View>

      {/* 콘텐츠 영역 */}
      <View style={contentStyle}>
        <Text style={titleStyle} numberOfLines={2}>
          {challenge.title}
        </Text>
        
        <Text 
          style={descriptionStyle} 
          numberOfLines={2}
          ellipsizeMode="tail"
          {...(Platform.OS === 'android' && { textBreakStrategy: 'simple' as any })}
        >
          {processDescriptionText(challenge.description)}
        </Text>

        {/* 진행률 표시 (참여한 챌린지만) */}
        {challenge.isJoined && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${getProgressPercentage()}%` }
                ]} 
              />
            </View>
            <Text style={progressTextStyle}>
              {Math.round(getProgressPercentage())}%
            </Text>
          </View>
        )}


        {/* 참여 버튼 (참여하지 않은 챌린지만) */}
        {!challenge.isJoined && (
          <TouchableOpacity 
            style={joinButtonStyle} 
            onPress={onJoin}
            activeOpacity={0.8}
          >
            <Text style={joinButtonTextStyle}>시작하기</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: DesignTokens.colors.background,
    borderWidth: DesignTokens.borders.width,
    borderColor: DesignTokens.colors.border,
    overflow: 'hidden',
    marginBottom: 20, // 카드 하단 간격
    width: '48%', // 2열 그리드
    ...(Platform.OS === 'android' ? { marginRight: '4%' } : {}), // 안드로이드에서만 오른쪽 margin 추가
  },
  cardTablet: {
    width: '48%', // 태블릿도 2열 그리드 유지
  },
  cardLastInRow: {
    marginRight: 0, // 안드로이드에서 마지막 카드의 오른쪽 margin 제거
  },
  imageContainer: {
    position: 'relative',
    height: 120,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: DesignTokens.colors.darkGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 32,
    color: DesignTokens.colors.primary,
  },
  content: {
    padding: DesignTokens.spacing.cardPadding,
  },
  contentAndroid: {
    paddingLeft: DesignTokens.spacing.cardPadding,
    paddingRight: DesignTokens.spacing.cardPadding, // iOS와 동일하게 12px
    paddingTop: DesignTokens.spacing.cardPadding,
    paddingBottom: DesignTokens.spacing.cardPadding,
  },
  title: {
    ...DesignTokens.typography.cardTitle,
    marginBottom: DesignTokens.spacing.tinyGap,
    lineHeight: 20,
  },
  description: {
    ...DesignTokens.typography.body,
    marginBottom: DesignTokens.spacing.smallGap,
    lineHeight: 18,
  },
  progressContainer: {
    marginBottom: DesignTokens.spacing.smallGap,
  },
  progressBar: {
    height: 10,
    backgroundColor: DesignTokens.colors.background,
    borderWidth: 2,
    borderColor: DesignTokens.colors.accent,
    marginBottom: DesignTokens.spacing.tinyGap,
  },
  progressFill: {
    height: '100%',
    backgroundColor: DesignTokens.colors.alert,
  },
  progressText: {
    ...DesignTokens.typography.small,
    textAlign: 'right',
  },
  joinButton: {
    backgroundColor: DesignTokens.colors.accent,
    paddingVertical: DesignTokens.spacing.smallGap,
    paddingHorizontal: DesignTokens.spacing.sectionPadding,
    borderWidth: 2,
    borderColor: DesignTokens.colors.text,
    alignItems: 'center',
  },
  joinButtonText: {
    ...DesignTokens.typography.body,
    fontWeight: 'bold',
  },
});
