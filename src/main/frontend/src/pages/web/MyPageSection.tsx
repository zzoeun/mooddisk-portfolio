import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useUser } from '../../context/UserContext';
import { useAuth } from '../../context/AuthContext';
import { updateUserInfo, getUserInfo, getUserStats, getTrashDiaries, deleteUser } from '@mooddisk/api';
import { 
  ProfileSection, 
  AccountSection,
  ActivityInfo,
  SettingsInfo,
} from '../../components/features/mypage';
import DesignTokens from '../../constants/designTokens';

interface MyPageSectionProps {
  onTitleChange?: (title: string) => void;
  onSectionChange?: (section: string) => void;
}

export default function MyPageSection({ onTitleChange, onSectionChange }: MyPageSectionProps) {
  const { userIdx, nickname, profileImage, setNickname, setProfileImage, clearUser } = useUser();
  const { logout } = useAuth();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editingNickname, setEditingNickname] = useState('');
  const [editingBio, setEditingBio] = useState('');
  const [editingProfileImage, setEditingProfileImage] = useState<string>(''); // 미리보기용 Data URL
  const [editingProfileImageFile, setEditingProfileImageFile] = useState<File | null>(null); // 실제 업로드할 File 객체
  const [userBio, setUserBio] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [userStats, setUserStats] = useState<any>(null);
  const [trashDiaries, setTrashDiaries] = useState<any[]>([]);

  // 헤더 제목 설정 - useRef로 안정화하여 불필요한 호출 방지
  const onTitleChangeRef = useRef(onTitleChange);
  useEffect(() => {
    onTitleChangeRef.current = onTitleChange;
  }, [onTitleChange]);

  useEffect(() => {
    const title = `${nickname || 'user'}.disk`;
    onTitleChangeRef.current?.(title);
  }, [nickname]);

  // 사용자 정보 및 통계 로드 - 병렬 처리로 성능 최적화
  useEffect(() => {
    const loadUserData = async () => {
      if (!userIdx) return;
      
      setLoading(true);
      try {
        // 병렬로 모든 데이터 로드 (성능 최적화)
        const [userInfoResponse, statsResponse, trashResponse] = await Promise.all([
          getUserInfo(userIdx).catch(err => {
            console.error('사용자 정보 로드 실패:', err);
            return null;
          }),
          getUserStats(userIdx).catch(err => {
            console.error('사용자 통계 로드 실패:', err);
            return null;
          }),
          getTrashDiaries().catch(err => {
            console.error('휴지통 일기 로드 실패:', err);
            return [];
          })
        ]);

        // 사용자 정보 설정
        if (userInfoResponse?.data) {
          setUserBio(userInfoResponse.data.bio || '첫 페이지는 언제나 오늘부터');
        } else {
          setUserBio('첫 페이지는 언제나 오늘부터');
        }

        // 사용자 통계 설정
        if (statsResponse) {
        setUserStats(statsResponse);
        }

        // 휴지통 일기 설정
        setTrashDiaries(trashResponse || []);
      } catch (error) {
        console.error('사용자 데이터 로드 실패:', error);
        setUserBio('첫 페이지는 언제나 오늘부터');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [userIdx]);

  // 편집 모드가 활성화될 때 현재 값으로 초기화
  useEffect(() => {
    if (isEditingProfile) {
      setEditingNickname(nickname || '');
      setEditingBio(userBio);
      setEditingProfileImage(profileImage || '');
      setEditingProfileImageFile(null); // 편집 모드 시작 시 File 객체 초기화
    }
  }, [isEditingProfile, nickname, userBio, profileImage]);

  const handleTrashClick = useCallback(() => {
    // 휴지통 섹션으로 이동
    onSectionChange?.('trash');
  }, [onSectionChange]);

  const handleSaveProfile = useCallback(async () => {
    if (!userIdx) return;

    try {
      // File 객체가 있으면 File을 전달, 없으면 null 전달 (기존 이미지 유지)
      const response = await updateUserInfo(userIdx, {
        nickname: editingNickname,
        bio: editingBio,
        profileImage: editingProfileImageFile || null
      });

      if (response?.data) {
        // 성공 시 UserContext 업데이트
        setNickname(editingNickname);
        setUserBio(editingBio);
        
        // 프로필 이미지가 변경된 경우에만 업데이트
        // File 객체가 있으면 새로운 이미지이므로 미리보기 URL 사용
        // File 객체가 없으면 기존 이미지 유지
        if (editingProfileImageFile && editingProfileImage && editingProfileImage !== profileImage) {
          setProfileImage(editingProfileImage);
        }
        
        setIsEditingProfile(false);
        
        // 헤더 제목 업데이트
        onTitleChangeRef.current?.(`${editingNickname}.disk`);
        
        alert('프로필이 업데이트되었습니다.');
      }
    } catch (error) {
      console.error('프로필 업데이트 실패:', error);
      alert('프로필 업데이트에 실패했습니다. 다시 시도해주세요.');
    }
  }, [userIdx, editingNickname, editingBio, editingProfileImageFile, editingProfileImage, profileImage, setNickname, setProfileImage]);

  const handleCancelEdit = useCallback(() => {
    setIsEditingProfile(false);
    setEditingNickname(nickname || '');
    setEditingBio(userBio);
    setEditingProfileImage(profileImage || '');
    setEditingProfileImageFile(null); // 취소 시 File 객체도 초기화
  }, [nickname, userBio, profileImage]);

  const handleImageChange = useCallback(() => {
    // 웹에서는 파일 입력을 통해 이미지 선택
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // File 객체 저장 (실제 업로드용)
        setEditingProfileImageFile(file);
        
        // 미리보기용 Data URL 생성
        const reader = new FileReader();
        reader.onload = (event) => {
          setEditingProfileImage(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }, []);

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;
    
    const confirmed = window.confirm('정말 로그아웃 하시겠습니까?');
    if (!confirmed) return;

    try {
      setIsLoggingOut(true);
      
      // AuthContext에서 로그아웃 처리 (토큰 정리 및 서버 요청 포함)
      await logout();
      
      // UserContext에서 사용자 정보 초기화
      clearUser();
      
      // 로그인 페이지로 이동
      window.location.href = '/login';
    } catch (error) {
      console.error('로그아웃 실패:', error);
      alert('로그아웃 중 오류가 발생했습니다.');
    } finally {
      setIsLoggingOut(false);
    }
  }, [isLoggingOut, logout, clearUser]);

  const handleWithdraw = useCallback(async () => {
    if (isWithdrawing) return;
    
    const confirmed = window.confirm('회원탈퇴를 진행하시겠습니까?\n30일이 지나면 모든 기록이 삭제됩니다.');
    if (!confirmed) return;

    try {
      setIsWithdrawing(true);
      
      if (userIdx) {
        await deleteUser(userIdx);
      }
      
      alert('회원탈퇴가 처리되었습니다.\n30일 이내에 재로그인 시, 모든 기록이 복구됩니다.\n30일 이후에는 모든 기록이 영구 삭제됩니다.');
      
      // 로그아웃 처리
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      
      // 로그인 페이지로 이동
      window.location.href = '/login';
    } catch (error) {
      alert('회원탈퇴 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsWithdrawing(false);
    }
  }, [isWithdrawing, userIdx]);

  if (loading) {
    return (
      <div className="pb-20 px-4">
        {/* 프로필 섹션 스켈레톤 */}
        <div className="mb-6 animate-pulse">
          <div 
            className="p-4"
            style={{
              backgroundColor: DesignTokens.colors.background,
              border: `${DesignTokens.borders.width} solid ${DesignTokens.colors.border}`,
            }}
          >
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 bg-gray-200 rounded" />
              <div className="flex-1">
                <div className="h-5 bg-gray-200 rounded mb-2" style={{ width: '120px' }} />
                <div className="h-4 bg-gray-200 rounded" style={{ width: '80%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* 활동 정보 스켈레톤 */}
        <div className="mb-6 animate-pulse">
          <div 
            className="p-4"
            style={{
              backgroundColor: DesignTokens.colors.background,
              border: `${DesignTokens.borders.width} solid ${DesignTokens.colors.border}`,
            }}
          >
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-3 bg-gray-100 rounded">
                  <div className="h-4 bg-gray-200 rounded mb-2" style={{ width: '60%' }} />
                  <div className="h-6 bg-gray-200 rounded" style={{ width: '80%' }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 설정 섹션 스켈레톤 */}
        <div className="mb-6 animate-pulse">
          <div 
            className="p-4"
            style={{
              backgroundColor: DesignTokens.colors.background,
              border: `${DesignTokens.borders.width} solid ${DesignTokens.colors.border}`,
            }}
          >
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-10 bg-gray-200 rounded" />
              ))}
            </div>
          </div>
        </div>

        {/* 계정 관리 섹션 스켈레톤 */}
        <div className="mb-6 animate-pulse">
          <div className="flex justify-end gap-2">
            <div className="h-10 bg-gray-200 rounded" style={{ width: '100px' }} />
            <div className="h-10 bg-gray-200 rounded" style={{ width: '100px' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 min-h-screen">
      {/* 프로필 섹션 */}
      <div className="mb-6">
        <ProfileSection
          userNickname={nickname || ''}
          userBio={userBio}
          profileImage={profileImage || ''}
          isEditingProfile={isEditingProfile}
          editingNickname={editingNickname}
          editingBio={editingBio}
          editingProfileImage={editingProfileImage}
          onNicknameChange={setEditingNickname}
          onBioChange={setEditingBio}
          onImageChange={handleImageChange}
          onSave={isEditingProfile ? handleSaveProfile : () => setIsEditingProfile(true)}
          onCancel={handleCancelEdit}
        />
      </div>

      {/* 활동 정보 */}
      {userIdx && (
        <div className="mb-6">
          <ActivityInfo
            userIdx={userIdx}
            userStats={userStats}
            trashDiaries={trashDiaries}
            onTrashClick={handleTrashClick}
          />
        </div>
      )}

      {/* 설정 섹션 */}
      <div className="mb-6">
        <SettingsInfo />
      </div>

      {/* 계정 관리 섹션 */}
      <div className="mb-6">
        <AccountSection
          isWithdrawing={isWithdrawing}
          isLoggingOut={isLoggingOut}
          onWithdraw={handleWithdraw}
          onLogout={handleLogout}
        />
      </div>
    </div>
  );
}
