import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { DiaryEntry } from "@mooddisk/types";

import { createDiary, updateDiary, deleteDiary, getDiaryById, getDiaryCalendar, moveToTrash, getDiaryByDate } from '@mooddisk/api';
import { getMyChallenges } from '@mooddisk/api';
import { useAuth } from '../../context/AuthContext';
import { useUser } from '../../context/UserContext';

import { DiaryWrite } from '../../components/features/diary/write';
import { DiaryDetail } from '../../components/features/diary/detail';
import { DiaryCalendar } from '../../components/features/diary/calendar/DiaryCalendar';
import { getEmotionDisplayName, emotionMapping, getEmotionIdxFromString, getEmotionFilterOptions, isSameMonth, validateFileSize, FILE_SIZE_LIMITS, formatFileSize, createFormData, getPixelEmotionFromIdx, convertKoreanDateToApiFormat } from '@mooddisk/utils';
import { useErrorHandler } from '@mooddisk/hooks';
import { ErrorModal } from '../../components/common/modals/ErrorModal';
import { NotificationBanner } from '../../components/common/NotificationBanner';
import { ChallengeCompletionModal } from '../../components/features/challenge';
import { MyChallengeEntry } from '@mooddisk/types';

interface DiarySectionProps {
  onWritingModeChange?: (isWriting: boolean) => void;
  onDetailModeChange?: (isDetail: boolean) => void;
  onBackFromWriting?: () => void;
  onHeaderSubmit?: () => void;
  onTitleChange?: (title: string) => void;
  isSubmitting?: boolean;
  setIsSubmitting?: (submitting: boolean) => void;
  shouldGoBack?: boolean;
  setShouldGoBack?: (goBack: boolean) => void;
  shouldSubmit?: boolean;
  setShouldSubmit?: (submit: boolean) => void;
  onModalChange?: (isOpen: boolean) => void;
  initialView?: 'calendar' | 'write' | 'detail';
  initialChallengeIdx?: number;
  onChallengeSelected?: () => void;
  onBackToDisk?: (showNotification?: boolean) => void;
}

console.log("DiarySection");

