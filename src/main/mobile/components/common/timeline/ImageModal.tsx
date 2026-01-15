import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions, PanResponder, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import FastImage from 'react-native-fast-image';

interface ImageModalProps {
  images: string[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const ImageModal: React.FC<ImageModalProps> = ({
  images,
  initialIndex,
  isOpen,
  onClose
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const translateX = useRef(new Animated.Value(0)).current;
  const [isAnimating, setIsAnimating] = useState(false);

  React.useEffect(() => {
    // 모달이 열릴 때마다 currentIndex를 안전하게 초기화
    if (isOpen) {
      const safeIndex = Math.min(initialIndex, images.length - 1);
      setCurrentIndex(Math.max(0, safeIndex));
      console.log(`🔧 ImageModal 초기화 - initialIndex: ${initialIndex}, images.length: ${images.length}, safeIndex: ${Math.max(0, safeIndex)}`);
    }
  }, [isOpen, initialIndex, images.length]);

  // 스와이프 제스처 핸들러 (이미지가 2개 이상일 때만 활성화)
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => images.length > 1,
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return images.length > 1 && Math.abs(gestureState.dx) > 5;
    },
    onPanResponderGrant: () => {
      setIsAnimating(true);
    },
    onPanResponderMove: (evt, gestureState) => {
      // 실시간으로 이미지 이동
      translateX.setValue(gestureState.dx);
    },
    onPanResponderRelease: (evt, gestureState) => {
      const { dx } = gestureState;
      
      if (Math.abs(dx) > 30) { // 최소 스와이프 거리
        if (dx > 0) {
          // 오른쪽으로 스와이프 (이전 이미지)
          Animated.timing(translateX, {
            toValue: screenWidth,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
            translateX.setValue(0);
            setIsAnimating(false);
          });
        } else {
          // 왼쪽으로 스와이프 (다음 이미지)
          Animated.timing(translateX, {
            toValue: -screenWidth,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
            translateX.setValue(0);
            setIsAnimating(false);
          });
        }
      } else {
        // 스와이프 거리가 부족하면 원래 위치로 복귀
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start(() => {
          setIsAnimating(false);
        });
      }
    },
  });

  if (!isOpen) return null;

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* 닫기 버튼 */}
        <TouchableOpacity
          onPress={onClose}
          style={styles.closeButton}
        >
          <Feather name="x" size={24} color="white" />
        </TouchableOpacity>

        {/* 이미지 컨테이너 */}
        <View style={styles.imageContainer} {...panResponder.panHandlers}>
          {/* 이전 버튼 */}
          {images.length > 1 && (
            <TouchableOpacity
              onPress={handlePrevious}
              style={styles.navButton}
            >
              <Feather name="chevron-left" size={24} color="white" />
            </TouchableOpacity>
          )}

          {/* 이미지 */}
          <Animated.View 
            style={[
              styles.imageWrapper,
              { transform: [{ translateX }] }
            ]}
          >
            {images[currentIndex] && typeof images[currentIndex] === 'string' && currentIndex < images.length ? (
              <FastImage
                source={{ 
                  uri: images[currentIndex],
                  priority: FastImage.priority.high,
                  cache: FastImage.cacheControl.immutable
                }}
                style={styles.image}
                resizeMode={FastImage.resizeMode.contain}
                onError={() => {
                  console.error(`❌ ImageModal 이미지 로드 실패 (${currentIndex + 1}):`, images[currentIndex]);
                  console.error(`❌ 전체 이미지 배열:`, images);
                  console.error(`❌ 이미지 개수:`, images.length);
                }}
                onLoad={() => {
                  console.log(`✅ ImageModal 이미지 로드 성공 (${currentIndex + 1}):`, images[currentIndex]);
                }}
              />
            ) : (
              <View style={styles.image}>
                <Text style={{ color: 'white', textAlign: 'center' }}>
                  이미지를 불러올 수 없습니다
                </Text>
              </View>
            )}
          </Animated.View>

          {/* 다음 버튼 */}
          {images.length > 1 && (
            <TouchableOpacity
              onPress={handleNext}
              style={[styles.navButton, styles.nextButton]}
            >
              <Feather name="chevron-right" size={24} color="white" />
            </TouchableOpacity>
          )}
        </View>

        {/* 이미지 인디케이터 */}
        {images.length > 1 && (
          <View style={styles.indicatorContainer}>
            {images.map((_, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => setCurrentIndex(index)}
                style={[
                  styles.indicator,
                  index === currentIndex && styles.activeIndicator
                ]}
              />
            ))}
          </View>
        )}

        {/* 이미지 카운터 */}
        {images.length > 1 && (
          <View style={styles.counterContainer}>
            <Text style={styles.counterText}>
              {currentIndex + 1} / {images.length}
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
  },
  imageContainer: {
    flex: 1,
    width: screenWidth,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: screenWidth - 40,
    height: screenHeight * 0.8,
  },
  navButton: {
    position: 'absolute',
    left: 20,
    top: '50%',
    transform: [{ translateY: -20 }],
    zIndex: 10,
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
  },
  nextButton: {
    left: undefined,
    right: 20,
  },
  indicatorContainer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  activeIndicator: {
    backgroundColor: 'white',
  },
  counterContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  counterText: {
    color: 'white',
    fontSize: 14,
  },
});