import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { updateUserInfo, deleteUser } from '@mooddisk/api';
import { ApiUserInfo } from '@mooddisk/types';
import { useQueryClient } from '@tanstack/react-query';
import { useUserInfo, useUserStats, useTrashDiaries } from '../hooks/useQueries';
import { useCacheInvalidation } from '../hooks/useCacheInvalidation';
import { 
  ProfileSection, 
  AccountSection,
  ActivityInfo,
  SettingsInfo,
  TrashModal
} from '../components/features/mypage';
import Header from '../layouts/Header';
import { LoadingOverlay } from '../components/common/loading/LoadingOverlay';
import DesignTokens from '../constants/designTokens';
import { useIsTablet } from '../hooks/useDeviceInfo';
import { getMaxWidth } from '../utils/deviceUtils';

interface MyPageScreenProps {
  userNickname: string;
  activeTab?: string; // 현재 활성 탭
  updateHeaderTitle?: (nickname: string) => void;
  updateUserNickname?: (nickname: string) => void;
}

const MyPageScreen: React.FC<MyPageScreenProps> = ({ userNickname, activeTab, updateHeaderTitle, updateUserNickname }) => {
  const { user: authUser, logout } = useAuth();
  const queryClient = useQueryClient();
  const { invalidateAfterUserUpdate } = useCacheInvalidation();
  const isTablet = useIsTablet();
  
  // 헤더 상태 관리
  const [headerTitle, setHeaderTitle] = useState(`${userNickname || 'user'}.disk`);
  const [showBackButton, setShowBackButton] = useState(false);

  // userNickname이 변경될 때 헤더 제목 업데이트
  useEffect(() => {
    if (userNickname && userNickname !== '' && !showBackButton) {
      setHeaderTitle(`${userNickname}.disk`);
    }
  }, [userNickname, showBackButton]);

  // activeTab이 변경될 때 헤더 상태 및 편집 상태 리셋 (다른 탭에서 돌아올 때)
  useEffect(() => {
    if (activeTab !== 'mypage') {
      // 다른 탭으로 이동할 때 헤더 상태 리셋
      setHeaderTitle(`${userNickname || 'user'}.disk`);
      setShowBackButton(false);
      
      // 편집 상태 초기화
      setIsEditingProfile(false);
      setEditingNickname('');
      setEditingBio('');
      setEditingProfileImage('');
    }
  }, [activeTab, userNickname]);

  
  
  // AuthContext에서 직접 userId 가져오기 (atob 사용 안함)
  const userId = authUser?.id;
  const [localUserNickname, setLocalUserNickname] = useState<string>('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editingNickname, setEditingNickname] = useState('');
  const [editingBio, setEditingBio] = useState('');
  const [editingProfileImage, setEditingProfileImage] = useState<string>('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [showTrashModal, setShowTrashModal] = useState(false);

  const parsedUserId = useMemo(() => {
    // AuthContext에서 직접 가져온 userId 사용
    return userId ? parseInt(userId.toString()) : null;
  }, [userId]);
  const handleCloseTrashModal = useCallback(() => setShowTrashModal(false), []);

  // React Query로 사용자 정보 캐시 - 중앙화된 훅 사용
  const { data: userInfo, isLoading: userInfoLoading, error, refetch: refetchUserInfo } = useUserInfo(parsedUserId);
  
  // ActivityInfo에서 사용하는 쿼리들 - 통합 로딩 상태 관리
  const { data: userStats, isLoading: statsLoading } = useUserStats(parsedUserId);
  const { data: trashDiaries = [], isLoading: trashLoading } = useTrashDiaries();
  
  // 전체 로딩 상태 - 세 가지 컴포넌트 중 하나라도 로딩 중이면 표시
  const isLoading = userInfoLoading || statsLoading || trashLoading;
  
  // 사용자 닉네임 정보
  const userNicknameFromApi = useMemo(() => {
    // API 응답 구조에 맞게 닉네임 추출
    const nickname = (userInfo as any)?.data?.data?.nickname || (userInfo as any)?.data?.nickname || userInfo?.nickname;
    return nickname || localUserNickname || userNickname || '사용자';
  }, [userInfo, localUserNickname, userNickname]);

  // 사용자 바이오 정보
  const userBio = useMemo(() => {
    // API 응답 구조: userInfo.data.data.bio
    const bio = (userInfo as any)?.data?.data?.bio || (userInfo as any)?.data?.bio || userInfo?.bio;
    return bio || '첫 페이지는 언제나 오늘부터';
  }, [userInfo]);


  // JWT 토큰에서 사용자 ID와 닉네임 추출 - React Query로 최적화
  useEffect(() => {
    let mounted = true;
    
    // AuthContext에서 직접 사용자 정보 가져오기 (JWT 디코딩 불필요)
    if (authUser?.id && authUser?.name) {
      setLocalUserNickname(authUser.name);
    }
    
    return () => {
      mounted = false;
    };
  }, []);

  // 편집 모드가 활성화될 때 현재 값으로 초기화
  useEffect(() => {
    if (isEditingProfile && userInfo) {
      // API 응답 구조에 맞게 데이터 접근
      const nickname = (userInfo as any)?.data?.data?.nickname || (userInfo as any)?.data?.nickname || userInfo?.nickname || localUserNickname || '';
      const bio = (userInfo as any)?.data?.data?.bio || (userInfo as any)?.data?.bio || userInfo?.bio || '';
      const profileImage = (userInfo as any)?.data?.data?.profileImage || (userInfo as any)?.data?.profileImage || userInfo?.profileImage || '';
      
      setEditingNickname(nickname);
      setEditingBio(bio);
      setEditingProfileImage(profileImage);
    }
  }, [isEditingProfile, userInfo, localUserNickname]);

  const handleTrashClick = useCallback(() => {
    setShowTrashModal(true);
  }, []);

  const handleProfileEdit = useCallback(() => {
    if (isEditingProfile) {
      // 편집 완료 - 저장
      handleSaveProfile();
    } else {
      // 편집 모드 시작
      setIsEditingProfile(true);
    }
  }, [isEditingProfile]);

  const handleSaveProfile = useCallback(async () => {
    if (!userId) return;

    try {
      const userIdx = parseInt(userId);
      
      const response = await updateUserInfo(userIdx, {
        nickname: editingNickname,
        bio: editingBio,
        profileImage: editingProfileImage
      });


      if (response) {
        
        // 체계적인 캐시 무효화
        invalidateAfterUserUpdate(userIdx);
        
        // 모든 가능한 쿼리 키에 대해 캐시 업데이트
        const queryKeys = [
          ['userInfo', userIdx],
          ['userInfo'],
          ['mainUserInfo', userIdx],
          ['mainUserInfo']
        ];
        
        queryKeys.forEach(queryKey => {
          queryClient.setQueryData(queryKey, (oldData: any) => {
            if (!oldData) return oldData;
            
            
            // API 응답 구조에 맞게 업데이트
            const updatedData = JSON.parse(JSON.stringify(oldData)); // deep clone
            
            // 여러 가능한 구조에 대해 업데이트
            if (updatedData.data?.data) {
              updatedData.data.data.nickname = editingNickname;
              updatedData.data.data.bio = editingBio;
              updatedData.data.data.profileImage = editingProfileImage;
            } else if (updatedData.data) {
              updatedData.data.nickname = editingNickname;
              updatedData.data.bio = editingBio;
              updatedData.data.profileImage = editingProfileImage;
            } else {
              updatedData.nickname = editingNickname;
              updatedData.bio = editingBio;
              updatedData.profileImage = editingProfileImage;
            }
            
            
            return updatedData;
          });
        });
        
        // 강제로 쿼리 다시 실행
        queryClient.refetchQueries({ queryKey: ['userInfo', userIdx] });
        queryClient.refetchQueries({ queryKey: ['userInfo'] });
        
        // 헤더 제목 즉시 업데이트
        if (updateHeaderTitle) {
          updateHeaderTitle(editingNickname);
        }
        
        // MainScreen의 userNickname 상태도 업데이트
        if (updateUserNickname) {
          updateUserNickname(editingNickname);
        }
        
        // MyPageScreen 자체 헤더도 업데이트
        setHeaderTitle(`${editingNickname}.disk`);
        
        setIsEditingProfile(false);
        
        Alert.alert('성공', '프로필이 업데이트되었습니다.');
      }
    } catch (error) {
      console.error('프로필 업데이트 실패:', error);
      Alert.alert('실패', '프로필 업데이트에 실패했습니다. 다시 시도해주세요.');
    }
  }, [userId, editingNickname, editingBio, editingProfileImage, queryClient, invalidateAfterUserUpdate]);

  const handleCancelEdit = useCallback(() => {
    setIsEditingProfile(false);
    if (userInfo) {
      // API 응답 구조에 맞게 데이터 접근
      const nickname = (userInfo as any)?.data?.data?.nickname || (userInfo as any)?.data?.nickname || userInfo?.nickname || localUserNickname || '';
      const bio = (userInfo as any)?.data?.data?.bio || (userInfo as any)?.data?.bio || userInfo?.bio || '';
      const profileImage = (userInfo as any)?.data?.data?.profileImage || (userInfo as any)?.data?.profileImage || userInfo?.profileImage || '';
      
      setEditingNickname(nickname);
      setEditingBio(bio);
      setEditingProfileImage(profileImage);
    }
  }, [userInfo, localUserNickname]);

  const handleImageChange = useCallback(async () => {
    try {
      // 권한 상태 확인
      const permissionResult = await ImagePicker.getMediaLibraryPermissionsAsync();
      
      // 권한이 없거나 거부된 경우 권한 요청
      if (!permissionResult.granted) {
        // 권한 요청 (iOS 시스템 팝업 표시)
        const requestResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (!requestResult.granted) {
          // iOS에서 권한이 영구적으로 거부된 경우
          if (Platform.OS === 'ios' && !requestResult.canAskAgain) {
            Alert.alert(
              '권한 필요',
              '갤러리 접근 권한이 필요합니다. 설정에서 권한을 허용해주세요.',
              [
                { text: '취소', style: 'cancel' },
                { text: '설정으로 이동', onPress: () => Linking.openSettings() }
              ]
            );
          } else {
            Alert.alert('권한 필요', '갤러리 접근 권한이 필요합니다.');
          }
          return;
        }
      }

      // 갤러리에서 직접 이미지 선택
      pickImageFromGallery();
    } catch (error) {
      console.error('이미지 선택 오류:', error);
      Alert.alert('오류', '이미지 선택 중 오류가 발생했습니다.');
    }
  }, []);

  const pickImageFromGallery = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setEditingProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('갤러리에서 이미지 선택 오류:', error);
      Alert.alert('오류', '이미지 선택 중 오류가 발생했습니다.');
    }
  }, []);


  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;
    
    try {
      setIsLoggingOut(true);
      
      Alert.alert(
        '로그아웃',
        '정말 로그아웃 하시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          { 
            text: '로그아웃', 
            style: 'destructive',
            onPress: async () => {
              // React Query 캐시 초기화 (사용자별 데이터 분리)
              queryClient.clear();
              console.log('🧹 React Query 캐시 초기화 완료');
              
              await logout();
            }
          }
        ]
      );
      
    } catch (error) {
      Alert.alert('오류', '로그아웃 중 오류가 발생했습니다.');
    } finally {
      setIsLoggingOut(false);
    }
  }, [isLoggingOut, logout, queryClient]);

  const handleWithdraw = useCallback(async () => {
    if (isWithdrawing) return;
    
    try {
      setIsWithdrawing(true);
      
      Alert.alert(
        '회원탈퇴를 진행하시겠습니까?',
        '30일이 지나면 모든 기록이 삭제됩니다.',
        [
          { text: '취소', style: 'cancel' },
          { 
            text: '탈퇴', 
            style: 'destructive',
            onPress: async () => {
              try {
                if (userId) {
                  await deleteUser(parseInt(userId));
                }
                Alert.alert(
                  '회원탈퇴가 처리되었습니다.', 
                  '30일 이내에 재로그인 시, 모든 기록이 복구됩니다.\n30일 이후에는 모든 기록이 영구 삭제됩니다.',
                  [
                    {
                      text: '확인',
                      onPress: async () => {
                        try {
                          // React Query 캐시 초기화
                          queryClient.clear();
                          
                          // 보안 저장소에서 모든 데이터 삭제
                          const { clearAllSecureItems } = require('../utils/secureStorage');
                          await clearAllSecureItems();
                          
                          // 로그아웃 처리 (자동으로 로그인 화면으로 이동)
                          await logout();
                        } catch (error) {
                          // 오류가 발생해도 로그아웃은 진행
                          await logout();
                        }
                      }
                    }
                  ]
                );
              } catch (error) {
                Alert.alert('오류', '회원탈퇴 중 오류가 발생했습니다. 다시 시도해주세요.');
              }
            }
          }
        ]
      );
      
    } catch (error) {
      Alert.alert('오류', '회원탈퇴 중 오류가 발생했습니다.');
    } finally {
      setIsWithdrawing(false);
    }
  }, [isWithdrawing, userId, logout]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Header 
          title={headerTitle}
          activeSection="mypage"
          isDetailMode={false}
          showBackButton={showBackButton}
        />
        <LoadingOverlay />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header 
        title={headerTitle}
        activeSection="mypage"
        isDetailMode={false}
        showBackButton={showBackButton}
      />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 프로필 섹션 */}
        <View style={styles.sectionContainer}>
          <ProfileSection
            userInfo={userInfo}
            userNickname={userNicknameFromApi}
            userBio={userBio}
            isEditingProfile={isEditingProfile}
            editingNickname={editingNickname}
            editingBio={editingBio}
            editingProfileImage={editingProfileImage}
            onNicknameChange={setEditingNickname}
            onBioChange={setEditingBio}
            onImageChange={handleImageChange}
            onEditToggle={handleProfileEdit}
            onSave={handleSaveProfile}
            onCancel={handleCancelEdit}
          />
        </View>

        {/* 활동 정보 */}
        {parsedUserId && (
          <View style={styles.sectionContainer}>
            <ActivityInfo
              userIdx={parsedUserId}
              userStats={userStats}
              trashDiaries={trashDiaries}
              onTrashClick={handleTrashClick}
            />
          </View>
        )}

        {/* 설정 섹션 */}
        <View style={styles.sectionContainer}>
          <SettingsInfo />
        </View>

        {/* 계정 관리 섹션 */}
        <View style={styles.sectionContainer}>
          <AccountSection
            isWithdrawing={isWithdrawing}
            isLoggingOut={isLoggingOut}
            onWithdraw={handleWithdraw}
            onLogout={handleLogout}
          />
        </View>
      </ScrollView>
      
      {/* 휴지통 모달 */}
      <TrashModal
        visible={showTrashModal}
        onClose={handleCloseTrashModal}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignTokens.colors.background,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionContainer: {
    marginBottom: DesignTokens.spacing.sectionMargin,
  },
});

// MyPageScreen은 이미 ScrollView 내부에서 콘텐츠를 렌더링하므로 추가 스타일링 불필요

export default MyPageScreen;