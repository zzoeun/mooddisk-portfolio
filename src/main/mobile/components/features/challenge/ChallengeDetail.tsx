import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Alert,
  Platform
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { ChallengeEntry } from '@mooddisk/types';
import { splitTextByLineBreaks } from '@mooddisk/utils';
import { useQuery } from '@tanstack/react-query';
import { getChallengeById } from '@mooddisk/api';
import { LoadingOverlay } from '../../common/loading';
import { useIsTablet } from '../../../hooks/useDeviceInfo';
import DesignTokens from '../../../constants/designTokens';
// 설명용 줄바꿈 처리 함수
const formatDescriptionWithLineBreaks = (text: string) => {
  const lines = splitTextByLineBreaks(text);
  return lines.map((line, index) => (
    <Text key={index} style={styles.descriptionText}>
      {line.trim()}
    </Text>
  ));
};

// 규칙용 줄바꿈 처리 함수
const formatTextWithLineBreaks = (text: string) => {
  const lines = splitTextByLineBreaks(text);
  return lines.map((line, index) => (
    <View key={index} style={styles.ruleItem}>
      <Text style={styles.ruleBullet}>▶</Text>
      <Text style={styles.ruleText}>{line.trim()}</Text>
    </View>
  ));
};


interface ChallengeDetailProps {
  challenge: ChallengeEntry;
  onBack: () => void;
  onJoin: (challengeId: string) => void;
  loading: boolean;
}

export const ChallengeDetail: React.FC<ChallengeDetailProps> = ({
  challenge,
  onBack,
  onJoin,
  loading
}) => {
  const isTablet = useIsTablet();
  
  // React Query로 챌린지 상세 정보 캐시 - 전역 5분 캐시 사용
  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ['challengeDetail', challenge.challengeIdx],
    queryFn: async () => await getChallengeById(challenge.challengeIdx!),
    enabled: !!challenge.challengeIdx, // challengeIdx가 있을 때만 실행
  });

  // 최종 챌린지 데이터 (기본 데이터 + 상세 데이터)
  const finalChallenge = useMemo(() => {
    if (detailData) {
      return {
        ...challenge,
        ...detailData
      };
    }
    return challenge;
  }, [challenge, detailData]);

  if (loading || detailLoading) {
    return (
      <LoadingOverlay />
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.scrollContentTablet
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 챌린지 이미지 */}
        <View style={styles.imageContainer}>
          {finalChallenge.imageUrl ? (
            <FastImage
              source={{ 
                uri: finalChallenge.imageUrl,
                priority: FastImage.priority.high,
                cache: FastImage.cacheControl.immutable
              }}
              style={styles.image}
              resizeMode={FastImage.resizeMode.cover}
              onError={() => {
                console.error('챌린지 이미지 로드 실패:', finalChallenge.imageUrl);
              }}
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderText}>🎮</Text>
            </View>
          )}
          {/* 기간 정보 - 이미지 하단 오른쪽 */}
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{finalChallenge.duration}days</Text>
          </View>
        </View>

        {/* 챌린지 상세 정보 */}
        <View style={[styles.tabContentArea, isTablet && styles.tabContentAreaTablet]}>
          {/* 챌린지 설명 */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isTablet && styles.sectionTitleTablet]}>소개</Text>
            <View style={styles.descriptionContainer}>
              {formatDescriptionWithLineBreaks(finalChallenge.description)}
            </View>
          </View>

          {/* 챌린지 규칙 */}
          {finalChallenge.rules && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, isTablet && styles.sectionTitleTablet]}>
                참여 방법
              </Text>
              <View style={styles.rulesContainer}>
                {formatTextWithLineBreaks(finalChallenge.rules)}
              </View>
            </View>
          )}

          {/* 챌린지 보상 */}
          {finalChallenge.rewards && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, isTablet && styles.sectionTitleTablet]}>
                기록가이드
              </Text>
              <View style={styles.descriptionContainer}>
                {formatDescriptionWithLineBreaks(finalChallenge.rewards)}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignTokens.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 100 : 80, // TabBar 높이만큼 하단 패딩
  },
  scrollContentTablet: {
    paddingBottom: Platform.OS === 'ios' ? 120 : 100, // 태블릿은 더 큰 패딩
    paddingHorizontal: 40, // 태블릿 좌우 패딩
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: DesignTokens.colors.background,
  },
  imageContainer: {
    position: 'relative',
    aspectRatio: 1,
    backgroundColor: DesignTokens.colors.darkGray,
    borderWidth: 4,
    borderColor: DesignTokens.colors.border,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DesignTokens.colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: DesignTokens.colors.background,
    gap: 4,
  },
  durationIcon: {
    fontSize: 12,
    color: DesignTokens.colors.text,
  },
  durationText: {
    fontSize: 14,
    color: DesignTokens.colors.text,
    fontWeight: 'bold',
    fontFamily: DesignTokens.fonts.default,
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
    fontSize: 48,
    color: DesignTokens.colors.primary,
  },
  tabContentArea: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  tabContentAreaTablet: {
    paddingHorizontal: 40,
    paddingTop: 32,
    paddingBottom: 24,
  },
  section: {
    marginBottom: 24,
    backgroundColor: DesignTokens.colors.background,
    borderWidth: 3,
    borderColor: DesignTokens.colors.border,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: DesignTokens.colors.primary,
    marginBottom: 12,
    fontFamily: DesignTokens.fonts.default,
    textTransform: 'uppercase',
  },
  sectionTitleTablet: {
    fontSize: 22,
    marginBottom: 16,
  },
  descriptionContainer: {
    paddingVertical: 4,
  },
  descriptionText: {
    fontSize: 16,
    color: DesignTokens.colors.text,
    lineHeight: 22,
    marginBottom: 8,
    fontFamily: DesignTokens.fonts.default,
  },
  rulesContainer: {
    paddingVertical: 4,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    backgroundColor: DesignTokens.colors.background,
    padding: 8,
    borderWidth: 2,
    borderColor: DesignTokens.colors.accent,
  },
  ruleBullet: {
    color: DesignTokens.colors.accent,
    fontSize: 18,
    marginRight: 8,
    marginTop: 2,
    fontWeight: 'bold',
    fontFamily: DesignTokens.fonts.default,
  },
  ruleText: {
    fontSize: 15,
    color: DesignTokens.colors.text,
    lineHeight: 20,
    flex: 1,
    fontFamily: DesignTokens.fonts.default,
  },
});