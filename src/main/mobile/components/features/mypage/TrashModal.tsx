import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { getTrashDiaries, restoreDiary, permanentDeleteDiary } from '@mooddisk/api';
import { ApiTrashDiary } from '@mooddisk/types';
import { NotificationBanner } from '../../common/NotificationBanner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCacheInvalidation } from '../../../hooks/useCacheInvalidation';
import { QUERY_KEYS } from '../../../constants/queryKeys';
import DesignTokens from '../../../constants/designTokens';
import { useIsTablet } from '../../../hooks/useDeviceInfo';
import { getMaxWidth } from '../../../utils/deviceUtils';

interface TrashModalProps {
  visible: boolean;
  onClose: () => void;
}


export const TrashModal: React.FC<TrashModalProps> = ({ visible, onClose }) => {
  const queryClient = useQueryClient();
  const { invalidateAfterTrashAction } = useCacheInvalidation();
  const isTablet = useIsTablet();
  const [selectedDiary, setSelectedDiary] = useState<ApiTrashDiary | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // 알림 배너 상태
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'info' | 'warning' | 'error'>('success');
  
  // 알림 타이머 ref
  const notificationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // React Query로 휴지통 데이터 캐시 - 전역 5분 캐시 사용
  const { data: trashDiaries = [], isLoading: loading, refetch: refetchTrashDiaries } = useQuery({
    queryKey: ['trashDiaries'],
    queryFn: async () => await getTrashDiaries(),
    enabled: visible, // 모달이 열릴 때만 실행
  });

  // 알림 상태 초기화 헬퍼 함수
  const clearNotification = useCallback(() => {
    if (notificationTimerRef.current) {
      clearTimeout(notificationTimerRef.current);
      notificationTimerRef.current = null;
    }
    setShowNotification(false);
    setNotificationMessage('');
  }, []);

  // 모달이 열리거나 닫힐 때 알림 상태 완전히 초기화
  useEffect(() => {
    // 모달이 닫히면 알림 상태 초기화
    if (!visible) {
      clearNotification();
      setNotificationType('success');
    }
  }, [visible, clearNotification]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
        notificationTimerRef.current = null;
      }
    };
  }, []);

  const handleRestore = useCallback((diary: ApiTrashDiary) => {
    Alert.alert(
      '일기 복원',
      '이 일기를 복원하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '복원',
          onPress: async () => {
            try {
              setIsProcessing(true);
              await restoreDiary(diary.diaryIdx);
              
              // 복원 성공 알림 표시
              // 기존 알림 타이머가 있으면 정리
              if (notificationTimerRef.current) {
                clearTimeout(notificationTimerRef.current);
                notificationTimerRef.current = null;
              }
              setNotificationMessage("일기가 복원되었습니다.");
              setNotificationType('success');
              setShowNotification(true);
              
              // 3초 후 자동으로 알림 닫기
              notificationTimerRef.current = setTimeout(() => {
                setShowNotification(false);
                notificationTimerRef.current = null;
              }, 3000);
              
              // React Query 캐시 무효화하여 최신 데이터 다시 로드
              const diaryDate = new Date(diary.createdAt).toISOString().split('T')[0];
              const year = new Date(diary.createdAt).getFullYear();
              const month = new Date(diary.createdAt).getMonth() + 1;
              invalidateAfterTrashAction(diaryDate, year, month);
              
              // 챌린지 캐시 무효화 후 즉시 refetch하여 체크 상태 업데이트
              await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CHALLENGE.MY_CHALLENGES });
              await queryClient.refetchQueries({ queryKey: QUERY_KEYS.CHALLENGE.MY_CHALLENGES });
              // 챌린지별 일기 캐시도 무효화하여 진행 상황 업데이트
              await queryClient.invalidateQueries({ queryKey: ['challengeDiaries'] });
              await queryClient.refetchQueries({ queryKey: ['challengeDiaries'] });
            } catch (error) {
              console.error('일기 복원 실패:', error);
              Alert.alert('오류', '일기 복원에 실패했습니다.');
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  }, [queryClient, invalidateAfterTrashAction]);

  const handlePermanentDelete = useCallback((diary: ApiTrashDiary) => {
    Alert.alert(
      '영구 삭제',
      '이 일기를 영구적으로 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsProcessing(true);
              await permanentDeleteDiary(diary.diaryIdx);
              
              // 영구삭제 성공 알림 표시
              // 기존 알림 타이머가 있으면 정리
              if (notificationTimerRef.current) {
                clearTimeout(notificationTimerRef.current);
                notificationTimerRef.current = null;
              }
              setNotificationMessage("일기가 영구삭제되었습니다.");
              setNotificationType('warning');
              setShowNotification(true);
              
              // 3초 후 자동으로 알림 닫기
              notificationTimerRef.current = setTimeout(() => {
                setShowNotification(false);
                notificationTimerRef.current = null;
              }, 3000);
              
              // React Query 캐시 무효화하여 최신 데이터 다시 로드
              const diaryDate = new Date(diary.createdAt).toISOString().split('T')[0];
              const year = new Date(diary.createdAt).getFullYear();
              const month = new Date(diary.createdAt).getMonth() + 1;
              invalidateAfterTrashAction(diaryDate, year, month);
            } catch (error) {
              console.error('영구 삭제 실패:', error);
              Alert.alert('오류', '영구 삭제에 실패했습니다.');
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  }, [queryClient]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toISOString().split('T')[0].replace(/-/g, '. ') + '.';
  };

  const getDaysUntilPermanentDelete = (deletedAt: string) => {
    const deletedDate = new Date(deletedAt);
    const permanentDeleteDate = new Date(deletedDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30일 후
    const now = new Date();
    const diffTime = permanentDeleteDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) {
      return 'D-DAY';
    } else {
      return `D-${diffDays}`;
    }
  };


  const renderDiaryItem = (diary: ApiTrashDiary) => (
    <View key={diary.diaryIdx} style={styles.diaryItem}>
      <View style={styles.diaryHeader}>
        <Text style={styles.diaryDate}>{formatDate(diary.createdAt)}</Text>
        <Text style={styles.deleteText}>{getDaysUntilPermanentDelete((diary as any).deletedAt)}</Text>
      </View>
      
      <Text style={styles.diaryContent} numberOfLines={3}>
        {diary.content}
      </Text>
      
      
      <View style={styles.diaryActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handlePermanentDelete(diary)}
          disabled={isProcessing}
        >
          <Text style={styles.deleteButtonText}>영구 삭제</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.restoreButton]}
          onPress={() => handleRestore(diary)}
          disabled={isProcessing}
        >
          <Text style={styles.restoreButtonText}>복원</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const dynamicStyles = isTablet ? {
    container: { ...styles.container, paddingHorizontal: 40 },
    contentWrapper: { ...styles.contentWrapper, maxWidth: getMaxWidth(), alignSelf: 'center' as const, width: '100%' },
  } : {};

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, dynamicStyles.container]}>
        {/* 태블릿 모드 여백을 위한 래퍼 */}
        <View style={[styles.contentWrapper, dynamicStyles.contentWrapper]}>
          {/* 헤더 */}
          <View style={styles.header}>
          <Text style={styles.headerTitle}>휴지통</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>닫기</Text>
          </TouchableOpacity>
        </View>
        
        {/* 알림 배너 - 헤더 아래(보라색 선 아래)에 위치, 모달이 닫혔다가 다시 열릴 때 알림이 나타나지 않도록 key 사용 */}
        <NotificationBanner
          key={`notification-${visible ? 'open' : 'closed'}`}
          isVisible={showNotification}
          message={notificationMessage}
          onClose={() => {
            setShowNotification(false);
            if (notificationTimerRef.current) {
              clearTimeout(notificationTimerRef.current);
              notificationTimerRef.current = null;
            }
          }}
          type={notificationType}
          duration={3000}
          icon={notificationType === 'success' ? '🔄' : '⚠️'}
          containerStyle={{ 
            top: 69, // 헤더 높이(paddingVertical 16*2 + 텍스트 높이 약 28 + borderBottom 3 = 67px) 바로 아래 위치, 보라색 선 아래
            position: 'absolute', // absolute로 해서 목록이 움직이지 않게
            left: 0,
            right: 0,
            zIndex: 1000,
          }} // 휴지통 모달에서는 헤더 바로 아래에 absolute positioning으로 배치
        />

        {/* 내용 */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={DesignTokens.colors.primary} />
            </View>
          ) : trashDiaries.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>휴지통이 비어있습니다</Text>
              <Text style={styles.emptySubText}>삭제된 일기가 없습니다</Text>
            </View>
          ) : (
            <View style={styles.diaryList}>
              <Text style={styles.countText}>삭제된 일기 목록 ({trashDiaries.length}개)</Text>
              {trashDiaries.map(renderDiaryItem)}
            </View>
          )}
        </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignTokens.colors.background,
  },
  contentWrapper: {
    flex: 1,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 3,
    borderBottomColor: DesignTokens.colors.border,
    backgroundColor: DesignTokens.colors.background,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: DesignTokens.colors.primary,
    fontFamily: DesignTokens.fonts.default,
    textTransform: 'uppercase',
  },
  closeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: DesignTokens.colors.alert,
    borderWidth: 2,
    borderColor: DesignTokens.colors.text,
  },
  closeButtonText: {
    fontSize: 14,
    color: DesignTokens.colors.text,
    fontWeight: 'bold',
    fontFamily: DesignTokens.fonts.default,
    textTransform: 'uppercase',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: DesignTokens.colors.primary,
    marginBottom: 8,
    fontFamily: DesignTokens.fonts.default,
    textTransform: 'uppercase',
  },
  emptySubText: {
    fontSize: 14,
    color: DesignTokens.colors.text,
    fontFamily: DesignTokens.fonts.default,
  },
  diaryList: {
    padding: 20,
  },
  countText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: DesignTokens.colors.primary,
    marginBottom: 16,
    fontFamily: DesignTokens.fonts.default,
    textTransform: 'uppercase',
  },
  diaryItem: {
    backgroundColor: DesignTokens.colors.background,
    padding: 16,
    marginBottom: 12,
    borderWidth: 3,
    borderColor: DesignTokens.colors.border,
  },
  diaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  diaryDate: {
    fontSize: 14,
    color: DesignTokens.colors.text,
    fontWeight: 'bold',
    fontFamily: DesignTokens.fonts.default,
  },
  diaryEmotion: {
    fontSize: 12,
    color: DesignTokens.colors.primary,
    backgroundColor: DesignTokens.colors.sectionBackground,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontWeight: '500',
  },
  deleteText: {
    fontSize: 12,
    color: DesignTokens.colors.text,
    backgroundColor: DesignTokens.colors.alert,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: DesignTokens.colors.text,
    fontWeight: 'bold',
    fontFamily: DesignTokens.fonts.default,
    textTransform: 'uppercase',
    alignSelf: 'flex-start',
  },
  diaryContent: {
    fontSize: 14,
    color: DesignTokens.colors.text,
    lineHeight: 20,
    marginBottom: 12,
    fontFamily: DesignTokens.fonts.default,
  },
  diaryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  restoreButton: {
    backgroundColor: DesignTokens.colors.accent,
    borderWidth: 2,
    borderColor: DesignTokens.colors.text,
  },
  restoreButtonText: {
    fontSize: 14,
    color: DesignTokens.colors.text,
    fontWeight: 'bold',
    fontFamily: DesignTokens.fonts.default,
    textTransform: 'uppercase',
  },
  deleteButton: {
    backgroundColor: DesignTokens.colors.alert,
    borderWidth: 2,
    borderColor: DesignTokens.colors.text,
  },
  deleteButtonText: {
    fontSize: 14,
    color: DesignTokens.colors.text,
    fontWeight: 'bold',
    fontFamily: DesignTokens.fonts.default,
    textTransform: 'uppercase',
  },
});
