import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Alert, Keyboard } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCacheInvalidation } from '../hooks/useCacheInvalidation';
import { QUERY_KEYS } from '../constants/queryKeys';
import { DiaryCalendar } from '../components/features/diary/calendar/DiaryCalendar';
import { FAB } from '../components/common/buttons/FAB';
import { DiaryWrite } from '../components/features/diary/write/DiaryWrite';
import { DiaryDetail } from '../components/features/diary/detail/DiaryDetail';
import { ChallengeCompletionModal } from '../components/features/challenge/ChallengeCompletionModal';
import { NotificationBanner } from '../components/common/NotificationBanner';
import Header from '../layouts/Header';
import { useIsTablet } from '../hooks/useDeviceInfo';
import DesignTokens from '../constants/designTokens';

// API 연동 - 모바일에서는 native instance 사용
import { DiaryEntry, MyChallengeEntry } from "@mooddisk/types";
import { getDiaryById, getDiaryCalendar, moveToTrash, getMyChallenges, getMyChallengesBeforeDate, instance } from '@mooddisk/api';
import { getSecureItem, STORAGE_KEYS } from '../utils/secureStorage';
import { getEmotionDisplayName, emotionMapping, getEmotionIdxFromString, isSameMonth, createDiaryFormData, getPixelEmotionFromKey, formatDiaryDateForHeader, getTodayDateForHeader, formatDateForHeader, convertKoreanDateToApiFormat } from '@mooddisk/utils';
import { mapApiDiaryToDiaryEntry } from '@mooddisk/mappers';
import { useErrorHandler } from '@mooddisk/hooks';


interface DiarySectionProps {
  onWritingModeChange?: (isWriting: boolean) => void;
  onDetailModeChange?: (isDetail: boolean) => void;
  initialView?: 'calendar' | 'write' | 'detail';
  userNickname: string;
  activeTab?: string; // 현재 활성 탭
  initialChallengeIdx?: number; // 챌린지 타임라인에서 일기 작성 시 전달되는 챌린지 인덱스
  onChallengeSelected?: () => void; // 챌린지 선택 완료 후 호출되는 콜백
  onBackToDisk?: (showNotification?: boolean) => void; // 챌린지 타임라인에서 온 경우 디스크 탭으로 돌아가기 위한 콜백 (showNotification: 일기 작성 완료 알림 표시 여부)
}


