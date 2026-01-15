import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MyChallengeEntry } from '@mooddisk/types';
import DesignTokens from '../../../constants/designTokens';

interface UpcomingChallengeCardProps {
  challenge: MyChallengeEntry;
  onPress?: () => void;
}

export const UpcomingChallengeCard: React.FC<UpcomingChallengeCardProps> = ({
  challenge,
  onPress
}) => {
  // TRAVEL 로그의 경우 logName.log 형식으로 표시, 없으면 title 사용
  const displayTitle = (challenge.logName && challenge.type === 'TRAVEL')
    ? `${challenge.logName}.log`
    : challenge.title;

  // 여행지 정보 파싱
  const getDestinations = (): string[] => {
    if (!challenge.destinations || challenge.type !== 'TRAVEL') {
      return [];
    }
    
    try {
      const destinations = JSON.parse(challenge.destinations);
      if (Array.isArray(destinations)) {
        return destinations.map((dest: any) => dest.name || '').filter((name: string) => name);
      }
    } catch (error) {
      console.error('여행지 정보 파싱 실패:', error);
    }
    
    return [];
  };

  // 기간 정보 계산 (출발일 ~ 귀국일)
  const getPeriodInfo = (): string => {
    if (!challenge.startedAt || challenge.type !== 'TRAVEL') {
      return '';
    }

    const startDate = new Date(challenge.startedAt);
    const durationDays = challenge.durationDays || 0;
    const endDate = new Date(startDate);
    if (durationDays > 0) {
      endDate.setDate(startDate.getDate() + durationDays - 1);
    }
    
    const formatDate = (date: Date) => {
      return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
    };
    
    return `${formatDate(startDate)} ~ ${formatDate(endDate)}`;
  };

  // 남은 일자 계산 (출발일까지)
  const getDaysUntilDeparture = (): number => {
    if (!challenge.startedAt) {
      return 0;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const departureDate = new Date(challenge.startedAt);
    departureDate.setHours(0, 0, 0, 0);
    
    const diffTime = departureDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  };

  const destinations = getDestinations();
  const periodInfo = getPeriodInfo();
  const daysUntilDeparture = getDaysUntilDeparture();

  return (
    <TouchableOpacity 
      style={styles.upcomingChallengeItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.challengeContent}>
        <View style={styles.challengeHeader}>
          <Text style={styles.challengeTitle}>{displayTitle}</Text>
          {daysUntilDeparture > 0 && (
            <View style={styles.daysBadge}>
              <Text style={styles.daysBadgeText}>
                D-{daysUntilDeparture}
              </Text>
            </View>
          )}
        </View>
        
        {destinations.length > 0 && (
          <View style={styles.destinationRow}>
            <Text style={styles.destinationText}>
              {destinations.join(', ')}
            </Text>
          </View>
        )}
        
        {periodInfo && (
          <View style={styles.periodRow}>
            <Text style={styles.periodText}>{periodInfo}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  upcomingChallengeItem: {
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
  challengeTitle: {
    ...DesignTokens.typography.cardTitle,
    flex: 1,
    marginRight: DesignTokens.spacing.innerPadding,
  },
  daysBadge: {
    paddingHorizontal: DesignTokens.spacing.innerPadding,
    paddingVertical: DesignTokens.spacing.tinyGap,
    backgroundColor: DesignTokens.colors.accent,
    borderWidth: 2,
    borderColor: DesignTokens.colors.text,
  },
  daysBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: DesignTokens.fonts.default,
    color: DesignTokens.colors.text,
    textTransform: 'uppercase',
  },
  destinationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.tinyGap,
  },
  destinationLabel: {
    fontSize: 13,
    color: DesignTokens.colors.gray,
    fontWeight: 'bold',
    fontFamily: DesignTokens.fonts.default,
    marginRight: DesignTokens.spacing.innerPadding,
    minWidth: 50,
  },
  destinationText: {
    fontSize: 13,
    color: DesignTokens.colors.text,
    fontWeight: 'bold',
    fontFamily: DesignTokens.fonts.default,
    flex: 1,
  },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  periodLabel: {
    fontSize: 13,
    color: DesignTokens.colors.gray,
    fontWeight: 'bold',
    fontFamily: DesignTokens.fonts.default,
    marginRight: DesignTokens.spacing.innerPadding,
    minWidth: 50,
  },
  periodText: {
    fontSize: 13,
    color: DesignTokens.colors.text,
    fontWeight: 'bold',
    fontFamily: DesignTokens.fonts.default,
    flex: 1,
  },
});