export default function DiarySection({
  onWritingModeChange,
  onDetailModeChange,
  onBackFromWriting,
  onTitleChange,
  shouldGoBack,
  setShouldGoBack,
  shouldSubmit,
  setShouldSubmit,
  onModalChange,
  initialView = 'calendar',
  initialChallengeIdx,
  onChallengeSelected,
  onBackToDisk
}: DiarySectionProps) {
  const { isLoggedIn } = useAuth();
  const { nickname } = useUser();

  const [view, setView] = useState<'calendar' | 'write' | 'detail'>(() => {
    // initialChallengeIdx가 있으면 write 모드로 시작
    if (initialChallengeIdx !== undefined) {
      return 'write';
    }
    return initialView;
  });
  const [diaries, setDiaries] = useState<DiaryEntry[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedDiary, setSelectedDiary] = useState<DiaryEntry | null>(null);

  const [selectedEmotion, setSelectedEmotion] = useState('전체');
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth());
  });
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [showAllTime, setShowAllTime] = useState(false);
  const [myChallenges, setMyChallenges] = useState<any[]>([]);
  const [newDiary, setNewDiary] = useState({
    content: '',
    emotion: 'HAPPY',
    images: [] as string[],
    challengeIdx: undefined as number | undefined
  });
  const [editingDiaryId, setEditingDiaryId] = useState<string | null>(null);
  const [selectedImageFiles, setSelectedImageFiles] = useState<File[]>([]);
  const [removedImageUrls, setRemovedImageUrls] = useState<string[]>([]);
  
  // 제출 중복 방지를 위한 ref
  const isSubmittingRef = React.useRef(false);
  
  // 알림 배너 상태
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'info' | 'warning' | 'error'>('success');
  
  // 챌린지 완료 모달 상태
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completedChallenge, setCompletedChallenge] = useState<MyChallengeEntry | null>(null);
  const previousChallengeStatusRef = React.useRef<string | null>(null);
  const previousChallengeIdxRef = React.useRef<number | null>(null);
  
  // 에러 처리 훅
  const { errorMessage, showErrorModal, handleError, clearError } = useErrorHandler();

  // 콜백들을 useRef로 안정화하여 불필요한 리렌더링 방지
  const onTitleChangeRef = useRef(onTitleChange);
  const onWritingModeChangeRef = useRef(onWritingModeChange);
  const onDetailModeChangeRef = useRef(onDetailModeChange);
  const onBackFromWritingRef = useRef(onBackFromWriting);
  const onChallengeSelectedRef = useRef(onChallengeSelected);
  const onBackToDiskRef = useRef(onBackToDisk);
  const setShouldGoBackRef = useRef(setShouldGoBack);
  const setShouldSubmitRef = useRef(setShouldSubmit);

  useEffect(() => {
    onTitleChangeRef.current = onTitleChange;
    onWritingModeChangeRef.current = onWritingModeChange;
    onDetailModeChangeRef.current = onDetailModeChange;
    onBackFromWritingRef.current = onBackFromWriting;
    onChallengeSelectedRef.current = onChallengeSelected;
    onBackToDiskRef.current = onBackToDisk;
    setShouldGoBackRef.current = setShouldGoBack;
    setShouldSubmitRef.current = setShouldSubmit;
  }, [onTitleChange, onWritingModeChange, onDetailModeChange, onBackFromWriting, onChallengeSelected, onBackToDisk, setShouldGoBack, setShouldSubmit]);

  // initialView가 'write'일 때 작성 모드 변경 콜백 호출
  useEffect(() => {
    if (initialView === 'write') {
      onWritingModeChangeRef.current?.(true);
    }
  }, [initialView]);

  // initialChallengeIdx가 설정되면 즉시 상태 초기화 및 write 모드로 전환
  useEffect(() => {
    if (initialChallengeIdx !== undefined) {
      console.log('📝 initialChallengeIdx 설정됨:', initialChallengeIdx, '현재 view:', view, 'initialView:', initialView);
      // 즉시 write 모드로 전환 (무조건)
      console.log('📝 view를 write로 변경 (initialChallengeIdx 때문에)');
      setView('write');
      onWritingModeChangeRef.current?.(true);
      // initialChallengeIdx가 설정되면 즉시 상태 초기화
      setNewDiary({ content: '', emotion: 'HAPPY', images: [], challengeIdx: initialChallengeIdx ?? undefined });
      setEditingDiaryId(null);
      setSelectedImageFiles?.([]);
      setRemovedImageUrls?.([]);
    }
  }, [initialChallengeIdx]);