const DiaryScreen: React.FC<DiarySectionProps> = ({
  onWritingModeChange,
  onDetailModeChange,
  initialView = 'calendar',
  userNickname,
  activeTab,
  initialChallengeIdx,
  onChallengeSelected,
  onBackToDisk,
}) => {

  const { handleError } = useErrorHandler();
  const isTablet = useIsTablet();

  // initialChallengeIdx가 있으면 바로 write 모드로 시작
  const [view, setView] = useState<'calendar' | 'write' | 'detail'>(
    initialChallengeIdx !== undefined ? 'write' : initialView
  );
  
  // initialChallengeIdx가 있으면 무조건 write 모드로 렌더링
  const effectiveView = useMemo(() => {
    // initialChallengeIdx가 있으면 write 모드로 강제 (탭 전환 전에도, 가장 우선순위)
    if (initialChallengeIdx !== undefined) {
      return 'write';
    }
    // view가 'calendar'이면 항상 'calendar' 반환 (일기 작성 완료 후 즉시 탭 전환을 위해)
    if (view === 'calendar') {
      return 'calendar';
    }
    // initialChallengeIdx가 없고 view가 write인 경우, activeTab이 diary로 변경된 직후가 아닌 경우에만 write 유지
    // (일반적인 일기 작성 플로우는 정상 작동)
    return view;
  }, [initialChallengeIdx, view]);

  const [selectedDiary, setSelectedDiary] = useState<DiaryEntry | null>(null);
  
  // 이전 상태 추적 (작성 버튼을 누른 위치)
  const [previousView, setPreviousView] = useState<'calendar' | 'detail'>('calendar');
  
  const queryClient = useQueryClient();
  const { invalidateAfterDiaryUpdate, invalidateAfterDiaryDelete } = useCacheInvalidation();
  
  // 헤더 상태 관리
  const [headerTitle, setHeaderTitle] = useState(`${userNickname || 'user'}.disk`);
  const [showBackButton, setShowBackButton] = useState(false);

  // userNickname이 변경될 때 헤더 제목 업데이트
  useEffect(() => {
    if (userNickname && userNickname !== '' && !showBackButton) {
      setHeaderTitle(`${userNickname}.disk`);
    }
  }, [userNickname, showBackButton]);

  const [selectedImages, setSelectedImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  
  // 월 선택 관련 상태들
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth());
  });
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [showAllTime, setShowAllTime] = useState(false);

  // React Query로 일기 데이터 프리로딩 - 전역 5분 캐시 사용
  const { data: diaries = [], isLoading: diariesLoading } = useQuery({
    queryKey: ['diaryCalendar', selectedMonth.getFullYear(), selectedMonth.getMonth() + 1],
    queryFn: async () => {
      const authToken = await getSecureItem(STORAGE_KEYS.AUTH_TOKEN);
      if (!authToken) return [];
      
      return await getDiaryCalendar(
        selectedMonth.getFullYear(),
        selectedMonth.getMonth() + 1
      );
    },
  });
  const [myChallenges, setMyChallenges] = useState<any[]>([]);
  const [allChallenges, setAllChallenges] = useState<any[]>([]); // 전체 챌린지 목록 (일기 수정 시 사용)
  const [newDiary, setNewDiary] = useState({
    content: '',
    emotion: 'HAPPY',
    images: [] as string[],
    challengeIdx: undefined as number | undefined,
    currentChallengeStatus: undefined as string | undefined,
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    locationName: undefined as string | undefined,
    address: undefined as string | undefined,
  });
  const [editingDiaryId, setEditingDiaryId] = useState<string | null>(null);
  const [selectedImageFiles, setSelectedImageFiles] = useState<any[]>([]);
  const [removedImageUrls, setRemovedImageUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 챌린지 완료 모달 상태
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completedChallenge, setCompletedChallenge] = useState<MyChallengeEntry | null>(null);
  
  // 알림 배너 상태
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'info' | 'warning' | 'error'>('success');
  
  // 타이머 정리를 위한 ref
  const challengeCheckTimerRef = useRef<NodeJS.Timeout | null>(null);
  const notificationTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // 챌린지 완료 모달이 표시될 때 키보드 닫기
  useEffect(() => {
    if (showCompletionModal) {
      Keyboard.dismiss();
    }
  }, [showCompletionModal]);
  
  // 챌린지 완료 상태 확인 함수
  const checkChallengeCompletion = async (challengeIdx?: number): Promise<boolean> => {
    if (!challengeIdx) return false;
    
    try {
      const challenges = await getMyChallenges();
      const targetChallenge = challenges.find((c: any) => c.challengeIdx === challengeIdx);
      
      if (targetChallenge && (targetChallenge.status === 'COMPLETED' || targetChallenge.status === 'FAILED')) {
        setCompletedChallenge(targetChallenge as unknown as MyChallengeEntry);
        setShowCompletionModal(true);
        return true; // 모달이 표시됨
      }
      return false; // 모달이 표시되지 않음
    } catch (error) {
      console.error('챌린지 완료 상태 확인 실패:', error);
      return false;
    }
  };
  


  // initialView가 'write'이거나 initialChallengeIdx가 있을 때 작성 모드 변경 콜백 호출 및 헤더 상태 설정
  useEffect(() => {
    if (initialView === 'write' || initialChallengeIdx !== undefined) {
      onWritingModeChange?.(true);
      // 헤더 상태 업데이트 - 일기 작성 모드
      setHeaderTitle(getTodayDateForHeader());
      setShowBackButton(true);
      // view가 아직 'write'가 아니면 설정
      if (view !== 'write') {
        setView('write');
      }
    }
  }, [initialView, initialChallengeIdx, view, onWritingModeChange]);


  // 다른 탭으로 이동할 때 알림 배너 상태 및 타이머 완전히 초기화
  useEffect(() => {
    if (activeTab !== 'diary') {
      // 타이머 즉시 정리 (다른 탭으로 이동하면 실행 중인 타이머 모두 취소)
      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
        notificationTimerRef.current = null;
      }
      // 알림 상태 완전 초기화
      setShowNotification(false);
      setNotificationMessage('');
      setNotificationType('success');
    }
  }, [activeTab]);

  // 챌린지 타임라인에서 돌아온 경우를 추적하기 위한 ref
  const cameFromChallengeTimelineRef = useRef(false);
  
  // initialChallengeIdx가 설정되면 챌린지 타임라인에서 온 것으로 표시하고 즉시 write 모드로 전환
  useEffect(() => {
    if (initialChallengeIdx !== undefined) {
      cameFromChallengeTimelineRef.current = true;
      // 타임라인이 번쩍이지 않도록 즉시 write 모드로 전환 (탭 전환 전에도)
      if (view !== 'write') {
        setPreviousView(view === 'detail' ? 'detail' : 'calendar');
        setView('write');
        // activeTab이 'diary'일 때만 헤더 상태 업데이트
        if (activeTab === 'diary') {
          onWritingModeChange?.(true);
          setHeaderTitle(getTodayDateForHeader());
          setShowBackButton(true);
        }
      }
      
      // 이전 일기 내용이 잠깐 보이지 않도록 즉시 상태 초기화 (비동기 로드 전에)
      setNewDiary({ 
        content: '', 
        emotion: 'HAPPY', 
        images: [], 
        challengeIdx: initialChallengeIdx,
        currentChallengeStatus: undefined, // 챌린지 정보 로드 후 업데이트됨
        latitude: undefined,
        longitude: undefined,
        locationName: undefined,
        address: undefined,
      });
      setEditingDiaryId(null);
      setSelectedImageFiles?.([]);
      setRemovedImageUrls?.([]);
      setSelectedImages([]);
    }
  }, [initialChallengeIdx, activeTab, view, onWritingModeChange]);
  
  // activeTab이 'diary'로 변경되고 initialChallengeIdx가 없을 때 view를 calendar로 리셋
  // 단, 챌린지 타임라인에서 돌아온 경우에만 (일반적인 일기 작성 플로우는 제외)
  useEffect(() => {
    if (activeTab === 'diary' && initialChallengeIdx === undefined && view === 'write' && cameFromChallengeTimelineRef.current) {
      // 챌린지 타임라인에서 돌아온 경우에만 calendar로 리셋
      setView('calendar');
      onWritingModeChange?.(false);
      setHeaderTitle(`${userNickname || 'user'}.disk`);
      setShowBackButton(false);
      cameFromChallengeTimelineRef.current = false; // 리셋 후 플래그 초기화
    }
  }, [activeTab, initialChallengeIdx, view, onWritingModeChange, userNickname]);

  // 내 챌린지 목록 로드 (모든 상태 포함 - 일기 수정 시 COMPLETED/FAILED 챌린지도 필요)
  const loadChallenges = useCallback(async () => {
    try {
      
      // 토큰 확인
      const authToken = await getSecureItem(STORAGE_KEYS.AUTH_TOKEN);
      if (!authToken) {
        setMyChallenges([]);
        setAllChallenges([]);
        return { activeChallenges: [], allChallenges: [] };
      }
      
      const response = await getMyChallenges();
      
      // 모든 챌린지 포함 (일기 수정 시 COMPLETED/FAILED 챌린지도 필요)
      const allChallenges = response || [];
      
      // 활성 챌린지만 필터링 (새 일기 작성용)
      const activeChallenges = allChallenges.filter((challenge: any) => 
        challenge.status === 'ACTIVE' || challenge.status === 'IN_PROGRESS'
      );
      
      
      // 새 일기 작성용으로는 활성 챌린지만 설정
      setMyChallenges(activeChallenges);
      
      // 전체 챌린지 목록은 별도 상태로 저장 (일기 수정 시 사용)
      setAllChallenges(allChallenges);
      
      return { activeChallenges, allChallenges };
    } catch (error) {
      handleError(error as any);
      setMyChallenges([]);
      setAllChallenges([]);
      return { activeChallenges: [], allChallenges: [] };
    }
  }, [handleError]);

  useEffect(() => {
    loadChallenges();
  }, [loadChallenges]);

  // initialChallengeIdx가 설정되면 챌린지 선택 (view와 상태 초기화는 이미 첫 번째 useEffect에서 완료됨)
  useEffect(() => {
    if (initialChallengeIdx !== undefined && activeTab === 'diary') {
      // 챌린지 정보 로드 및 선택 (화면 전환과 상태 초기화는 이미 첫 번째 useEffect에서 완료됨)
      const loadAndSelectChallenge = async () => {
        try {
          // 챌린지 목록을 다시 로드하여 최신 상태 확인 (챌린지 참여 직후 목록이 업데이트되지 않을 수 있음)
          const { activeChallenges, allChallenges } = await loadChallenges();
          
          // 챌린지가 로드되면 챌린지 선택
          const challengesToSearch = activeChallenges.length > 0 ? activeChallenges : allChallenges;
          // challengeIdx로 찾기
          const selectedChallenge = challengesToSearch.find((c: any) => c.challengeIdx === initialChallengeIdx);
          
          if (selectedChallenge) {
            // 챌린지 정보만 업데이트 (상태 초기화는 이미 첫 번째 useEffect에서 완료됨)
            setNewDiary(prev => ({ 
              ...prev,
              challengeIdx: selectedChallenge.challengeIdx,
              currentChallengeStatus: selectedChallenge.status 
            }));
            
            // 챌린지 선택 완료 콜백 호출
            onChallengeSelected?.();
          }
        } catch (error) {
          handleError(error as any);
        }
      };
      
      loadAndSelectChallenge();
    }
  }, [initialChallengeIdx, activeTab, onChallengeSelected, loadChallenges, handleError]);

  const handleWriteClick = () => {
    // 현재 상태를 이전 상태로 저장
    setPreviousView(view === 'detail' ? 'detail' : 'calendar');
    
    // 새 일기 작성 시 모든 상태 초기화
    setNewDiary({ 
      content: '', 
      emotion: 'HAPPY', 
      images: [], 
      challengeIdx: undefined, 
      currentChallengeStatus: undefined,
      latitude: undefined,
      longitude: undefined,
      locationName: undefined,
      address: undefined,
    });
    setEditingDiaryId(null);
    setSelectedImageFiles?.([]);
    setRemovedImageUrls?.([]);
    
    // 헤더 상태 업데이트 - 일기 작성 모드
    setHeaderTitle(getTodayDateForHeader());
    setShowBackButton(true);
    
    // 화면 전환을 즉시 수행 (디스크 탭과 동일하게)
    setView('write');
    onWritingModeChange?.(true);
    
    // 챌린지 로드는 백그라운드에서 비동기로 처리 (화면 전환을 막지 않음)
    loadChallenges().catch((error) => {
      // 챌린지 로드 실패는 조용히 처리 (이미 화면은 전환되었으므로)
      console.error('챌린지 로드 실패:', error);
    });
  };

  const handleDiaryClick = useCallback((diary: DiaryEntry) => {
    // 일기 타임라인 진입 시 이전 알림 완전히 초기화
    // (다른 탭 이동 후 다시 돌아와서 일기 선택 시 이전 알림이 나타나지 않도록)
    if (notificationTimerRef.current) {
      clearTimeout(notificationTimerRef.current);
      notificationTimerRef.current = null;
    }
    setShowNotification(false);
    setNotificationMessage('');
    
    // 헤더 상태 업데이트 - 일기 상세보기 모드
    setHeaderTitle(formatDiaryDateForHeader(diary.createdAt));
    setShowBackButton(true);
    
    setSelectedDiary(diary);
    setView('detail');
    onDetailModeChange?.(true);
  }, [onDetailModeChange]);

  const handleEditDiary = useCallback(async (diary: DiaryEntry) => {
    try {
      // 일기 수정 시에는 항상 API에서 최신 데이터를 가져옴
      let latestDiary = diary;
      
      try {
        // diary.id가 유효한지 확인하고 number로 변환
        const diaryId = diary.id ? parseInt(String(diary.id)) : null;
        if (diaryId && !isNaN(diaryId)) {
          // API에서 해당 일기의 최신 데이터 조회
          const apiDiary = await getDiaryById(diaryId);
          if (apiDiary) {
            latestDiary = apiDiary; // getDiaryById는 이미 DiaryEntry를 반환함
          }
        }
      } catch (error) {
        // 일기 최신 데이터 조회 실패, 캐시된 데이터 사용
        // API 조회 실패 시 캐시된 데이터 사용
        const cachedData = queryClient.getQueryData(['diaryCalendar', selectedMonth.getFullYear(), selectedMonth.getMonth() + 1]);
        if (cachedData) {
          const cachedDiary = (cachedData as DiaryEntry[]).find(d => d.id === diary.id);
          if (cachedDiary) {
            latestDiary = cachedDiary;
          }
        }
      }
      
      // 일기 작성 날짜 이전에 시작된 챌린지만 가져오기
      const diaryDate = new Date(latestDiary.createdAt);
      // UTC 변환 없이 로컬 시간 그대로 사용 (YYYY-MM-DDTHH:mm:ss 형식)
      const beforeDate = diaryDate.getFullYear() + '-' + 
        String(diaryDate.getMonth() + 1).padStart(2, '0') + '-' + 
        String(diaryDate.getDate()).padStart(2, '0') + 'T' + 
        String(diaryDate.getHours()).padStart(2, '0') + ':' + 
        String(diaryDate.getMinutes()).padStart(2, '0') + ':' + 
        String(diaryDate.getSeconds()).padStart(2, '0');
      
      const challengesBeforeDate = await getMyChallengesBeforeDate(beforeDate);
      
      // 현재 일기에 연결된 챌린지가 COMPLETED나 FAILED 상태인지 확인
      let currentChallengeStatus = null;
      let finalChallengesList = [...challengesBeforeDate];
      
      if (latestDiary.challengeIdx) {
        // 전체 챌린지 목록에서 현재 챌린지의 상태 확인
        
        const currentChallenge = allChallenges.find(c => c.challengeIdx === latestDiary.challengeIdx);
        if (currentChallenge) {
          currentChallengeStatus = currentChallenge.status;
          
          // 현재 챌린지가 COMPLETED나 FAILED 상태인 경우, 해당 챌린지만 표시
          if (currentChallengeStatus === 'COMPLETED' || currentChallengeStatus === 'FAILED') {
            finalChallengesList = [currentChallenge]; // 해당 챌린지만 표시
          }
        } else {
        }
      }
      
      // 일기 수정용 챌린지 목록 설정
      setMyChallenges(finalChallengesList);
      
      const challengeIdx = latestDiary.challengeIdx ?? undefined;
      
      setNewDiary({
        content: latestDiary.content,
        emotion: latestDiary.emotion,
        images: latestDiary.imageUrls || [],
        challengeIdx: challengeIdx,
        currentChallengeStatus: currentChallengeStatus,
        latitude: latestDiary.latitude,
        longitude: latestDiary.longitude,
        locationName: latestDiary.locationName,
        address: latestDiary.address,
      });
      console.log('✏️ 일기 수정 모드 진입 (성공):', {
        diaryId: latestDiary.id,
        diaryIdType: typeof latestDiary.id,
        hasContent: !!latestDiary.content,
        challengeIdx: latestDiary.challengeIdx,
      });
      setEditingDiaryId(latestDiary.id);
      
      // 일기 수정 시에는 항상 detail에서 온 것으로 간주 (타임라인에서 수정)
      setPreviousView('detail');
      
      // 헤더 상태 업데이트 - 일기 수정 모드
      setHeaderTitle(formatDiaryDateForHeader(latestDiary.createdAt));
      setShowBackButton(true);
      
      // 일기 수정 시에는 selectedImages를 초기화하지 않음 (DiaryWrite에서 처리)
      setView('write');
      onWritingModeChange?.(true);
    } catch (error) {
      // 일기 수정 시 최신 데이터 조회 실패
      // 실패 시 원본 데이터 사용
      const challengeIdx = diary.challengeIdx ?? undefined;
      setNewDiary({
        content: diary.content,
        emotion: diary.emotion,
        images: diary.imageUrls || [],
        challengeIdx: challengeIdx,
        currentChallengeStatus: undefined,
        latitude: diary.latitude,
        longitude: diary.longitude,
        locationName: diary.locationName,
        address: diary.address,
      });
      console.log('✏️ 일기 수정 모드 진입 (에러 후 fallback):', {
        diaryId: diary.id,
        diaryIdType: typeof diary.id,
        hasContent: !!diary.content,
        challengeIdx: diary.challengeIdx,
      });
      setEditingDiaryId(diary.id);
      
      // 일기 수정 시에는 항상 detail에서 온 것으로 간주 (타임라인에서 수정)
      setPreviousView('detail');
      
      // 헤더 상태 업데이트 - 일기 수정 모드 (기본 데이터)
      setHeaderTitle(formatDiaryDateForHeader(diary.createdAt));
      setShowBackButton(true);
      
      // 일기 수정 시에는 selectedImages를 초기화하지 않음 (DiaryWrite에서 처리)
      setView('write');
      onWritingModeChange?.(true);
    }
  }, [queryClient, selectedMonth, allChallenges, onWritingModeChange]);

  const handleDeleteDiary = useCallback(async (diaryId: string) => {
    try {
      // 삭제되는 일기 찾기
      const deletedDiary = selectedDiary?.id === diaryId 
        ? selectedDiary 
        : diaries.find(d => d.id.toString() === diaryId);
      
      await moveToTrash(parseInt(diaryId));
      
      // 삭제된 일기의 실제 날짜로 캐시 무효화
      if (deletedDiary) {
        // DiaryEntry.date는 "YYYY-MM-DD" 형식이므로 그대로 사용
        // 다만 한국어 형식("2025. 08. 27.")인 경우 변환 처리
        let dateStr: string;
        if (deletedDiary.date.includes('.')) {
          // 한국어 형식인 경우 변환
          dateStr = convertKoreanDateToApiFormat(deletedDiary.date);
        } else {
          // 이미 YYYY-MM-DD 형식인 경우 그대로 사용
          dateStr = deletedDiary.date;
        }
        
        // 날짜에서 년월 추출 (YYYY-MM-DD 형식에서)
        const dateParts = dateStr.split('-');
        if (dateParts.length !== 3) {
          console.error('❌ 잘못된 날짜 형식:', dateStr);
          // 에러 발생 시 fallback
          const date = new Date().toISOString().split('T')[0];
          const year = new Date().getFullYear();
          const month = new Date().getMonth() + 1;
          invalidateAfterDiaryDelete(date, year, month);
          return;
        }
        
        const year = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10);
        
        // 해당 날짜의 일기 쿼리를 직접 무효화하고 즉시 refetch
        await queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.DIARY.BY_DATE(dateStr),
        });
        
        // 명시적으로 refetch하여 타임라인 즉시 업데이트
        await queryClient.refetchQueries({
          queryKey: QUERY_KEYS.DIARY.BY_DATE(dateStr),
        });
        
        invalidateAfterDiaryDelete(dateStr, year, month);
      } else {
        // 일기를 찾지 못한 경우 (fallback)
        const date = new Date().toISOString().split('T')[0];
        const year = new Date().getFullYear();
        const month = new Date().getMonth() + 1;
        
        await queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.DIARY.BY_DATE(date),
        });
        
        await queryClient.refetchQueries({
          queryKey: QUERY_KEYS.DIARY.BY_DATE(date),
        });
        
        invalidateAfterDiaryDelete(date, year, month);
      }
      
      if (selectedDiary?.id === diaryId) {
        // 삭제된 일기가 현재 선택된 일기인 경우, 상세페이지에 머물되 선택된 일기 정보는 유지
        // setSelectedDiary(null) 제거 - 삭제된 일기 정보 유지하여 타임라인 표시
        // setView('calendar') 제거 - 상세페이지에 머물기
        // onDetailModeChange?.(false) 제거 - 상세페이지 모드 유지
      }
      
      // 휴지통 이동 알림 표시
      // 기존 알림 타이머가 있으면 정리
      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
        notificationTimerRef.current = null;
      }
      setNotificationMessage("일기가 휴지통으로 이동되었습니다.");
      setNotificationType('info');
      setShowNotification(true);
      
      // 3초 후 자동으로 알림 닫기
      notificationTimerRef.current = setTimeout(() => {
        setShowNotification(false);
        notificationTimerRef.current = null;
      }, 3000);
    } catch (error) {
      handleError(error as any);
    }
  }, [queryClient, selectedDiary, diaries, invalidateAfterDiaryDelete, handleError]);

  // 챌린지 스크린과 동일한 패턴으로 뒤로가기 처리
  const handleBackFromWrite = useCallback(() => {
    // 키보드 닫기
    Keyboard.dismiss();
    
    // 챌린지 타임라인에서 온 경우 (initialChallengeIdx가 있음)
    if (initialChallengeIdx !== undefined) {
      // 상태 초기화 (키보드 닫기 후)
      setNewDiary({ 
        content: '', 
        emotion: 'HAPPY', 
        images: [], 
        challengeIdx: undefined, 
        currentChallengeStatus: undefined,
        latitude: undefined,
        longitude: undefined,
        locationName: undefined,
        address: undefined,
      });
      setEditingDiaryId(null);
      setSelectedImageFiles?.([]);
      setRemovedImageUrls?.([]);
      setSelectedImages([]);
      // view를 previousView로 리셋 (일기 탭으로 이동할 때 이전 뷰가 표시되도록)
      setView(previousView);
      onWritingModeChange?.(false);
      // 챌린지 선택 초기화
      onChallengeSelected?.();
      // 챌린지 타임라인에서 온 플래그 리셋
      cameFromChallengeTimelineRef.current = false;
      // 디스크 탭으로 돌아가기 (알림 표시하지 않음 - 뒤로가기 버튼이므로)
      onBackToDisk?.(false);
      return;
    }
    
    // 일반적인 경우: 이전 상태로 돌아가기
    // 수정 모드 초기화
    setNewDiary({ 
      content: '', 
      emotion: 'HAPPY', 
      images: [], 
      challengeIdx: undefined, 
      currentChallengeStatus: undefined,
      latitude: undefined,
      longitude: undefined,
      locationName: undefined,
      address: undefined,
    });
    setEditingDiaryId(null);
    setSelectedImageFiles?.([]);
    setRemovedImageUrls?.([]);
    setSelectedImages([]);
    onWritingModeChange?.(false);
    setView(previousView);
    
    // 헤더 상태를 이전 상태에 맞게 설정
    if (previousView === 'detail' && selectedDiary) {
      // 타임라인에서 온 경우: 타임라인 헤더 유지
      setHeaderTitle(formatDiaryDateForHeader(selectedDiary.createdAt));
      setShowBackButton(true);
    } else {
      // 달력에서 온 경우: 기본 헤더로 리셋
      setHeaderTitle(`${userNickname || 'user'}.disk`);
      setShowBackButton(false);
    }
  }, [initialChallengeIdx, onChallengeSelected, onBackToDisk, onWritingModeChange, userNickname, previousView, selectedDiary]);

  const handleBackFromDetail = useCallback(() => {
    setView('calendar');
    onDetailModeChange?.(false);
    setSelectedDiary(null);
    
    // 헤더 상태를 기본으로 리셋
    setHeaderTitle(`${userNickname || 'user'}.disk`);
    setShowBackButton(false);
  }, [onDetailModeChange, userNickname]);

  const handleSubmit = useCallback(async () => {
    console.log('🚀 handleSubmit 호출됨:', {
      editingDiaryId,
      hasContent: !!newDiary.content.trim(),
      contentLength: newDiary.content.trim().length,
    });
    
    if (newDiary.content.trim()) {
      setIsSubmitting(true);
      console.log('✅ 내용 검증 통과, 제출 시작');
      try {
        
        const emotionIdx = getEmotionIdxFromString(newDiary.emotion);
        
        // 토큰 확인
        const token = await getSecureItem(STORAGE_KEYS.AUTH_TOKEN);
        if (token) {
        } else {
          Alert.alert('인증 오류', '로그인이 필요합니다. 다시 로그인해주세요.');
          setIsSubmitting(false);
          return;
        }
        
        // utils 패키지의 createDiaryFormData 사용
        const formDataResult = createDiaryFormData({
          content: newDiary.content,
          images: selectedImageFiles
        });
        const formData = formDataResult.formData;
        
        // emotionIdx, challengeIdx, removedImageUrls를 formData에 추가
        if (emotionIdx === null || emotionIdx === undefined) {
          console.error('❌ emotionIdx가 null입니다:', { emotion: newDiary.emotion });
          throw new Error('감정 선택이 올바르지 않습니다.');
        }
        formData.append('emotionIdx', emotionIdx.toString());
        if (newDiary.challengeIdx !== undefined && newDiary.challengeIdx !== null && !isNaN(newDiary.challengeIdx)) {
          formData.append('challengeIdx', newDiary.challengeIdx.toString());
        }
        if (removedImageUrls && removedImageUrls.length > 0) {
          formData.append('removedImageUrls', JSON.stringify(removedImageUrls));
        }
        
        // 위치 정보를 formData에 추가 (트래블로그일 때만)
        if (newDiary.latitude !== undefined && newDiary.latitude !== null && newDiary.longitude !== undefined && newDiary.longitude !== null) {
          formData.append('latitude', newDiary.latitude.toString());
          formData.append('longitude', newDiary.longitude.toString());
        }
        if (newDiary.locationName) {
          formData.append('locationName', newDiary.locationName);
        }
        if (newDiary.address) {
          formData.append('address', newDiary.address);
        }
        
        const diaryData = {
          content: newDiary.content,
          emotionIdx: emotionIdx,
          images: selectedImageFiles && selectedImageFiles.length > 0 ? selectedImageFiles : undefined,
          removedImageUrls: removedImageUrls && removedImageUrls.length > 0 ? removedImageUrls : undefined,
          challengeIdx: (newDiary.challengeIdx !== undefined && newDiary.challengeIdx !== null && !isNaN(newDiary.challengeIdx)) ? newDiary.challengeIdx : undefined
        };
        
        

        let response: DiaryEntry;
        
        if (editingDiaryId) {
          // 수정 모드 - fetch 직접 사용 (항상 multipart/form-data)
          const baseURL = instance.defaults.baseURL;
          const url = `${baseURL}/diary/${editingDiaryId}`;
          
          console.log('📤 일기 수정 요청 전송:', {
            baseURL,
            url,
            diaryId: editingDiaryId,
            diaryIdType: typeof editingDiaryId,
            challengeIdx: newDiary.challengeIdx,
            hasLocation: !!(newDiary.latitude && newDiary.longitude),
            hasContent: !!newDiary.content,
            hasImages: !!(selectedImageFiles && selectedImageFiles.length > 0),
            hasRemovedImages: !!(removedImageUrls && removedImageUrls.length > 0),
            tokenExists: !!token,
          });
          
          try {
            // 항상 multipart/form-data로 요청
            const fetchResponse = await fetch(url, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
              body: formData,
            });
          
            console.log('📥 일기 수정 응답:', {
              status: fetchResponse.status,
              statusText: fetchResponse.statusText,
              ok: fetchResponse.ok,
            });
            
            if (!fetchResponse.ok) {
              const errorText = await fetchResponse.text();
              console.error('❌ 일기 수정 실패:', {
                status: fetchResponse.status,
                statusText: fetchResponse.statusText,
                error: errorText,
                diaryId: editingDiaryId,
                challengeIdx: newDiary.challengeIdx,
              });
              throw new Error(`HTTP error! status: ${fetchResponse.status}, message: ${errorText}`);
            }
            
            const data = await fetchResponse.json();
            console.log('✅ 일기 수정 성공:', {
              diaryId: data.data?.diaryIdx,
              challengeIdx: data.data?.challengeIdx,
              timezone: data.data?.timezone,
            });
            response = mapApiDiaryToDiaryEntry(data.data);
          } catch (fetchError) {
            console.error('❌ 일기 수정 fetch 에러:', {
              error: fetchError,
              message: fetchError instanceof Error ? fetchError.message : String(fetchError),
              diaryId: editingDiaryId,
            });
            throw fetchError;
          }
          
          // 중앙화된 캐시 무효화 전략 사용
          const date = new Date().toISOString().split('T')[0];
          const year = new Date().getFullYear();
          const month = new Date().getMonth() + 1;
          invalidateAfterDiaryUpdate(date, year, month);
        } else {
          // 새로 작성 모드 - fetch 직접 사용 (항상 multipart/form-data)
          const url = `${instance.defaults.baseURL}/writediary`;
          
          // 항상 multipart/form-data로 요청
          const fetchResponse = await fetch(url, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: formData,
          });
          
          if (!fetchResponse.ok) {
            throw new Error(`HTTP error! status: ${fetchResponse.status}`);
          }
          
          const data = await fetchResponse.json();
          response = mapApiDiaryToDiaryEntry(data.data);
          
          // 중앙화된 캐시 무효화 전략 사용
          const date = new Date().toISOString().split('T')[0];
          const year = new Date().getFullYear();
          const month = new Date().getMonth() + 1;
          invalidateAfterDiaryUpdate(date, year, month);
        }
        
        // 챌린지 타임라인에서 온 경우, 즉시 탭 전환 (디스크 탭에서 챌린지 완료 확인 처리)
        if (initialChallengeIdx !== undefined) {
          // 키보드 닫기
          Keyboard.dismiss();
          // 챌린지 선택 초기화 (initialChallengeIdx를 undefined로 만듦)
          onChallengeSelected?.();
          // 디스크 탭으로 즉시 돌아가기 (배너 표시 + 타임라인 이동)
          // 챌린지 완료 확인은 DiskScreen에서 처리
          onBackToDisk?.(true);
          onWritingModeChange?.(false);
          setIsSubmitting(false);
          
          return;
        }
        
        // 일반적인 경우: 챌린지 완료 상태 확인 (일기 작성/수정 후)
        if (newDiary.challengeIdx) {
          // 기존 타이머가 있으면 정리
          if (challengeCheckTimerRef.current) {
            clearTimeout(challengeCheckTimerRef.current);
          }
          
          // 약간의 지연 후 챌린지 상태 확인 (백엔드 처리 시간 고려)
          challengeCheckTimerRef.current = setTimeout(async () => {
            await checkChallengeCompletion(newDiary.challengeIdx);
            challengeCheckTimerRef.current = null;
          }, 1000);
        }
        
        // 상태 초기화 (일반적인 경우에만 - 챌린지 타임라인에서 온 경우는 위에서 처리)
        if (initialChallengeIdx === undefined) {
          setNewDiary({ 
            content: '', 
            emotion: 'HAPPY', 
            images: [], 
            challengeIdx: undefined, 
            currentChallengeStatus: undefined,
            latitude: undefined,
            longitude: undefined,
            locationName: undefined,
            address: undefined,
          });
          setEditingDiaryId(null);
          setSelectedImageFiles?.([]);
          setSelectedImages([]);
          setRemovedImageUrls?.([]);
        }
        
        // 성공 알림 표시
        // 기존 알림 타이머가 있으면 정리
        if (notificationTimerRef.current) {
          clearTimeout(notificationTimerRef.current);
          notificationTimerRef.current = null;
        }
        setNotificationMessage("기록이 완료되었습니다.");
        setNotificationType('success');
        setShowNotification(true);
        
        // 3초 후 자동으로 알림 닫기
        notificationTimerRef.current = setTimeout(() => {
          setShowNotification(false);
          notificationTimerRef.current = null;
        }, 3000);
        
        // 챌린지 타임라인에서 온 경우, 일반적인 로직을 실행하지 않음
        // (챌린지가 있는 경우는 위의 setTimeout 콜백에서 처리, 챌린지가 없는 경우는 위에서 return)
        if (initialChallengeIdx !== undefined) {
          return;
        }
        
        // 일반적인 경우: 작성된 일기의 날짜로 이동
        const diaryDate = response.date;
        const diaryForDetail = {
          id: response.id.toString(),
          content: response.content,
          emotion: response.emotion,
          emotionIdx: response.emotionIdx,
          imageUrls: response.imageUrls || [],
          date: diaryDate,
          createdAt: response.createdAt,
          challengeIdx: response.challengeIdx
        };
        
        setSelectedDiary(diaryForDetail);
        setView('detail');
        onDetailModeChange?.(true);
        onWritingModeChange?.(false);
    } catch (error) {
      console.error('❌ handleSubmit 전체 에러:', {
        error,
        message: error instanceof Error ? error.message : String(error),
        editingDiaryId,
        stack: error instanceof Error ? error.stack : undefined,
      });
      handleError(error as any);
    } finally {
      setIsSubmitting(false);
      console.log('🏁 handleSubmit 종료 (finally)');
    }
    } else {
      console.log('⚠️ 내용이 비어있어서 제출하지 않음');
      Alert.alert('알림', '내용을 입력해주세요.');
    }
  }, [newDiary, selectedImageFiles, removedImageUrls, editingDiaryId, queryClient, onWritingModeChange, invalidateAfterDiaryUpdate, handleError, initialChallengeIdx, onChallengeSelected, onBackToDisk]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (challengeCheckTimerRef.current) {
        clearTimeout(challengeCheckTimerRef.current);
      }
      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
        notificationTimerRef.current = null;
      }
    };
  }, []);



  // 안전한 필터링된 일기 목록
  const filteredDiaries = useMemo(() => {
    if (!Array.isArray(diaries)) {
      return [];
    }
    
    const filtered = diaries.filter((diary) => {
      if (!diary || !diary.createdAt) {
        return false;
      }
      
      const matchesEmotion = true; // 감정 필터링 비활성화
      const matchesMonth = showAllTime || isSameMonth(new Date(diary.createdAt), selectedMonth);
      
      return matchesEmotion && matchesMonth;
    });
    
    return filtered;
  }, [diaries, selectedMonth, showAllTime, isSameMonth]);

  const handleDateClick = (day: { date: Date; isCurrentMonth: boolean; diary: DiaryEntry | null }) => {
    if (day.isCurrentMonth && day.diary) {
      handleDiaryClick(day.diary);
    }
    // 일기가 없는 날짜는 클릭해도 아무 동작하지 않음
  };

  // 캘린더 화면 (initialChallengeIdx가 있으면 렌더링하지 않음)
  if (effectiveView === 'calendar' && initialChallengeIdx === undefined) {
    return (
      <View style={styles.calendarContainer}>
        <Header 
          title={headerTitle}
          activeSection="diary"
          isDetailMode={false}
          showBackButton={showBackButton}
          onBack={showBackButton ? handleBackFromWrite : undefined}
        />
        
        <DiaryCalendar
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          filteredDiaries={filteredDiaries}
          onDateClick={handleDateClick}
          showMonthPicker={showMonthPicker}
          setShowMonthPicker={setShowMonthPicker}
          currentYear={currentYear}
          setCurrentYear={setCurrentYear}
          showAllTime={showAllTime}
          setShowAllTime={setShowAllTime}
          getEmotionDisplayName={getEmotionDisplayName}
          emotionMapping={Object.keys(emotionMapping).reduce((acc, key) => {
            acc[key] = getPixelEmotionFromKey(key);
            return acc;
          }, {} as { [key: string]: 'happy' | 'proud' | 'peaceful' | 'depressed' | 'annoyed' | 'furious' })}
        />
        <FAB
          onPress={handleWriteClick}
          icon="plus"
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
      </View>
    );
  }

  // 일기 작성 화면 (initialChallengeIdx가 있고 view가 'write'일 때만 렌더링)
  if ((effectiveView === 'write' || initialChallengeIdx !== undefined) && view === 'write') {
    return (
      <View style={{ flex: 1 }}>
        <Header 
          title={headerTitle}
          activeSection="diary"
          isDetailMode={true}
          showBackButton={showBackButton}
          onBack={handleBackFromWrite}
        />
        <DiaryWrite
          newDiary={newDiary}
          onDiaryChange={(field: string, value: any) => {
            if (field === 'challengeIdx') {
              if (value === undefined || value === null || isNaN(value)) {
                setNewDiary(prev => ({...prev, challengeIdx: undefined}));
              } else {
                setNewDiary(prev => ({...prev, challengeIdx: value}));
              }
            } else {
              setNewDiary(prev => ({...prev, [field]: value}));
            }
          }}
          myChallenges={myChallenges}
          isEditing={!!editingDiaryId}
          selectedImageFiles={selectedImageFiles}
          setSelectedImageFiles={setSelectedImageFiles}
          removedImageUrls={removedImageUrls}
          setRemovedImageUrls={setRemovedImageUrls}
          onSubmit={handleSubmit}
          selectedImages={selectedImages}
          setSelectedImages={setSelectedImages}
          hideToolbar={showCompletionModal}
          isSubmitting={isSubmitting}
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
      </View>
    );
  }

  // 일기 상세보기 화면 (initialChallengeIdx가 있으면 렌더링하지 않음)
  if (effectiveView === 'detail' && view === 'detail' && selectedDiary && initialChallengeIdx === undefined) {
    return (
      <View style={{ flex: 1 }}>
        <Header 
          title={headerTitle}
          activeSection="diary"
          isDetailMode={true}
          showBackButton={showBackButton}
          onBack={handleBackFromDetail}
        />
        {/* 알림 배너 - handleDiaryClick으로 새 일기 선택 시 알림이 나타나지 않도록 key 사용 */}
        <NotificationBanner
          key={`notification-${selectedDiary?.id || 'none'}-${activeTab}`}
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
          icon={notificationType === 'success' ? '💾' : notificationType === 'info' ? '🗑️' : '💾'}
        />
        <DiaryDetail
          diary={selectedDiary}
          allDiaries={diaries}
          onEdit={handleEditDiary}
          onDelete={handleDeleteDiary}
        />
        
        {/* FAB 버튼 - 일기 작성 */}
        <FAB
          onPress={handleWriteClick}
          icon="plus"
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
      </View>
    );
  }

  return (
    <View style={styles.loadingContainer}>
      
      {/* 챌린지 완료 모달 */}
      <ChallengeCompletionModal
        visible={showCompletionModal}
        challenge={completedChallenge}
        onClose={() => {
          setShowCompletionModal(false);
          setCompletedChallenge(null);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  calendarContainer: {
    flex: 1,
    backgroundColor: DesignTokens.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: DesignTokens.colors.background,
  },
});

export default React.memo(DiaryScreen);
