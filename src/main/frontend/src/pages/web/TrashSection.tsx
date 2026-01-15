import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { getTrashDiaries, restoreDiary, permanentDeleteDiary } from '@mooddisk/api';
import { ApiTrashDiary } from '@mooddisk/types';
import { NotificationBanner } from '../../components/common/NotificationBanner';
import DesignTokens from '../../constants/designTokens';

// 휴지통 일기 타입 (deletedAt 추가)
interface TrashDiaryWithDeletedAt extends ApiTrashDiary {
  deletedAt: string;
}

export default function TrashSection() {
  const [trashDiaries, setTrashDiaries] = useState<TrashDiaryWithDeletedAt[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // 알림 배너 상태
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'info' | 'warning' | 'error'>('success');
  const notificationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 휴지통 일기 목록 로드
  const loadTrashDiaries = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getTrashDiaries();
      setTrashDiaries(data as TrashDiaryWithDeletedAt[] || []);
    } catch (error) {
      console.error('휴지통 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTrashDiaries();
  }, [loadTrashDiaries]);

  // 일기 복원 - useCallback으로 메모이제이션
  const handleRestore = useCallback(async (diary: TrashDiaryWithDeletedAt) => {
    const confirmed = window.confirm('이 일기를 복원하시겠습니까?');
    if (!confirmed) return;

    try {
      setIsProcessing(true);
      await restoreDiary(diary.diaryIdx);
      
      // 복원 성공 알림 표시
      setNotificationMessage("일기가 복원되었습니다.");
      setNotificationType('success');
      setShowNotification(true);
      
      // 이전 타이머가 있으면 정리
      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
      }
      
      notificationTimerRef.current = setTimeout(() => {
        setShowNotification(false);
        notificationTimerRef.current = null;
      }, 3000);
      
      await loadTrashDiaries();
    } catch (error) {
      console.error('일기 복원 실패:', error);
      alert('일기 복원에 실패했습니다.');
    } finally {
      setIsProcessing(false);
    }
  }, [loadTrashDiaries]);

  // 일기 영구 삭제 - useCallback으로 메모이제이션
  const handlePermanentDelete = useCallback(async (diary: TrashDiaryWithDeletedAt) => {
    const confirmed = window.confirm('이 일기를 영구적으로 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.');
    if (!confirmed) return;

    try {
      setIsProcessing(true);
      await permanentDeleteDiary(diary.diaryIdx);
      
      // 영구삭제 성공 알림 표시
      setNotificationMessage("일기가 영구삭제되었습니다.");
      setNotificationType('warning');
      setShowNotification(true);
      
      // 이전 타이머가 있으면 정리
      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
      }
      
      notificationTimerRef.current = setTimeout(() => {
        setShowNotification(false);
        notificationTimerRef.current = null;
      }, 3000);
      
      await loadTrashDiaries();
    } catch (error) {
      console.error('영구 삭제 실패:', error);
      alert('영구 삭제에 실패했습니다.');
    } finally {
      setIsProcessing(false);
    }
  }, [loadTrashDiaries]);

  // D-Day 계산 - useCallback으로 메모이제이션
  const getDaysUntilPermanentDelete = useCallback((deletedAt: string) => {
    const deletedDate = new Date(deletedAt);
    const permanentDeleteDate = new Date(deletedDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const diffTime = permanentDeleteDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) {
      return 'D-DAY';
    } else {
      return `D-${diffDays}`;
    }
  }, []);

  // 날짜 포맷팅 - useCallback으로 메모이제이션
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toISOString().split('T')[0].replace(/-/g, '. ') + '.';
  }, []);

  // 알림 닫기 핸들러 - useCallback으로 메모이제이션
  const handleCloseNotification = useCallback(() => {
    if (notificationTimerRef.current) {
      clearTimeout(notificationTimerRef.current);
      notificationTimerRef.current = null;
    }
    setShowNotification(false);
  }, []);

  // 알림 타이머 cleanup
  useEffect(() => {
    return () => {
      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="pb-20 px-4">
        <div>
          <div 
            className="h-6 bg-gray-200 rounded animate-pulse mb-4"
            style={{ width: '200px' }}
          />
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-4 mb-3 animate-pulse"
              style={{
                backgroundColor: DesignTokens.colors.background,
                border: `${DesignTokens.borders.width} solid ${DesignTokens.colors.border}`,
              }}
            >
              <div className="flex justify-between items-center mb-2">
                <div className="h-4 bg-gray-200 rounded" style={{ width: '120px' }} />
                <div className="h-6 bg-gray-200 rounded" style={{ width: '60px' }} />
              </div>
              <div className="h-3 bg-gray-200 rounded mb-3" style={{ width: '80%' }} />
              <div className="flex gap-2">
                <div className="flex-1 h-10 bg-gray-200 rounded" />
                <div className="flex-1 h-10 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* 알림 배너 */}
      <NotificationBanner
        isVisible={showNotification}
        message={notificationMessage}
        onClose={handleCloseNotification}
        type={notificationType}
        duration={3000}
        icon={notificationType === 'success' ? '🔄' : '⚠️'}
      />
      
      {trashDiaries.length === 0 ? (
        <div className="flex items-center justify-center py-16 px-4">
          <div 
            className="py-10 px-8 text-center min-w-[280px]"
            style={{
              backgroundColor: DesignTokens.colors.background,
              border: `${DesignTokens.borders.width} solid ${DesignTokens.colors.border}`,
            }}
          >
            <p 
              className="text-lg font-bold uppercase mb-2"
              style={{ color: DesignTokens.colors.primary }}
            >
              휴지통이 비어있습니다
            </p>
            <p 
              className="text-sm"
              style={{ color: DesignTokens.colors.text }}
            >
              삭제된 일기가 없습니다
            </p>
          </div>
        </div>
      ) : (
        <div className="px-4">
          <p 
            className="font-bold uppercase mb-4"
            style={{ 
              color: DesignTokens.colors.primary,
              fontSize: '18px',
            }}
          >
            삭제된 일기 목록 ({trashDiaries.length}개)
          </p>
          
          {trashDiaries.map((diary) => (
            <div
              key={diary.diaryIdx}
              className="p-4 mb-3"
              style={{
                backgroundColor: DesignTokens.colors.background,
                border: `${DesignTokens.borders.width} solid ${DesignTokens.colors.border}`,
              }}
            >
              {/* 헤더 */}
              <div className="flex justify-between items-center mb-2">
                <span 
                  className="text-sm font-bold"
                  style={{ color: DesignTokens.colors.text }}
                >
                  {formatDate(diary.createdAt)}
                </span>
                <span 
                  className="px-2 py-1 text-xs font-bold uppercase"
                  style={{
                    color: DesignTokens.colors.text,
                    backgroundColor: DesignTokens.colors.alert,
                    border: `2px solid ${DesignTokens.colors.text}`,
                  }}
                >
                  {getDaysUntilPermanentDelete(diary.deletedAt)}
                </span>
              </div>
              
              {/* 내용 */}
              <p 
                className="text-sm mb-3"
                style={{ 
                  color: DesignTokens.colors.text,
                  lineHeight: '1.5',
                }}
              >
                {diary.content.length > 100 ? `${diary.content.substring(0, 100)}...` : diary.content}
              </p>
              
              {/* 액션 버튼 */}
              <div className="flex gap-2">
                <button
                  onClick={() => handlePermanentDelete(diary)}
                  disabled={isProcessing}
                  className="flex-1 py-2 px-4 font-bold text-sm uppercase disabled:opacity-50"
                  style={{
                    backgroundColor: DesignTokens.colors.alert,
                    border: `2px solid ${DesignTokens.colors.text}`,
                    color: DesignTokens.colors.text,
                  }}
                >
                  영구 삭제
                </button>
                
                <button
                  onClick={() => handleRestore(diary)}
                  disabled={isProcessing}
                  className="flex-1 py-2 px-4 font-bold text-sm uppercase disabled:opacity-50"
                  style={{
                    backgroundColor: DesignTokens.colors.accent,
                    border: `2px solid ${DesignTokens.colors.text}`,
                    color: DesignTokens.colors.text,
                  }}
                >
                  복원
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

