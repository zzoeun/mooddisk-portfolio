import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, Platform, Modal, ScrollView, Keyboard, InputAccessoryView, Image, Linking } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { EmotionSelector } from './EmotionSelector';
import DiaryTextArea from './DiaryTextArea';
import { ImageModal } from '../../../common/timeline/ImageModal';
import { LocationPickerModal, LocationInfo } from '../location';
import DesignTokens from '../../../../constants/designTokens';
import { useIsTablet } from '../../../../hooks/useDeviceInfo';
import { getMaxWidth } from '../../../../utils/deviceUtils';

interface DiaryWriteProps {
  newDiary: {
    content: string;
    emotion: string;
    images: string[];
    challengeIdx?: number;
    currentChallengeStatus?: string;
    latitude?: number;
    longitude?: number;
    locationName?: string;
    address?: string;
  };
  onDiaryChange: (field: string, value: any) => void;
  myChallenges: any[];
  isEditing?: boolean;
  selectedImageFiles: any[];
  setSelectedImageFiles: (files: any[] | ((prev: any[]) => any[])) => void;
  removedImageUrls: string[];
  setRemovedImageUrls: (urls: string[] | ((prev: string[]) => string[])) => void;
  onSubmit: () => void;
  selectedImages: any[];
  setSelectedImages: (images: any[] | ((prev: any[]) => any[])) => void;
  hideToolbar?: boolean; // 툴바 숨김 여부 (모달 표시 시 사용)
  isSubmitting?: boolean; // 제출 중 상태
}