// 일기 데이터 로드
const loadDiaries = useCallback(async () => {
  try {
    setLoading(true);
    
    // 월별 일기 조회 (달력용)
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth() + 1;
    
    console.log('📅 일기 조회 요청:', { year, month });
    const diaryArray = await getDiaryCalendar(year, month);
    
    console.log('📅 API 응답 데이터:', diaryArray);
    console.log('📅 일기 개수:', diaryArray.length);
    
    // 날짜별로 그룹화해서 확인
    const dateGroups = diaryArray.reduce((acc, diary) => {
      const date = diary.date;
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    console.log('📅 날짜별 일기 개수:', dateGroups);
    
    setDiaries(diaryArray);
    setIsInitialized(true);
  } catch (error) {
    handleError(error as Error);
    setDiaries([]);
    setIsInitialized(true);
  } finally {
    setLoading(false);
  }
}, [selectedMonth, handleError]);

  // 일기 데이터 로드 (월, 감정 필터 변경 시)
  useEffect(() => {
    loadDiaries();
  }, [loadDiaries]);

  // 내 챌린지 목록 로드
  useEffect(() => {
    const loadMyChallenges = async () => {
      try {
        const challenges = await getMyChallenges();
        setMyChallenges(challenges);
      } catch (error) {
        console.error('내 챌린지 로드 실패:', error);
        setMyChallenges([]);
      }
    };
    
    loadMyChallenges();
  }, []);

  // 챌린지 선택 시 이전 상태 저장
  useEffect(() => {
    if (newDiary.challengeIdx) {
      const loadPreviousStatus = async () => {
        try {
          const challenges = await getMyChallenges();
          const targetChallenge = challenges.find((c: any) => c.challengeIdx === newDiary.challengeIdx);
          
          if (targetChallenge) {
            // 다른 챌린지로 변경된 경우에만 이전 상태 초기화
            if (previousChallengeIdxRef.current !== newDiary.challengeIdx) {
              previousChallengeStatusRef.current = targetChallenge.status;
              previousChallengeIdxRef.current = newDiary.challengeIdx ?? null;
              console.log('📝 챌린지 선택 - 이전 상태 저장:', {
                challengeIdx: newDiary.challengeIdx,
                previousStatus: targetChallenge.status
              });
            }
          }
        } catch (error) {
          console.error('챌린지 이전 상태 로드 실패:', error);
        }
      };
      
      loadPreviousStatus();
    } else {
      // 챌린지가 선택 해제된 경우 초기화
      previousChallengeStatusRef.current = null;
      previousChallengeIdxRef.current = null;
    }
  }, [newDiary.challengeIdx]);

  // 챌린지 완료 상태 확인
  const checkChallengeCompletion = useCallback(async (challengeIdx?: number): Promise<boolean> => {
    if (!challengeIdx) {
      console.log('❌ 챌린지 완료 확인: challengeIdx 없음');
      return false;
    }
    
    try {
      console.log('🔍 챌린지 완료 상태 확인 시작:', { challengeIdx });
      const challenges = await getMyChallenges();
      const targetChallenge = challenges.find((c: any) => c.challengeIdx === challengeIdx);
      
      if (!targetChallenge) {
        console.log('❌ 챌린지 완료 확인: 챌린지를 찾을 수 없음');
        return false;
      }
      
      const currentStatus = targetChallenge.status;
      const previousStatus = previousChallengeStatusRef.current;
      
      console.log('📊 챌린지 상태 비교:', {
        challengeIdx,
        previousStatus,
        currentStatus,
        isStatusChanged: previousStatus !== currentStatus,
        isCompleted: currentStatus === 'COMPLETED' || currentStatus === 'FAILED'
      });
      
      // 상태가 변경되었고, 현재 상태가 COMPLETED 또는 FAILED인 경우에만 모달 표시
      if (previousStatus !== currentStatus && (currentStatus === 'COMPLETED' || currentStatus === 'FAILED')) {
        console.log('✅ 챌린지 완료 모달 표시:', targetChallenge);
        setCompletedChallenge(targetChallenge as unknown as MyChallengeEntry);
        setShowCompletionModal(true);
        previousChallengeStatusRef.current = currentStatus;
        return true; // 모달이 표시됨
      }
      
      // 현재 상태를 이전 상태로 저장
      previousChallengeStatusRef.current = currentStatus;
      console.log('ℹ️ 챌린지 상태 업데이트:', { currentStatus });
      return false; // 모달이 표시되지 않음
    } catch (error) {
      console.error('챌린지 완료 상태 확인 실패:', error);
      return false;
    }
  }, []);

  const handleWriteClick = useCallback(() => {
    // 새 일기 작성 시 모든 상태 초기화
    setNewDiary({ content: '', emotion: 'HAPPY', images: [], challengeIdx: undefined });
    setEditingDiaryId(null);
    setSelectedImageFiles?.([]);
    setRemovedImageUrls?.([]);
    setView('write');
    onWritingModeChangeRef.current?.(true);
  }, []);

  const handleDiaryClick = useCallback(async (diary: DiaryEntry) => {
    try {
      setLoading(true);
      console.log('📖 일기 클릭 - 캘린더 데이터:', diary);
      console.log('📖 일기 ID:', diary.id, '날짜:', diary.date, '생성일:', diary.createdAt);
      
      // 일기 상세 정보 가져오기
      const detailedDiary = await getDiaryById(parseInt(diary.id));
      console.log('📖 상세 일기 데이터:', detailedDiary);
      console.log('📖 상세 일기 날짜:', detailedDiary.date, '생성일:', detailedDiary.createdAt);
      
      setSelectedDiary(detailedDiary);
      setView('detail');
      onDetailModeChangeRef.current?.(true);
    } catch (error) {
      console.error('📖 일기 상세 조회 실패:', error);
      handleError(error as Error);
      // 실패 시 기본 데이터 사용
      setSelectedDiary(diary);
      setView('detail');
      onDetailModeChangeRef.current?.(true);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const handleEditDiary = useCallback((diary: DiaryEntry) => {
            setNewDiary({
          content: diary.content,
          emotion: diary.emotion,
          images: diary.imageUrls || [],
          challengeIdx: undefined
        });
    setEditingDiaryId(diary.id);
    setView('write');
    onWritingModeChangeRef.current?.(true);
  }, []);

  const handleDeleteDiary = useCallback(async (diaryId: string) => {
    try {
      // 삭제 전에 일기 정보 저장 (날짜 확인용)
      const diaryToDelete = selectedDiary?.id === diaryId 
        ? selectedDiary 
        : diaries.find(d => d.id.toString() === diaryId);
      
      await moveToTrash(parseInt(diaryId));
      
      // 일기 목록 새로고침
      await loadDiaries();
      
      // 휴지통 이동 알림 표시
      setNotificationMessage("일기가 휴지통으로 이동되었습니다.");
      setNotificationType('info');
      setShowNotification(true);
      
      if (diaryToDelete) {
        // 삭제된 일기의 날짜로 타임라인 조회
        try {
          const dateStr = convertKoreanDateToApiFormat(diaryToDelete.date);
          const diariesOnDate = await getDiaryByDate(dateStr);
          
          if (diariesOnDate && diariesOnDate.length > 0) {
            // 해당 날짜에 다른 일기가 있으면 타임라인으로 이동
            setSelectedDiary(diariesOnDate[0]);
            setView('detail');
            onDetailModeChangeRef.current?.(true);
          } else {
            // 해당 날짜에 일기가 없으면 달력으로 이동
            setSelectedDiary(null);
            setView('calendar');
            onDetailModeChangeRef.current?.(false);
          }
        } catch (error) {
          // 타임라인 조회 실패 시 달력으로 이동
          setSelectedDiary(null);
          setView('calendar');
          onDetailModeChangeRef.current?.(false);
        }
      } else {
        setSelectedDiary(null);
        setView('calendar');
        onDetailModeChangeRef.current?.(false);
      }
    } catch (error) {
      handleError(error as Error);
    }
  }, [selectedDiary, diaries, loadDiaries, handleError]);

  const handleBack = useCallback(() => {
    if (view === 'write') {
      setView('calendar');
      onWritingModeChangeRef.current?.(false);
      onBackFromWritingRef.current?.();
      // 수정 모드 초기화
      setNewDiary({ content: '', emotion: 'HAPPY', images: [], challengeIdx: undefined });
      setEditingDiaryId(null);
      setSelectedImageFiles?.([]);
      setRemovedImageUrls?.([]);
      // 헤더 제목 업데이트
      onTitleChangeRef.current?.(`${nickname || 'user'}.disk`);
    } else if (view === 'detail') {
      setView('calendar');
      onDetailModeChangeRef.current?.(false);
      setSelectedDiary(null);
      // 헤더 제목 업데이트
      onTitleChangeRef.current?.(`${nickname || 'user'}.disk`);
    }
  }, [view, nickname]);

  const handleSubmit = useCallback(async () => {
    console.log('🚀 handleSubmit 호출됨:', {
      isSubmitting: isSubmittingRef.current,
      content: newDiary.content.trim(),
      contentLength: newDiary.content.trim().length
    });
    
    // 이미 실행 중이면 중복 호출 방지 (ref만 사용하여 클로저 문제 방지)
    if (isSubmittingRef.current) {
      console.log('⚠️ handleSubmit이 이미 실행 중입니다. 중복 호출을 방지합니다.');
      return;
    }
    
    if (!newDiary.content.trim()) {
      console.log('⚠️ 일기 내용이 비어있습니다.');
      return;
    }
    
    if (newDiary.content.trim()) {
      try {
        isSubmittingRef.current = true;
        setLoading(true);
        
        // 이미지 파일 크기 검증
        const imageFiles: File[] = [...(selectedImageFiles || [])];
        const invalidFiles = imageFiles.filter(file => !validateFileSize(file, FILE_SIZE_LIMITS.IMAGE_MAX_SIZE));
        
        if (invalidFiles.length > 0) {
          handleError(new Error(`이미지 파일이 너무 큽니다. ${formatFileSize(FILE_SIZE_LIMITS.IMAGE_MAX_SIZE)} 이하의 파일만 업로드 가능합니다.`));
          return;
        }

        // 기존 이미지 URL들 처리 (수정 모드에서 기존 이미지 유지)
        const newImageUrls: string[] = [];
        for (const imageUrl of newDiary.images || []) {
          if (!imageUrl.startsWith('blob:')) {
            // 기존 이미지 URL은 유지
            newImageUrls.push(imageUrl);
          }
        }

        const diaryData = {
          content: newDiary.content,
          emotion: newDiary.emotion,
          images: imageFiles,
          removedImageUrls: removedImageUrls,
          challengeIdx: newDiary.challengeIdx
        };

        let savedDiary: DiaryEntry;
        if (editingDiaryId) {
          // 수정 모드
          savedDiary = await updateDiary(parseInt(editingDiaryId), {
            content: diaryData.content,
            emotionIdx: getEmotionIdxFromString(diaryData.emotion),
            images: diaryData.images,
            removedImageUrls: diaryData.removedImageUrls
          } as any);
        } else {
          // 새로 작성 모드
          savedDiary = await createDiary({
            content: diaryData.content,
            emotionIdx: getEmotionIdxFromString(diaryData.emotion),
            images: diaryData.images,
            challengeIdx: diaryData.challengeIdx
          });
        }
        
        // 챌린지 타임라인에서 온 경우에만 디스크 탭으로 돌아가기
        // initialChallengeIdx가 있을 때만 디스크 탭에서 온 것으로 간주
        const wasFromChallengeTimeline = initialChallengeIdx !== undefined && onBackToDiskRef.current;
        
        if (wasFromChallengeTimeline) {
          console.log('🔍 챌린지 타임라인에서 온 일기 작성 완료:', {
            initialChallengeIdx,
            challengeIdx: newDiary.challengeIdx
          });
          
          // 상태 초기화 먼저 수행
          setNewDiary({ content: '', emotion: 'HAPPY', images: [], challengeIdx: undefined });
          setEditingDiaryId(null);
          setSelectedImageFiles?.([]);
          setRemovedImageUrls?.([]);
          
          // 챌린지 선택 초기화 (initialChallengeIdx만 초기화, challengeFromTimeline은 유지)
          onChallengeSelectedRef.current?.();
          
          // 디스크 탭으로 즉시 돌아가기 (배너 표시 + 타임라인 이동)
          // 챌린지 완료 확인은 DiskSection에서 처리
          // loadDiaries는 백그라운드에서 실행 (타임라인 이동 속도 향상)
          loadDiaries().catch(error => {
            console.error('일기 목록 새로고침 실패:', error);
          });
          
          console.log('🔄 onBackToDisk 호출');
          onBackToDiskRef.current?.(true);
          onWritingModeChangeRef.current?.(false);
          
          return;
        }
        
        // 일반적인 경우: 일기 목록 새로고침
        await loadDiaries();
        
        // 일반적인 경우: 챌린지 완료 상태 확인 (일기 작성/수정 후)
        if (newDiary.challengeIdx) {
          // 약간의 지연 후 챌린지 상태 확인 (백엔드 처리 시간 고려)
          setTimeout(async () => {
            await checkChallengeCompletion(newDiary.challengeIdx);
          }, 1000);
        }
        
        // 성공 알림 표시
        setNotificationMessage("기록이 완료되었습니다.");
        setNotificationType('success');
        setShowNotification(true);
        
        setNewDiary({ content: '', emotion: 'HAPPY', images: [], challengeIdx: undefined });
        setEditingDiaryId(null);
        setSelectedImageFiles?.([]);
        setRemovedImageUrls?.([]);
        
        // 작성/수정한 일기의 타임라인으로 이동
        setSelectedDiary(savedDiary);
        setView('detail');
        onWritingModeChangeRef.current?.(false);
        onDetailModeChangeRef.current?.(true);
      } catch (error) {
        console.error('❌ handleSubmit 에러:', error);
        handleError(error as Error);
      } finally {
        console.log('✅ handleSubmit 완료, 상태 초기화');
        setLoading(false);
        isSubmittingRef.current = false;
      }
    } else {
      console.log('⚠️ 일기 내용이 비어있어서 제출하지 않습니다.');
    }
  }, [newDiary, selectedImageFiles, removedImageUrls, editingDiaryId, initialChallengeIdx, handleError, loadDiaries, checkChallengeCompletion]);

  // 헤더 제출 기능 연결
  useEffect(() => {
    if (shouldSubmit && view === 'write' && !loading) {
      handleSubmit();
      setShouldSubmitRef.current?.(false);
    }
  }, [shouldSubmit, view, loading, handleSubmit]);

  // 뒤로가기 기능 연결
  useEffect(() => {
    if (shouldGoBack) {
      if (view === 'write' || view === 'detail') {
        handleBack();
        setShouldGoBackRef.current?.(false);
      }
    }
  }, [shouldGoBack, view, handleBack]);

  // 날짜 포맷 함수를 useMemo로 메모이제이션
  const formatDateForTitle = useCallback((date: Date): string => {
        const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        const month = months[date.getMonth()];
        const day = date.getDate();
        const getOrdinalSuffix = (day: number): string => {
          if (day >= 11 && day <= 13) return "th";
          switch (day % 10) {
            case 1: return "st";
            case 2: return "nd";
            case 3: return "rd";
            default: return "th";
          }
        };
        return `${month} ${day}${getOrdinalSuffix(day)}.`;
  }, []);

  // 헤더 제목 업데이트 - calendar일 때는 직접 관리, 나머지는 useHeaderTitle 사용
  useEffect(() => {
    if (view === 'calendar') {
      // calendar일 때는 항상 {nickname}.disk로 설정
      onTitleChangeRef.current?.(`${nickname || 'user'}.disk`);
      onWritingModeChangeRef.current?.(false);
    } else if (view === 'write') {
      // write일 때는 날짜 기반 제목
      const title = `${formatDateForTitle(new Date())} disk`;
      onTitleChangeRef.current?.(title);
      onWritingModeChangeRef.current?.(true);
    } else if (view === 'detail' && selectedDiary) {
      // detail일 때는 날짜 기반 제목
      const diaryDate = selectedDiary.date ? new Date(selectedDiary.date) : new Date();
      const title = `${formatDateForTitle(diaryDate)} disk`;
      onTitleChangeRef.current?.(title);
      onWritingModeChangeRef.current?.(false);
      onDetailModeChangeRef.current?.(true);
    }
  }, [view, selectedDiary, nickname, formatDateForTitle]);

  // 안전한 필터링된 일기 목록
  const filteredDiaries = useMemo(() => {
        if (!Array.isArray(diaries)) {
      return [];
    }
    
    const filtered = diaries.filter((diary) => {
      if (!diary || !diary.createdAt) {
        return false;
      }
      
      const matchesEmotion = selectedEmotion === '전체' || diary.emotion === selectedEmotion;
      const matchesMonth = showAllTime || isSameMonth(new Date(diary.createdAt), selectedMonth);
      
      return matchesEmotion && matchesMonth;
    });
    
    return filtered;
  }, [diaries, selectedEmotion, selectedMonth, showAllTime, isSameMonth]);

  // DiaryCalendar용 emotionIdx 기반 매핑 (공통 함수 사용)
  const simpleEmotionMapping = useMemo(() => {
    const mapping: Record<string, 'happy' | 'proud' | 'peaceful' | 'depressed' | 'annoyed' | 'furious'> = {};
    Object.entries(emotionMapping).forEach(([key, data]) => {
      mapping[key] = getPixelEmotionFromIdx(data.idx);
    });
    return mapping;
  }, []);

  const handleDateClick = useCallback(async (day: { date: Date; isCurrentMonth: boolean; diary: DiaryEntry | null }) => {
    if (day.isCurrentMonth && day.diary) {
      // 캘린더에 일기가 표시된 경우 - 바로 상세보기로 이동
      handleDiaryClick(day.diary);
    } else if (day.isCurrentMonth) {
      // 해당 날짜에 일기가 없으면 새로 작성
      setNewDiary({
        content: '',
        emotion: 'HAPPY',
        images: [],
        challengeIdx: undefined
      });
      setEditingDiaryId(null);
      setView('write');
      onWritingModeChangeRef.current?.(true);
    }
  }, [handleDiaryClick]);

      // 캘린더 화면
      if (view === 'calendar') {
        // 초기 로딩 중일 때만 스켈레톤 표시 (일기 클릭 시 로딩은 제외)
        if (!isInitialized) {
          return (
            <div className="pb-20 px-4">
              {/* 월 선택 스켈레톤 */}
              <div className="mb-4 animate-pulse">
                <div className="flex items-center justify-center gap-4 py-1">
                  <div className="w-10 h-10 bg-gray-200 rounded" />
                  <div className="w-32 h-8 bg-gray-200 rounded" />
                  <div className="w-10 h-10 bg-gray-200 rounded" />
                </div>
              </div>

              {/* 요일 헤더 스켈레톤 */}
              <div className="mb-2 animate-pulse">
                <div className="flex justify-around px-0">
                  {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <div key={i} className="w-8 h-6 bg-gray-200 rounded" />
                  ))}
                </div>
              </div>

              {/* 캘린더 그리드 스켈레톤 */}
              <div className="animate-pulse">
                {[1, 2, 3, 4, 5, 6].map((row) => (
                  <div key={row} className="flex justify-around mb-2">
                    {[1, 2, 3, 4, 5, 6, 7].map((col) => (
                      <div key={col} className="flex-1 flex flex-col items-center">
                        <div className="w-6 h-4 bg-gray-200 rounded mb-1" />
                        <div className="w-8 h-8 bg-gray-200 rounded" />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          );
        }

        return (
          <>
            {/* 알림 배너 */}
            <NotificationBanner
              isVisible={showNotification}
              message={notificationMessage}
              onClose={() => setShowNotification(false)}
              type={notificationType}
              duration={3000}
              icon={notificationType === 'success' ? '💾' : notificationType === 'info' ? '🗑️' : '💾'}
            />

            <DiaryCalendar
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              filteredDiaries={filteredDiaries}
              onDateClick={handleDateClick}
              onWriteClick={handleWriteClick}
              showMonthPicker={showMonthPicker}
              setShowMonthPicker={setShowMonthPicker}
              currentYear={currentYear}
              setCurrentYear={setCurrentYear}
              showAllTime={showAllTime}
              setShowAllTime={setShowAllTime}
              getEmotionDisplayName={getEmotionDisplayName}
              emotionMapping={simpleEmotionMapping}
            />

            {/* 에러 모달 */}
            <ErrorModal
              isOpen={showErrorModal}
              onClose={clearError}
              message={errorMessage}
            />

            {/* 챌린지 완료 모달 */}
            <ChallengeCompletionModal
              visible={showCompletionModal}
              challenge={completedChallenge}
              onClose={() => {
                setShowCompletionModal(false);
                setCompletedChallenge(null);
              }}
            />
          </>
        );
      }

  // 일기 작성 화면
  if (view === 'write') {
    return (
      <>
        {/* 알림 배너 */}
        <NotificationBanner
          isVisible={showNotification}
          message={notificationMessage}
          onClose={() => setShowNotification(false)}
          type={notificationType}
          duration={3000}
          icon={notificationType === 'success' ? '💾' : notificationType === 'info' ? '🗑️' : '💾'}
        />
        <DiaryWrite
          newDiary={newDiary}
          onDiaryChange={(field: string, value: any) => {
            if (field === 'challengeIdx' && (value === undefined || value === null)) {
              setNewDiary({...newDiary, challengeIdx: undefined});
            } else {
              setNewDiary({...newDiary, [field]: value});
            }
          }}
          myChallenges={myChallenges}
          isEditing={!!editingDiaryId}
          selectedImageFiles={selectedImageFiles}
          setSelectedImageFiles={setSelectedImageFiles}
          removedImageUrls={removedImageUrls}
          setRemovedImageUrls={setRemovedImageUrls}
          onModalChange={onModalChange}
          onSubmit={handleSubmit}
        />
        {/* 챌린지 완료 모달 - 모든 view에서 렌더링 */}
        <ChallengeCompletionModal
          visible={showCompletionModal}
          challenge={completedChallenge}
          onClose={() => {
            setShowCompletionModal(false);
            setCompletedChallenge(null);
          }}
        />
      </>
    );
  }

  // 일기 상세보기 화면
  if (view === 'detail' && selectedDiary) {
    return (
      <>
        {/* 알림 배너 */}
        <NotificationBanner
          isVisible={showNotification}
          message={notificationMessage}
          onClose={() => setShowNotification(false)}
          type={notificationType}
          duration={3000}
          icon={notificationType === 'success' ? '💾' : notificationType === 'info' ? '🗑️' : '💾'}
        />
        <DiaryDetail
          diary={selectedDiary}
          onEdit={handleEditDiary}
          onDelete={handleDeleteDiary}
          onWrite={handleWriteClick}
        />
        {/* 챌린지 완료 모달 - 모든 view에서 렌더링 */}
        <ChallengeCompletionModal
          visible={showCompletionModal}
          challenge={completedChallenge}
          onClose={() => {
            setShowCompletionModal(false);
            setCompletedChallenge(null);
          }}
        />
      </>
    );
  }

  return null;
}
