import React from 'react';
import { View, Text, Image, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { ApiUserInfo } from '@mooddisk/types';
import DesignTokens from '../../../constants/designTokens';
import { DEFAULT_IMAGES } from '../../../constants/images';

interface ProfileSectionProps {
  userInfo: ApiUserInfo | null;
  userNickname: string;
  userBio: string;
  isEditingProfile: boolean;
  editingNickname: string;
  editingBio: string;
  editingProfileImage?: string;
  onNicknameChange: (text: string) => void;
  onBioChange: (text: string) => void;
  onImageChange?: (imageUri: string) => void;
  onEditToggle?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({
  userInfo,
  userNickname,
  userBio,
  isEditingProfile,
  editingNickname,
  editingBio,
  editingProfileImage,
  onNicknameChange,
  onBioChange,
  onImageChange,
  onEditToggle,
  onSave,
  onCancel,
}) => {
  return (
    <View style={styles.profileSection}>
      {/* 우측 상단 편집 버튼 */}
      <View style={styles.topRightButton}>
        {isEditingProfile ? (
          <View style={styles.editActions}>
            <TouchableOpacity style={styles.smallButton} onPress={onCancel}>
              <Text style={styles.smallButtonText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.smallButton, styles.saveButton]} onPress={onSave}>
              <Text style={[styles.smallButtonText, styles.saveButtonText]}>저장</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.smallButton} onPress={onEditToggle}>
            <Text style={styles.smallButtonText}>편집</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 프로필 컨텐츠 - 좌우 배치 */}
      <View style={styles.profileContent}>
        {/* 좌측: 아바타 */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Image 
              source={{ 
                uri: editingProfileImage || (userInfo as any)?.data?.data?.profileImage || (userInfo as any)?.data?.profileImage || userInfo?.profileImage || DEFAULT_IMAGES.PROFILE
              }} 
              style={styles.avatarImage}
              onError={() => {
                // 에러 시 기본 이미지로 대체 (React Native에서는 state로 관리하는 것이 더 안정적)
                // 현재는 fallback이 이미 uri에 포함되어 있으므로 추가 처리 불필요
              }}
            />
          </View>
          {isEditingProfile && (
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => onImageChange?.('')}
            >
              <Text style={styles.editText}>이미지 변경</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 우측: 사용자 정보 */}
        <View style={styles.userInfoSection}>
          <View style={styles.userInfoContainer}>
            {isEditingProfile ? (
              <TextInput
                value={editingNickname}
                onChangeText={onNicknameChange}
                style={styles.editingNickname}
                placeholder="닉네임을 입력하세요"
                placeholderTextColor={DesignTokens.colors.mediumGray}
              />
            ) : (
              <Text style={styles.nickname}>{userNickname || (userInfo as any)?.data?.data?.nickname || (userInfo as any)?.data?.nickname || userInfo?.nickname || '사용자'}</Text>
            )}
          </View>

          <View style={styles.bioContainer}>
            {isEditingProfile ? (
              <TextInput
                value={editingBio}
                onChangeText={onBioChange}
                style={styles.editingBio}
                placeholder="자신을 소개해주세요"
                placeholderTextColor={DesignTokens.colors.mediumGray}
                multiline
                numberOfLines={2}
              />
            ) : (
              <View style={styles.bio}>
                <Text style={styles.bioText}>{userBio || '첫 페이지는 언제나 오늘부터'}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  profileSection: {
    paddingTop: DesignTokens.spacing.sectionPadding,
    paddingBottom: DesignTokens.spacing.sectionPadding,
    paddingHorizontal: DesignTokens.spacing.sectionPadding,
    position: 'relative',
    backgroundColor: DesignTokens.colors.background,
    borderWidth: DesignTokens.borders.width,
    borderColor: DesignTokens.colors.border,
    marginHorizontal: DesignTokens.spacing.sectionPadding,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: DesignTokens.spacing.componentGap,
  },
  avatarContainer: {
    alignItems: 'center',
  },
  userInfoSection: {
    flex: 1,
    justifyContent: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: DesignTokens.colors.text,
    overflow: 'hidden',
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  userInfoContainer: {
    marginBottom: DesignTokens.spacing.innerPadding,
  },
  nickname: {
    ...DesignTokens.typography.cardTitle,
    textAlign: 'left',
  },
  editingNickname: {
    ...DesignTokens.typography.cardTitle,
    borderBottomWidth: 2,
    borderBottomColor: DesignTokens.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  bioContainer: {
    marginBottom: DesignTokens.spacing.smallGap,
  },
  bio: {
    backgroundColor: DesignTokens.colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: DesignTokens.colors.text,
    minHeight: 32,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  bioText: {
    fontSize: 14,
    color: DesignTokens.colors.text,
    textAlign: 'left',
    fontWeight: 'bold',
    fontFamily: DesignTokens.fonts.default,
  },
  editingBio: {
    fontSize: 14,
    color: DesignTokens.colors.text,
    backgroundColor: DesignTokens.colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 8,
    textAlign: 'left',
    fontWeight: 'bold',
    minHeight: 32,
    borderWidth: 2,
    borderColor: DesignTokens.colors.text,
    fontFamily: DesignTokens.fonts.default,
  },
  editButton: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editText: {
    fontSize: 12,
    color: DesignTokens.colors.primary,
    fontWeight: 'bold',
    fontFamily: DesignTokens.fonts.default,
    textTransform: 'uppercase',
  },
  topRightButton: {
    position: 'absolute',
    top: 8,
    right: 16,
    zIndex: 1,
  },
  editActions: {
    flexDirection: 'row',
    gap: DesignTokens.spacing.smallGap,
  },
  smallButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: DesignTokens.colors.alert,
    borderWidth: 2,
    borderColor: DesignTokens.colors.text,
  },
  saveButton: {
    backgroundColor: DesignTokens.colors.alert,
    borderColor: DesignTokens.colors.text,
  },
  smallButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: DesignTokens.colors.text,
    fontFamily: DesignTokens.fonts.default,
    textTransform: 'uppercase',
  },
  saveButtonText: {
    color: DesignTokens.colors.text,
  },
});