export const DiaryWrite: React.FC<DiaryWriteProps> = ({
  newDiary,
  onDiaryChange,
  myChallenges,
  isEditing,
  selectedImageFiles,
  setSelectedImageFiles,
  removedImageUrls,
  setRemovedImageUrls,
  onSubmit,
  selectedImages,
  setSelectedImages,
  isSubmitting = false,
  hideToolbar = false,
}) => {
  const isTablet = useIsTablet();
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  
  const [displayText, setDisplayText] = useState(newDiary.content);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const TAB_ID = 'diaryKeyboardToolbar';
  const scrollViewRef = useRef<ScrollView>(null);
  
  
  // 이미지 모달 상태
  const [imageModal, setImageModal] = useState({
    isOpen: false,
    images: [] as string[],
    initialIndex: 0,
  });

  // displayText를 newDiary.content와 동기화
  useEffect(() => {
    setDisplayText(newDiary.content);
  }, [newDiary.content]);

  // newDiary.images를 selectedImages로 변환 (일기 수정 시 기존 이미지 표시용)
  useEffect(() => {
    if (newDiary.images && newDiary.images.length > 0 && isEditing) {
      // 기존 이미지 URL들을 ImagePicker.ImagePickerAsset 형태로 변환
      const existingImages = newDiary.images.map((imageUrl: string, index: number) => ({
        uri: imageUrl,
        fileName: `existing_image_${index}.jpg`,
        type: 'image/jpeg',
        width: 0,
        height: 0,
        fileSize: 0,
        assetId: `existing_${index}`,
        timestamp: Date.now(),
        duration: 0,
        mediaType: 'photo' as any,
        creationTime: Date.now(),
        modificationTime: Date.now(),
        albumId: '',
        id: `existing_${index}`,
      }));
      
      setSelectedImages(existingImages);
    } else if (!isEditing) {
      // 새 일기 작성 시에는 selectedImages 초기화
      setSelectedImages([]);
    }
  }, [newDiary.images, isEditing]);


  // 키보드 높이 감지 (iOS에서 툴바 표시 제어용)
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  // 탭 핸들러들
  const handlePhotoTab = async () => {
    try {
      // 현재 선택된 이미지 개수 확인
      const currentImageCount = selectedImages.length;
      const maxImages = 3;
      
      if (currentImageCount >= maxImages) {
        Alert.alert('알림', `이미지는 최대 ${maxImages}개까지 첨부할 수 있습니다.`);
        return;
      }

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

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets;
        const remainingSlots = maxImages - currentImageCount;
        
        // 남은 슬롯 수만큼만 이미지 추가
        const imagesToAdd = newImages.slice(0, remainingSlots);
        
        if (newImages.length > remainingSlots) {
          Alert.alert('알림', `이미지는 최대 ${maxImages}개까지 첨부할 수 있습니다. ${remainingSlots}개의 이미지만 추가됩니다.`);
        }
        
        setSelectedImages((prev: any[]) => [...prev, ...imagesToAdd]);
        
        // 이미지 파일을 selectedImageFiles에 추가
        const newFiles: any[] = [];
        for (const asset of imagesToAdd) {
          const fileData = {
            uri: asset.uri,
            name: asset.fileName || `image_${Date.now()}.jpg`,
            type: asset.mimeType || 'image/jpeg',  // asset.type → asset.mimeType
          };
          newFiles.push(fileData);
        }
        setSelectedImageFiles((prev: any[]) => [...prev, ...newFiles]);
      }
    } catch (error) {
      console.error('이미지 선택 오류:', error);
      Alert.alert('오류', '이미지를 선택하는 중 오류가 발생했습니다.');
    }
  };

  const handleChallengeTab = () => {
    setShowChallengeModal(true);
  };

  const handleLocationSelect = (location: LocationInfo) => {
    console.log('📍 위치 선택됨:', {
      locationName: location.locationName,
      address: location.address,
      latitude: location.latitude,
      longitude: location.longitude,
    });

    // locationName이 있으면 사용, 없으면 주소의 첫 부분 사용
    let finalLocationName = location.locationName;
    if (!finalLocationName || !finalLocationName.trim()) {
      // locationName이 없으면 주소의 첫 부분 사용
      if (location.address) {
        finalLocationName = location.address.split(',')[0].trim();
      }
    }
    
    
    // 모든 필드를 개별적으로 업데이트 (React 상태 업데이트는 비동기이므로)
    // 하지만 locationName을 먼저 업데이트하여 버튼에 즉시 반영되도록 함
    onDiaryChange('locationName', finalLocationName || undefined);
    onDiaryChange('latitude', location.latitude);
    onDiaryChange('longitude', location.longitude);
    onDiaryChange('address', location.address || undefined);
  };

  const handleRemoveLocation = () => {
    onDiaryChange('latitude', undefined);
    onDiaryChange('longitude', undefined);
    onDiaryChange('locationName', undefined);
    onDiaryChange('address', undefined);
  };

  const handleWriteTab = () => {
    onSubmit();
  };

  // 트래블로그인지 확인하는 함수
  const isTravelLog = () => {
    if (!newDiary.challengeIdx) {
      return false;
    }
    const selectedChallenge = myChallenges.find(
      (challenge: any) => challenge.challengeIdx === newDiary.challengeIdx
    );
    return selectedChallenge?.type === 'TRAVEL';
  };

  // 이미지 클릭 핸들러
  const handleImageClick = (imageIndex: number) => {
    const imageUris = selectedImages.map((img: any) => img.uri);
    setImageModal({
      isOpen: true,
      images: imageUris,
      initialIndex: imageIndex,
    });
  };

  // 이미지 모달 닫기
  const closeImageModal = () => {
    setImageModal({
      isOpen: false,
      images: [],
      initialIndex: 0,
    });
  };

  // ToolbarContent 컴포넌트
  const maxImages = 3;
  const isPhotoTabDisabled = selectedImages.length >= maxImages;
  
  const ToolbarContent = (
    <View style={styles.keyboardTabContainer}>
      <TouchableOpacity
        style={[
          styles.tab,
          isPhotoTabDisabled && styles.disabledTab
        ]}
        onPress={isPhotoTabDisabled ? undefined : handlePhotoTab}
        disabled={isPhotoTabDisabled}
      >
        <Text 
          style={[
            styles.tabText,
            isPhotoTabDisabled && styles.disabledTabText
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit={true}
          minimumFontScale={0.8}
        >
          사진 ({selectedImages.length}/{maxImages})
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.tab}
        onPress={handleChallengeTab}
      >
        <Text style={styles.tabText}>로그</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.writeTab, isSubmitting && styles.disabledButton]}
        onPress={handleWriteTab}
        disabled={isSubmitting}
      >
        <Text style={styles.writeTabText}>
          {isSubmitting ? '기록 중...' : '기록'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Platform.OS === 'android' ? 80 : 100 }
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        nestedScrollEnabled={true}
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      >
        <View style={styles.form}>
        {/* 감정 선택 - 기존처럼 가장 상단에 위치 */}
        <EmotionSelector
          selectedEmotion={newDiary.emotion}
          onEmotionChange={(emotion) => onDiaryChange('emotion', emotion)}
        />
        
        {/* 위치 추가 버튼 - 트래블로그일 때만 표시 */}
        {isTravelLog() && (
          <TouchableOpacity
            style={styles.locationButton}
            onPress={() => setShowLocationModal(true)}
          >
            <Feather name="map-pin" size={20} color={DesignTokens.colors.primary} />
            <Text style={styles.locationButtonText} numberOfLines={1}>
              {newDiary.locationName || '내 위치 추가'}
            </Text>
          </TouchableOpacity>
        )}

        {/* 통합된 텍스트 및 이미지 영역 */}
        <View style={styles.contentContainer}>
          <DiaryTextArea
            value={displayText}
            onChange={(value) => {
              setDisplayText(value);
              onDiaryChange('content', value);
            }}
            placeholder="지금, 어떤가요?"
            inputAccessoryViewID={Platform.OS === 'ios' ? TAB_ID : undefined}
            onFocus={() => {
              // 포커스 시에는 특별한 스크롤 조정 없음 (키보드 감지에서 처리)
            }}
            onBlur={() => {
              // 블러 시에는 특별한 처리 없음
            }}
          />
          
          {/* 선택된 이미지 미리보기 - 텍스트 영역 하단에 위치 */}
          {selectedImages && selectedImages.length > 0 && (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.imagePreviewContainer}
            >
              {selectedImages.map((image: any, index: number) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleImageClick(index)}
                  style={styles.imagePreviewItem}
                >
                  <Image
                    source={{ uri: image.uri }}
                    style={styles.imagePreview}
                    onError={(error) => {
                      console.error(`이미지 미리보기 로드 실패 (${index + 1}):`, image.uri);
                    }}
                  />
                  {/* 이미지 삭제 버튼 */}
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => {
                      const imageToRemove = selectedImages[index];
                      const isExistingImage = imageToRemove.assetId?.startsWith('existing_');

                      
                      if (isExistingImage && isEditing) {
                        // 기존 이미지 삭제 시 removedImageUrls에 추가
                        setRemovedImageUrls((prev: string[]) => {
                          const newRemoved = [...prev, imageToRemove.uri];
                          return newRemoved;
                        });
                      } else {
                        // 새로 추가된 이미지 삭제 시 selectedImageFiles에서도 제거
                        // 인덱스 기반으로 삭제 (파일명이 아닌 위치로 삭제)
                        const newFiles = selectedImageFiles.filter((_: any, fileIndex: number) => fileIndex !== index);
                        setSelectedImageFiles(newFiles);
                      }
                      
                      // selectedImages에서 제거
                      const newImages = selectedImages.filter((_: any, i: number) => i !== index);
                      setSelectedImages(newImages);
                    }}
                  >
                    <Text style={styles.removeImageText}>×</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
        </View>
      </ScrollView>

      {/* iOS: InputAccessoryView (키보드 위 고정) + 하단 고정 툴바 */}
      {Platform.OS === 'ios' && !hideToolbar && (
        <>
          <InputAccessoryView nativeID={TAB_ID}>
            {ToolbarContent}
          </InputAccessoryView>
          {/* 키보드가 없을 때 하단 고정 */}
          {keyboardHeight === 0 && (
            <View style={styles.bottomToolbar}>
              {ToolbarContent}
            </View>
          )}
        </>
      )}

      {/* Android: 하단 고정 툴바 (KeyboardAvoidingView 없이 자연스럽게 키보드 위로) */}
      {Platform.OS === 'android' && !hideToolbar && (
        <View style={styles.bottomToolbar}>
          {ToolbarContent}
        </View>
      )}

      {/* 챌린지 선택 모달 */}
      <Modal
        visible={showChallengeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowChallengeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[
            styles.modalContent,
            isTablet && {
              paddingHorizontal: 40,
              maxWidth: getMaxWidth(),
              alignSelf: 'center',
              width: '100%',
            }
          ]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>로그 선택</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowChallengeModal(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.challengeModalList}>
              {/* COMPLETED나 FAILED 상태가 아닐 때만 "로그 없음" 옵션 표시 */}
              {!(newDiary.currentChallengeStatus === 'COMPLETED' || newDiary.currentChallengeStatus === 'FAILED') && (
                <TouchableOpacity
                  style={[
                    styles.challengeModalItem,
                    !newDiary.challengeIdx && styles.selectedChallengeModalItem
                  ]}
                  onPress={() => {
                    onDiaryChange('challengeIdx', null);
                    setShowChallengeModal(false);
                  }}
                >
                  <Text style={[
                    styles.challengeModalItemText,
                    !newDiary.challengeIdx && styles.selectedChallengeModalItemText
                  ]}>
                    로그 없음
                  </Text>
                </TouchableOpacity>
              )}
              
              {myChallenges && Array.isArray(myChallenges) && myChallenges.map((challenge: any, index: number) => {
                const isSelected = newDiary.challengeIdx === challenge.challengeIdx;
                
                // 현재 일기에 연결된 챌린지가 COMPLETED나 FAILED 상태인 경우에만 비활성화
                const isCurrentChallenge = challenge.challengeIdx === newDiary.challengeIdx;
                const isDisabled = isCurrentChallenge && 
                                 (newDiary.currentChallengeStatus === 'COMPLETED' || 
                                  newDiary.currentChallengeStatus === 'FAILED');
                const statusText = isCurrentChallenge && 
                                 (newDiary.currentChallengeStatus === 'COMPLETED' || 
                                  newDiary.currentChallengeStatus === 'FAILED') ? ' (완료됨)' : '';
                
                return (
                  <TouchableOpacity
                    key={challenge.challengeIdx || `challenge-${index}`}
                    style={[
                      styles.challengeModalItem,
                      isSelected && styles.selectedChallengeModalItem,
                      isDisabled && styles.disabledChallengeModalItem
                    ]}
                    onPress={() => {
                      if (!isDisabled) {
                        onDiaryChange('challengeIdx', challenge.challengeIdx);
                        setShowChallengeModal(false);
                      }
                    }}
                    disabled={isDisabled}
                  >
                    <Text style={[
                      styles.challengeModalItemText,
                      isSelected && styles.selectedChallengeModalItemText,
                      isDisabled && styles.disabledChallengeModalItemText
                    ]}>
                      {challenge.title}{statusText}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 이미지 모달 */}
      <ImageModal
        images={imageModal.images}
        initialIndex={imageModal.initialIndex}
        isOpen={imageModal.isOpen}
        onClose={closeImageModal}
      />

      {/* 위치 선택 모달 */}
      <LocationPickerModal
        visible={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onSelectLocation={handleLocationSelect}
      />
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
    paddingBottom: 100,
  },
  form: {
    paddingHorizontal: 16,
  },
  contentContainer: {
    marginBottom: 16,
  },
  // 이미지 미리보기 스타일
  imagePreviewContainer: {
    marginTop: 8,
    marginBottom: 0,
  },
  imagePreviewItem: {
    position: 'relative',
    marginRight: 12,
  },
  imagePreview: {
    width: 110,
    height: 110,
    borderWidth: 2,
    borderColor: DesignTokens.colors.text,
    backgroundColor: DesignTokens.colors.background,
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    backgroundColor: DesignTokens.colors.alert,
    borderWidth: 2,
    borderColor: DesignTokens.colors.text,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: DesignTokens.colors.text,
    fontSize: 12,
    fontWeight: 'bold',
    lineHeight: 12,
    fontFamily: DesignTokens.fonts.default,
  },
  // 키보드 상단 탭 컨테이너
  keyboardTabContainer: {
    flexDirection: 'row',
    backgroundColor: DesignTokens.colors.background,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 3,
    borderTopColor: DesignTokens.colors.border,
  },
  // 하단 고정 툴바
  bottomToolbar: {
    backgroundColor: DesignTokens.colors.background,
    borderTopColor: DesignTokens.colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: DesignTokens.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  tabText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: DesignTokens.colors.primary,
    fontFamily: DesignTokens.fonts.default,
    textTransform: 'uppercase',
  },
  disabledTab: {
    opacity: 0.5,
  },
  disabledTabText: {
    color: DesignTokens.colors.primary,
    fontFamily: DesignTokens.fonts.default,
  },
  writeTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: DesignTokens.colors.border,
    backgroundColor: DesignTokens.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  writeTabText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: DesignTokens.colors.text,
    fontFamily: DesignTokens.fonts.default,
    textTransform: 'uppercase',
  },
  disabledButton: {
    opacity: 0.5,
  },
  // 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: DesignTokens.colors.background,
    borderTopWidth: 3,
    borderTopColor: DesignTokens.colors.border,
    maxHeight: '70%',
    minHeight: '40%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 3,
    borderBottomColor: DesignTokens.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: DesignTokens.colors.primary,
    fontFamily: DesignTokens.fonts.default,
    textTransform: 'uppercase',
  },
  closeButton: {
    width: 30,
    height: 30,
    backgroundColor: DesignTokens.colors.alert,
    borderWidth: 2,
    borderColor: DesignTokens.colors.text,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: DesignTokens.colors.text,
    fontWeight: 'bold',
    fontFamily: DesignTokens.fonts.default,
  },
  challengeModalList: {
    padding: 20,
  },
  challengeModalItem: {
    padding: 16,
    marginBottom: 8,
    backgroundColor: DesignTokens.colors.background,
    borderWidth: 2,
    borderColor: DesignTokens.colors.border,
  },
  selectedChallengeModalItem: {
    backgroundColor: DesignTokens.colors.accent,
    borderColor: DesignTokens.colors.text,
  },
  challengeModalItemText: {
    fontSize: 16,
    color: DesignTokens.colors.primary,
    fontWeight: 'bold',
    fontFamily: DesignTokens.fonts.default,
    textTransform: 'uppercase',
  },
  selectedChallengeModalItemText: {
    color: DesignTokens.colors.text,
    fontWeight: 'bold',
  },
  disabledChallengeModalItem: {
    backgroundColor: DesignTokens.colors.lightGray,
    borderColor: DesignTokens.colors.mediumGray,
    opacity: 0.6,
  },
  disabledChallengeModalItemText: {
    color: DesignTokens.colors.gray,
    fontWeight: 'bold',
    fontFamily: DesignTokens.fonts.default,
  },
  // 위치 관련 스타일
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingRight: 12,
    paddingLeft: 8,
    marginBottom: -12,
    backgroundColor: DesignTokens.colors.background,
    gap: 6,
    marginTop: 6,
  },
  locationButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: DesignTokens.colors.gray,
    fontFamily: DesignTokens.fonts.default,
  },
  locationInfoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    padding: 12,
    backgroundColor: DesignTokens.colors.lightGray,
    borderWidth: 2,
    borderColor: DesignTokens.colors.border,
    borderRadius: 4,
  },
  locationInfoContent: {
    flex: 1,
  },
  locationName: {
    fontSize: 13,
    fontWeight: '500',
    color: DesignTokens.colors.gray,
    fontFamily: DesignTokens.fonts.default,
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 12,
    color: DesignTokens.colors.gray,
    fontFamily: DesignTokens.fonts.default,
    lineHeight: 16,
  },
  removeLocationButton: {
    width: 24,
    height: 24,
    backgroundColor: DesignTokens.colors.alert,
    borderWidth: 2,
    borderColor: DesignTokens.colors.text,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  removeLocationText: {
    color: DesignTokens.colors.text,
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 16,
    fontFamily: DesignTokens.fonts.default,
  },
});
