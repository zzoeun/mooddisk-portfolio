import React from 'react';
import DesignTokens from '../../../constants/designTokens';
import { DEFAULT_IMAGES } from '../../../constants/images';

interface ProfileSectionProps {
  userNickname: string;
  userBio: string;
  profileImage?: string;
  isEditingProfile: boolean;
  editingNickname: string;
  editingBio: string;
  editingProfileImage?: string;
  onNicknameChange: (text: string) => void;
  onBioChange: (text: string) => void;
  onImageChange?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({
  userNickname,
  userBio,
  profileImage,
  isEditingProfile,
  editingNickname,
  editingBio,
  editingProfileImage,
  onNicknameChange,
  onBioChange,
  onImageChange,
  onSave,
  onCancel,
}) => {
  return (
    <div 
      className="p-4 mx-4 relative"
      style={{
        backgroundColor: DesignTokens.colors.background,
        border: `${DesignTokens.borders.width} solid ${DesignTokens.colors.border}`,
      }}
    >
      {/* 우측 상단 편집 버튼 */}
      <div className="absolute top-2 right-4 z-10">
        {isEditingProfile ? (
          <div className="flex gap-2">
            <button 
              onClick={onCancel}
              className="px-3 py-1.5 font-bold text-xs uppercase"
              style={{
                backgroundColor: DesignTokens.colors.alert,
                border: `2px solid ${DesignTokens.colors.text}`,
                color: DesignTokens.colors.text,
              }}
            >
              취소
            </button>
            <button 
              onClick={onSave}
              className="px-3 py-1.5 font-bold text-xs uppercase"
              style={{
                backgroundColor: DesignTokens.colors.alert,
                border: `2px solid ${DesignTokens.colors.text}`,
                color: DesignTokens.colors.text,
              }}
            >
              저장
            </button>
          </div>
        ) : (
          <button 
            onClick={() => onSave?.()}
            className="px-3 py-1.5 font-bold text-xs uppercase"
            style={{
              backgroundColor: DesignTokens.colors.alert,
              border: `2px solid ${DesignTokens.colors.text}`,
              color: DesignTokens.colors.text,
            }}
          >
            편집
          </button>
        )}
      </div>

      {/* 프로필 컨텐츠 - 좌우 배치 */}
      <div className="flex items-start gap-4">
        {/* 좌측: 아바타 */}
        <div className="flex flex-col items-center">
          <div 
            className="w-[100px] h-[100px] overflow-hidden relative"
            style={{
              border: `4px solid ${DesignTokens.colors.text}`,
            }}
          >
            <img 
              src={editingProfileImage || profileImage || DEFAULT_IMAGES.PROFILE} 
              alt="프로필 이미지" 
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = DEFAULT_IMAGES.PROFILE;
              }}
            />
          </div>
          {isEditingProfile && (
            <button 
              onClick={onImageChange}
              className="mt-1.5 px-2 py-1 text-xs font-bold uppercase"
              style={{ color: DesignTokens.colors.primary }}
            >
              이미지 변경
            </button>
          )}
        </div>

        {/* 우측: 사용자 정보 */}
        <div className="flex-1 flex flex-col justify-center">
          {/* 닉네임 */}
          <div className="mb-3">
            {isEditingProfile ? (
              <input
                type="text"
                value={editingNickname}
                onChange={(e) => onNicknameChange(e.target.value)}
                className="text-base font-bold uppercase px-2 py-1 w-full"
                placeholder="닉네임을 입력하세요"
                style={{
                  color: DesignTokens.colors.primary,
                  borderBottom: `2px solid ${DesignTokens.colors.primary}`,
                  backgroundColor: 'transparent',
                }}
              />
            ) : (
              <h3 
                className="text-base font-bold uppercase text-left"
                style={{ color: DesignTokens.colors.primary }}
              >
                {userNickname || '사용자'}
              </h3>
            )}
          </div>

          {/* 바이오 */}
          <div className="mb-2">
            {isEditingProfile ? (
              <textarea
                value={editingBio}
                onChange={(e) => onBioChange(e.target.value)}
                className="text-sm font-bold px-3 py-2 w-full min-h-[32px] resize-none"
                placeholder="자신을 소개해주세요"
                rows={2}
                style={{
                  color: DesignTokens.colors.text,
                  backgroundColor: DesignTokens.colors.accent,
                  border: `2px solid ${DesignTokens.colors.text}`,
                }}
              />
            ) : (
              <div 
                className="px-3 py-2 min-h-[32px] flex items-center"
                style={{
                  backgroundColor: DesignTokens.colors.accent,
                  border: `2px solid ${DesignTokens.colors.text}`,
                }}
              >
                <span className="text-sm font-bold text-left" style={{ color: DesignTokens.colors.text }}>
                  {userBio || '첫 페이지는 언제나 오늘부터'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


