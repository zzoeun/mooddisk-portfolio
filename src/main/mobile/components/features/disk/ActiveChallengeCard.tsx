import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { ChallengeEntry, MyChallengeEntry } from '@mooddisk/types';
import DesignTokens from '../../../constants/designTokens';

interface ActiveChallengeCardProps {
  challenge: ChallengeEntry | MyChallengeEntry;
  progress: boolean[];
  periodInfo: {
    days: number;
    label: string;
    color: string;
    bgColor: string;
    textColor: string;
  };
  onPress?: () => void;
}

export const ActiveChallengeCard: React.FC<ActiveChallengeCardProps> = ({
  challenge,
  progress,
  periodInfo,
  onPress
}) => {
  // TRAVEL 로그의 경우 logName.log 형식으로 표시, 없으면 title 사용
  const displayTitle = ('logName' in challenge && challenge.logName && challenge.type === 'TRAVEL')
    ? `${challenge.logName}.log`
    : challenge.title;

  return (
    <TouchableOpacity style={styles.stampCard} onPress={onPress} activeOpacity={0.7}>
      {/* 스탬프 찍히는 부분 - 회색 배경 */}
      <View style={styles.stampContainer}>
        {/* 챌린지 헤더 */}
        <View style={styles.stampHeader}>
          <Text style={styles.stampTitle}>{displayTitle}</Text>
          <View style={[styles.periodBadge, { backgroundColor: periodInfo.bgColor }]}>
            <Text style={[styles.periodText, { color: periodInfo.textColor }]}>
              {periodInfo.label}
            </Text>
          </View>
        </View>
        
        {/* 스탬프 그리드 */}
        <View style={styles.stampGrid}>
          {/* 첫 번째 줄 (1-7일) */}
          <View style={styles.stampRow}>
            {progress.slice(0, 7).map((isCompleted, index) => (
              <View key={index} style={styles.stampItem}>
                <Text style={styles.stampDayNumber}>{index + 1}</Text>
                <View style={[
                  styles.stampCircle,
                  isCompleted ? styles.stampCompleted : styles.stampEmpty
                ]}>
                  {isCompleted && (
                    <Text style={styles.stampCheckmark}>✓</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
          
          {/* 두 번째 줄 (8-14일) */}
          {progress.length > 7 && (
            <View style={styles.stampRow}>
              {progress.slice(7, 14).map((isCompleted, index) => (
                <View key={index + 7} style={styles.stampItem}>
                  <Text style={styles.stampDayNumber}>{index + 8}</Text>
                  <View style={[
                    styles.stampCircle,
                    isCompleted ? styles.stampCompleted : styles.stampEmpty
                  ]}>
                    {isCompleted && (
                      <Text style={styles.stampCheckmark}>✓</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
          
          {/* 세 번째 줄 (15-21일) - 30일 챌린지용 */}
          {progress.length > 14 && (
            <View style={styles.stampRow}>
              {progress.slice(14, 21).map((isCompleted, index) => (
                <View key={index + 14} style={styles.stampItem}>
                  <Text style={styles.stampDayNumber}>{index + 15}</Text>
                  <View style={[
                    styles.stampCircle,
                    isCompleted ? styles.stampCompleted : styles.stampEmpty
                  ]}>
                    {isCompleted && (
                      <Text style={styles.stampCheckmark}>✓</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
          
          {/* 네 번째 줄 (22-28일) - 30일 챌린지용 */}
          {progress.length > 21 && (
            <View style={styles.stampRow}>
              {progress.slice(21, 28).map((isCompleted, index) => (
                <View key={index + 21} style={styles.stampItem}>
                  <Text style={styles.stampDayNumber}>{index + 22}</Text>
                  <View style={[
                    styles.stampCircle,
                    isCompleted ? styles.stampCompleted : styles.stampEmpty
                  ]}>
                    {isCompleted && (
                      <Text style={styles.stampCheckmark}>✓</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
          
          {/* 다섯 번째 줄 (29-30일) - 30일 챌린지용 */}
          {progress.length > 28 && (
            <View style={styles.stampRow}>
              {progress.slice(28, 30).map((isCompleted, index) => (
                <View key={index + 28} style={styles.stampItem}>
                  <Text style={styles.stampDayNumber}>{index + 29}</Text>
                  <View style={[
                    styles.stampCircle,
                    isCompleted ? styles.stampCompleted : styles.stampEmpty
                  ]}>
                    {isCompleted && (
                      <Text style={styles.stampCheckmark}>✓</Text>
                    )}
                  </View>
                </View>
              ))}
              {/* 나머지 5칸은 빈 공간으로 채움 */}
              {Array.from({ length: 5 }).map((_, index) => (
                <View key={`empty-${index}`} style={styles.stampItem}>
                  <Text style={styles.stampDayNumberEmpty}>-</Text>
                  <View style={styles.stampEmpty}></View>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // 스탬프 관련 스타일
  stampCard: {
    backgroundColor: DesignTokens.colors.background,
    marginBottom: DesignTokens.spacing.cardMargin,
    marginHorizontal: DesignTokens.spacing.sectionPadding,
    borderWidth: DesignTokens.borders.width,
    borderColor: DesignTokens.colors.border,
  },
  stampContainer: {
    backgroundColor: DesignTokens.colors.background,
    padding: DesignTokens.spacing.sectionPadding,
    borderWidth: 2,
    borderColor: DesignTokens.colors.accent,
  },
  stampHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.tinyGap,
  },
  stampTitle: {
    ...DesignTokens.typography.cardTitle,
    flex: 1,
  },
  periodBadge: {
    paddingHorizontal: DesignTokens.spacing.innerPadding,
    paddingVertical: DesignTokens.spacing.tinyGap,
    borderWidth: 2,
    borderColor: DesignTokens.colors.text,
  },
  periodText: {
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: DesignTokens.fonts.default,
    textTransform: 'uppercase',
  },
  stampGrid: {
    gap: 12,
  },
  stampRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    ...(Platform.OS === 'android' && {
      gap: 20,
    }),
  },
  stampItem: {
    alignItems: 'center',
    flex: 1,
  },
  stampDayNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: DesignTokens.colors.text,
    marginBottom: DesignTokens.spacing.tinyGap,
    fontFamily: DesignTokens.fonts.default,
  },
  stampDayNumberEmpty: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'transparent',
    marginBottom: DesignTokens.spacing.tinyGap,
    fontFamily: DesignTokens.fonts.default,
  },
  stampCircle: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: DesignTokens.colors.text,
  },
  stampCompleted: {
    backgroundColor: DesignTokens.colors.alert,
  },
  stampEmpty: {
    backgroundColor: DesignTokens.colors.background,
  },
  stampCheckmark: {
    color: DesignTokens.colors.text,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: DesignTokens.fonts.default,
  },
});
