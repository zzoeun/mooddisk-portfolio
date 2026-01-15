import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChallengeEntry, MyChallengeEntry } from '@mooddisk/types';
import DesignTokens from '../../../constants/designTokens';

interface CompletedChallengeCardProps {
  challenge: ChallengeEntry | MyChallengeEntry;
  periodInfo: {
    days: number;
    label: string;
    color: string;
    bgColor: string;
    textColor: string;
  };
  onPress?: () => void;
  isFirst?: boolean;
}

export const CompletedChallengeCard: React.FC<CompletedChallengeCardProps> = ({
  challenge,
  periodInfo,
  onPress,
  isFirst = false
}) => {
  // TRAVEL 로그의 경우 logName.log 형식으로 표시, 없으면 title 사용
  const displayTitle = ('logName' in challenge && challenge.logName && challenge.type === 'TRAVEL')
    ? `${challenge.logName}.log`
    : challenge.title;

  // 기간 정보 계산
  const getPeriodInfo = () => {
    const startDate = new Date('startDate' in challenge ? challenge.startDate : challenge.startedAt);
    const endDate = new Date(startDate);
    const durationDays = 'duration' in challenge ? challenge.duration : challenge.durationDays;
    if (durationDays && durationDays > 0) {
      endDate.setDate(startDate.getDate() + durationDays - 1);
    }
    
    const formatDate = (date: Date) => {
      return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
    };
    
    return `${formatDate(startDate)} ~ ${formatDate(endDate)}`;
  };

  // 완료 여부/빈칸 상태 계산
  const getProgressInfo = () => {
    const progressDays = 'progress' in challenge ? challenge.progress : challenge.progressDays;
    const durationDays = 'duration' in challenge ? challenge.duration : challenge.durationDays;
    return `${progressDays}/${durationDays || 0} 기록`;
  };

  // 진행률에 따른 배지 색상
  const getProgressBadgeStyle = () => {
    const progressDays = 'progress' in challenge ? challenge.progress : challenge.progressDays;
    const durationDays = 'duration' in challenge ? challenge.duration : challenge.durationDays;
    const progressRatio = durationDays && durationDays > 0 ? progressDays / durationDays : 0;
    
    if (progressRatio >= 1) {
      // 완료 (100% 이상) - 민트 그린
      return {
        backgroundColor: DesignTokens.colors.accent,
        textColor: DesignTokens.colors.text,
      };
    } else {
      // 실패 - 코랄 레드
      return {
        backgroundColor: DesignTokens.colors.alert,
        textColor: DesignTokens.colors.text,
      };
    }
  };

  const progressBadge = getProgressBadgeStyle();

  return (
    <TouchableOpacity 
      style={styles.completedChallengeItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.challengeContent}>
        <View style={styles.challengeHeader}>
          <Text style={styles.completedChallengeTitle}>{displayTitle}</Text>
          <View style={[styles.progressBadge, { backgroundColor: progressBadge.backgroundColor }]}>
            <Text style={[styles.progressBadgeText, { color: progressBadge.textColor }]}>
              {getProgressInfo()}
            </Text>
          </View>
        </View>
        <View style={styles.challengeDetails}>
          <Text style={styles.periodText}>{getPeriodInfo()}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // 완료된 챌린지 스타일
  completedChallengeItem: {
    padding: DesignTokens.spacing.sectionPadding,
    backgroundColor: DesignTokens.colors.background,
    marginBottom: DesignTokens.spacing.cardMargin,
    marginHorizontal: DesignTokens.spacing.sectionPadding,
    borderWidth: DesignTokens.borders.width,
    borderColor: DesignTokens.colors.border,
  },
  challengeContent: {
    flex: 1,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.tinyGap,
  },
  completedChallengeTitle: {
    ...DesignTokens.typography.cardTitle,
    flex: 1,
    marginRight: DesignTokens.spacing.innerPadding,
  },
  progressBadge: {
    paddingHorizontal: DesignTokens.spacing.innerPadding,
    paddingVertical: DesignTokens.spacing.tinyGap,
    borderWidth: 2,
    borderColor: DesignTokens.colors.text,
  },
  progressBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: DesignTokens.fonts.default,
    textTransform: 'uppercase',
  },
  challengeDetails: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  periodText: {
    fontSize: 13,
    color: DesignTokens.colors.text,
    fontWeight: 'bold',
    fontFamily: DesignTokens.fonts.default,
  },
});
