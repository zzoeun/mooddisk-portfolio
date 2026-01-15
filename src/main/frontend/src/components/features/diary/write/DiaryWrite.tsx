import React, { useState, useEffect } from 'react';
import { EmotionSelector } from './EmotionSelector';
import { TextArea } from '../../../common/forms';
import DesignTokens from '../../../../constants/designTokens';

interface DiaryWriteProps {
  newDiary: {
    content: string;
    emotion: string;
    images: string[];
    challengeIdx?: number;
  };
  onDiaryChange: (field: string, value: any) => void;
  myChallenges: any[];
  isEditing?: boolean;
  selectedImageFiles?: File[];
  setSelectedImageFiles?: (files: File[] | ((prev: File[]) => File[])) => void;
  removedImageUrls?: string[];
  setRemovedImageUrls?: (urls: string[] | ((prev: string[]) => string[])) => void;
  onModalChange?: (isOpen: boolean) => void;
  onSubmit: () => void | Promise<void>;
}

export const DiaryWrite: React.FC<DiaryWriteProps> = ({
  newDiary,
  onDiaryChange,
  myChallenges,
  selectedImageFiles,
  setSelectedImageFiles,
  removedImageUrls,
  setRemovedImageUrls,
  onModalChange,
  onSubmit
}) => {
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // 모바일 화면 감지
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const maxImages = 3;
  
  // 현재 이미지 개수 계산 (기존 이미지 + 새 이미지 - 삭제된 이미지)
  const currentImageCount = 
    (newDiary.images?.filter((img: string) => !removedImageUrls?.includes(img)).length || 0) +
    (selectedImageFiles?.length || 0);
  
  const isPhotoTabDisabled = currentImageCount >= maxImages;

  // 사진 선택 핸들러
  const handlePhotoTab = () => {
    if (isPhotoTabDisabled) return;
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      if (files.length === 0) return;
      
      const remainingSlots = maxImages - currentImageCount;
      
      if (files.length > remainingSlots) {
        alert(`이미지는 최대 ${maxImages}개까지 첨부할 수 있습니다. ${remainingSlots}개의 이미지만 추가됩니다.`);
      }
      
      const filesToAdd = files.slice(0, remainingSlots);
      setSelectedImageFiles?.([...(selectedImageFiles || []), ...filesToAdd]);
    };
    input.click();
  };

  // 챌린지 선택 핸들러
  const handleChallengeTab = () => {
    setShowChallengeModal(true);
    onModalChange?.(true);
  };

  // 작성 완료 핸들러
  const handleWriteTab = () => {
    onSubmit();
  };

  // 이미지 클릭 핸들러 (확대 보기는 추후 구현)
  const handleImageClick = (index: number) => {
    console.log('이미지 클릭:', index);
  };

  // 모달 닫기
  const handleCloseModal = () => {
    setShowChallengeModal(false);
    onModalChange?.(false);
  };

  // 모든 이미지 (기존 + 새로 추가)
  const allImages = [
    ...(newDiary.images?.filter((img: string) => !removedImageUrls?.includes(img)).map((img: string) => ({ uri: img, isExisting: true })) || []),
    ...(selectedImageFiles?.map((file: File) => ({ uri: URL.createObjectURL(file), file, isExisting: false })) || [])
  ];

  return (
    <div style={{ 
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 160px)', // 헤더와 탭바 높이 제외 + 여유 공간
      backgroundColor: DesignTokens.colors.background
    }}>
      {/* 스크롤 가능한 영역 */}
      <div style={{ 
        flex: 1,
        overflowY: 'auto',
        paddingTop: '10px'
      }}>
        <div style={{ paddingLeft: '16px', paddingRight: '16px' }}>
          {/* 감정 선택 */}
          <EmotionSelector
            selectedEmotion={newDiary.emotion}
            onEmotionChange={(emotion) => onDiaryChange('emotion', emotion)}
          />

          {/* 텍스트 영역 및 이미지 컨테이너 */}
          <div style={{ marginBottom: '16px' }}>
            <TextArea
              value={newDiary.content}
              onChange={(value) => onDiaryChange('content', value)}
              placeholder="지금, 어떤가요?"
            />

            {/* 이미지 미리보기 - 텍스트 영역 하단 */}
            {allImages.length > 0 && (
              <div
                style={{
                  marginTop: '8px',
                  marginBottom: '0',
                  paddingLeft: '16px',
                  paddingRight: '16px',
                  overflowX: 'auto',
                  display: 'flex',
                  gap: '12px'
                }}
              >
                {allImages.map((image, index) => (
                  <div
                    key={index}
                    style={{
                      position: 'relative',
                      flexShrink: 0
                    }}
                  >
                    <img
                      src={image.uri}
                      alt={`이미지 ${index + 1}`}
                      style={{
                        width: '110px',
                        height: '110px',
                        objectFit: 'cover',
                        border: `2px solid ${DesignTokens.colors.text}`,
                        backgroundColor: DesignTokens.colors.background,
                        cursor: 'pointer'
                      }}
                      onClick={() => handleImageClick(index)}
                      onError={(e) => {
                        console.error(`이미지 미리보기 로드 실패 (${index + 1}):`, image.uri);
                      }}
                    />
                    {/* 삭제 버튼 */}
                    <button
                      onClick={() => {
                        if (image.isExisting) {
                          // 기존 이미지 삭제
                          setRemovedImageUrls?.([...(removedImageUrls || []), image.uri]);
                        } else {
                          // 새로 추가된 이미지 삭제
                          const fileIndex = allImages.slice(0, index).filter((img: { isExisting: boolean }) => !img.isExisting).length;
                          const newFiles = selectedImageFiles?.filter((_: File, i: number) => i !== fileIndex) || [];
                          setSelectedImageFiles?.(newFiles);
                        }
                      }}
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        width: '20px',
                        height: '20px',
                        backgroundColor: DesignTokens.colors.alert,
                        border: `2px solid ${DesignTokens.colors.text}`,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      <span
                        style={{
                          color: DesignTokens.colors.text,
                          fontSize: '12px',
                          fontWeight: 'bold',
                          lineHeight: '12px',
                          fontFamily: DesignTokens.fonts.default
                        }}
                      >
                        ×
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 하단 고정 툴바 (모바일에서는 탭바 위에 고정) */}
      <div
        style={{
          ...(isMobile ? {
            position: 'fixed',
            bottom: '80px', // 탭바 높이(60px) + 여유 공간(20px)
            left: 0,
            right: 0,
            zIndex: 1000
          } : {
            flexShrink: 0
          }),
          backgroundColor: DesignTokens.colors.background,
          borderTop: `3px solid ${DesignTokens.colors.border}`,
          padding: '12px 16px',
          display: 'flex',
          gap: '8px'
        }}
      >
        {/* 사진 버튼 */}
        <button
          onClick={handlePhotoTab}
          disabled={isPhotoTabDisabled}
          style={{
            flex: 1,
            padding: '8px 12px',
            border: `2px solid ${DesignTokens.colors.border}`,
            backgroundColor: DesignTokens.colors.background,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: isPhotoTabDisabled ? 'not-allowed' : 'pointer',
            opacity: isPhotoTabDisabled ? 0.5 : 1
          }}
        >
          <span
            style={{
              fontSize: '14px',
              fontWeight: 'bold',
              color: DesignTokens.colors.primary,
              fontFamily: DesignTokens.fonts.default,
              textTransform: 'uppercase'
            }}
          >
            사진 ({currentImageCount}/{maxImages})
          </span>
        </button>

        {/* 챌린지 버튼 */}
        <button
          onClick={handleChallengeTab}
          style={{
            flex: 1,
            padding: '8px 12px',
            border: `2px solid ${DesignTokens.colors.border}`,
            backgroundColor: DesignTokens.colors.background,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'pointer'
          }}
        >
          <span
            style={{
              fontSize: '14px',
              fontWeight: 'bold',
              color: DesignTokens.colors.primary,
              fontFamily: DesignTokens.fonts.default,
              textTransform: 'uppercase'
            }}
          >
            챌린지
          </span>
        </button>

        {/* 작성 버튼 */}
        <button
          onClick={handleWriteTab}
          style={{
            flex: 1,
            padding: '8px 12px',
            border: `2px solid ${DesignTokens.colors.border}`,
            backgroundColor: DesignTokens.colors.accent,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'pointer'
          }}
        >
          <span
            style={{
              fontSize: '14px',
              fontWeight: 'bold',
              color: DesignTokens.colors.text,
              fontFamily: DesignTokens.fonts.default,
              textTransform: 'uppercase'
            }}
          >
            작성
          </span>
        </button>
      </div>

      {/* 챌린지 선택 모달 */}
      {showChallengeModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'flex-end',
            flexDirection: 'column',
            zIndex: 1000
          }}
          onClick={handleCloseModal}
        >
          <div
            style={{
              backgroundColor: DesignTokens.colors.background,
              borderTop: `3px solid ${DesignTokens.colors.border}`,
              maxHeight: '50%',
              display: 'flex',
              flexDirection: 'column',
              ...(isMobile ? {
                margin: '0 16px',
                marginBottom: '100px' // 하단 버튼 위로 위치 조정
              } : {
                margin: '0 300px',
                marginBottom: '16px'
              })
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '20px',
                borderBottom: `3px solid ${DesignTokens.colors.border}`
              }}
            >
              <span
                style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: DesignTokens.colors.primary,
                  fontFamily: DesignTokens.fonts.default,
                  textTransform: 'uppercase'
                }}
              >
                챌린지 선택
              </span>
              <button
                onClick={handleCloseModal}
                style={{
                  width: '30px',
                  height: '30px',
                  backgroundColor: DesignTokens.colors.alert,
                  border: `2px solid ${DesignTokens.colors.text}`,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                <span
                  style={{
                    fontSize: '16px',
                    color: DesignTokens.colors.text,
                    fontWeight: 'bold',
                    fontFamily: DesignTokens.fonts.default
                  }}
                >
                  ✕
                </span>
              </button>
            </div>

            {/* 챌린지 목록 */}
            <div
              style={{
                padding: '20px',
                overflowY: 'auto',
                flex: 1
              }}
            >
              {/* 챌린지 없음 옵션 */}
              <button
                onClick={() => {
                  onDiaryChange('challengeIdx', undefined);
                  handleCloseModal();
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  marginBottom: '8px',
                  backgroundColor: !newDiary.challengeIdx ? DesignTokens.colors.accent : DesignTokens.colors.background,
                  border: `2px solid ${!newDiary.challengeIdx ? DesignTokens.colors.text : DesignTokens.colors.border}`,
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                <span
                  style={{
                    fontSize: '14px',
                    color: !newDiary.challengeIdx ? DesignTokens.colors.text : DesignTokens.colors.primary,
                    fontWeight: 'bold',
                    fontFamily: DesignTokens.fonts.default,
                    textTransform: 'uppercase'
                  }}
                >
                  챌린지 없음
                </span>
              </button>

              {/* 내 챌린지 목록 (진행 중인 챌린지만) */}
              {myChallenges && Array.isArray(myChallenges) && myChallenges
                .filter((challenge: any) => {
                  // 진행 중인 챌린지만 표시
                  return challenge.status === 'ACTIVE' && !challenge.isCompleted;
                })
                .map((challenge: any) => {
                  // challengeIdx 또는 participationIdx 중 사용 가능한 것 사용
                  const challengeId = challenge.challengeIdx || challenge.participationIdx;
                  const isSelected = newDiary.challengeIdx === challengeId;
                  
                  return (
                    <button
                      key={challengeId || challenge.challengeIdx}
                      onClick={() => {
                        onDiaryChange('challengeIdx', challengeId);
                        handleCloseModal();
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        marginBottom: '8px',
                        backgroundColor: isSelected ? DesignTokens.colors.accent : DesignTokens.colors.background,
                        border: `2px solid ${isSelected ? DesignTokens.colors.text : DesignTokens.colors.border}`,
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      <span
                        style={{
                          fontSize: '14px',
                          color: isSelected ? DesignTokens.colors.text : DesignTokens.colors.primary,
                          fontWeight: 'bold',
                          fontFamily: DesignTokens.fonts.default,
                          textTransform: 'uppercase'
                        }}
                      >
                        {challenge.title}
                      </span>
                    </button>
                  );
                })}
              
              {/* 챌린지가 없을 때 메시지 표시 */}
              {(!myChallenges || !Array.isArray(myChallenges) || 
                myChallenges.filter((c: any) => c.status === 'ACTIVE' && !c.isCompleted).length === 0) && (
                <div
                  style={{
                    padding: '20px',
                    textAlign: 'center',
                    color: DesignTokens.colors.gray,
                    fontFamily: DesignTokens.fonts.default
                  }}
                >
                  진행 중인 챌린지가 없습니다
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
