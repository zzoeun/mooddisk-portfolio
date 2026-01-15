import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
// import { useUserStats, useTrashDiaries } from '../../../hooks/useQueries'; // MyPageScreen에서 통합 관리
// import { LoadingSpinner } from '../../common/loading'; // MyPageScreen에서 통합 관리
import DesignTokens from '../../../constants/designTokens';

interface ActivityInfoProps {
  userIdx: number;
  userStats?: any;
  trashDiaries?: any[];
  onTrashClick: () => void;
}

export const ActivityInfo: React.FC<ActivityInfoProps> = ({
  userIdx,
  userStats,
  trashDiaries = [],
  onTrashClick,
}) => {
  // props로 받은 데이터 사용 (MyPageScreen에서 통합 관리)

  // 사용자 통계 메모이제이션 - 단순화된 데이터 파싱
  const { totalDiaries, consecutiveDays, firstDiaryDate, totalTrash } = useMemo(() => {
    const stats = userStats?.data || userStats;
    return {
      totalDiaries: stats?.totalDiaries || 0,
      consecutiveDays: stats?.consecutiveDays || 0,
      firstDiaryDate: stats?.firstRecordDate || null,
      totalTrash: trashDiaries?.length || 0,
    };
  }, [userStats, trashDiaries]);

  // 첫 기록일 포맷팅 (안드로이드에서 줄바꿈 방지)
  const formattedFirstDate = useMemo(() => {
    if (!firstDiaryDate) return '-';
    const dateStr = new Date(firstDiaryDate).toISOString().split('T')[0].replace(/-/g, '. ') + '.';
    // 안드로이드에서 띄어쓰기를 non-breaking space로 변환하여 줄바꿈 방지
    if (Platform.OS === 'android') {
      return dateStr.replace(/\s+/g, '\u00A0');
    }
    return dateStr;
  }, [firstDiaryDate]);

  // 로딩 상태는 MyPageScreen에서 통합 관리

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>활동 정보</Text>
      <View style={styles.sectionContent}>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalDiaries}</Text>
            <Text style={styles.statLabel}>총 일기 수</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{consecutiveDays}</Text>
            <Text style={styles.statLabel}>연속 기록일</Text>
          </View>
          <View style={styles.statItem}>
            <Text 
              style={[
                styles.statValue,
                Platform.OS === 'android' && styles.statValueAndroid
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit={Platform.OS === 'android'}
              minimumFontScale={Platform.OS === 'android' ? 0.7 : 1}
            >
              {formattedFirstDate}
            </Text>
            <Text style={styles.statLabel}>첫 기록일</Text>
          </View>
          <TouchableOpacity style={styles.statItem} onPress={onTrashClick}>
            <Text style={styles.statValue}>{totalTrash}</Text>
            <Text style={styles.statLabel}>휴지통</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginHorizontal: DesignTokens.spacing.sectionPadding,
    backgroundColor: DesignTokens.colors.background,
    borderWidth: DesignTokens.borders.width,
    borderColor: DesignTokens.colors.border,
    padding: DesignTokens.spacing.sectionPadding,
  },
  sectionTitle: {
    ...DesignTokens.typography.sectionTitle,
    color: DesignTokens.colors.secondary,
    backgroundColor: DesignTokens.colors.sectionBackground,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: DesignTokens.spacing.sectionTitleMargin,
    alignSelf: "flex-start",
  },
  sectionContent: {
    backgroundColor: DesignTokens.colors.background,
  },
  // loadingContainer 제거 - MyPageScreen에서 통합 관리
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statItem: {
    width: '50%',
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: DesignTokens.colors.text,
    borderRightWidth: 2,
    borderRightColor: DesignTokens.colors.text,
  },
  statValue: {
    ...DesignTokens.typography.cardTitle,
    marginBottom: DesignTokens.spacing.tinyGap,
    height: 24, // 모든 statValue의 높이를 동일하게 고정
    textAlign: 'center',
  },
  statValueAndroid: {
    // 안드로이드에서 첫 기록일 텍스트가 잘리지 않도록
    fontSize: 14,
  },
  statLabel: {
    fontSize: 12,
    color: DesignTokens.colors.text,
    textAlign: 'center',
    fontFamily: DesignTokens.fonts.default,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
});
