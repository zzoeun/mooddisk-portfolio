import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, FlatList } from 'react-native';
import { Feather } from '@expo/vector-icons';
import FastImage from 'react-native-fast-image';
import { ImageModal } from './ImageModal';
import DesignTokens from '../../../constants/designTokens';

export interface TimelineItem {
  id: string;
  content: string;
  imageUrls?: string[];
  createdAt: string;
  type?: string;
  author?: {
    name: string;
    avatar?: string;
    emotion?: string;
  };
  actions?: {
    onEdit?: (item: TimelineItem) => void;
    onDelete?: (itemId: string) => void;
  };
  timezone?: string;
  timezoneOffset?: string;
  // 위치 정보 (트래블로그용)
  latitude?: number;
  longitude?: number;
  locationName?: string;
  address?: string;
}

interface GenericTimelineProps {
  items: TimelineItem[];
  renderAvatar?: (item: TimelineItem) => React.ReactNode;
  renderActions?: (item: TimelineItem) => React.ReactNode;
  formatTime?: (dateString: string, item?: TimelineItem) => string;
  style?: any;
  ListHeaderComponent?: React.ReactElement<any> | React.ComponentType<any> | null | undefined;
}

export const GenericTimeline: React.FC<GenericTimelineProps> = ({ 
  items, 
  renderAvatar, 
  renderActions, 
  formatTime,
  style,
  ListHeaderComponent
}) => {
  const [imageModal, setImageModal] = useState<{
    isOpen: boolean;
    images: string[];
    initialIndex: number;
  }>({
    isOpen: false,
    images: [],
    initialIndex: 0
  });

  const handleImageClick = (images: string[], initialIndex: number) => {
    setImageModal({
      isOpen: true,
      images,
      initialIndex
    });
  };

  const closeImageModal = () => {
    setImageModal({
      isOpen: false,
      images: [],
      initialIndex: 0
    });
  };


  const defaultFormatTime = (dateString: string) => {
    try {
      if (dateString && dateString.includes('T')) {
        const date = new Date(dateString);
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const seconds = date.getSeconds();
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      } else {
        const cleanDate = dateString.replace(/\./g, '').replace(/\s/g, '');
        const year = cleanDate.substring(0, 4);
        const month = cleanDate.substring(4, 6);
        const day = cleanDate.substring(6, 8);
        
        const date = new Date(`${year}-${month}-${day}`);
        const hours = Math.floor(Math.random() * 24);
        const minutes = Math.floor(Math.random() * 60);
        const seconds = Math.floor(Math.random() * 60);
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
    } catch (error) {
      console.error('시간 포맷팅 오류:', error);
      return '08:18:00';
    }
  };

  return (
    <View style={[styles.container, style]}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeaderComponent}
        renderItem={({ item, index }) => (
          <View style={styles.itemContainer}>
            {index < items.length - 1 && (
              <View style={[styles.timelineLine, index === 0 && styles.firstTimelineLine]} />
            )}
            <View style={[styles.timelineItem, index === 0 && styles.firstTimelineItem]}>
              <View style={styles.avatarContainer}>
                {renderAvatar ? renderAvatar(item) : (
                  <View style={styles.defaultAvatar}>
                    <Text style={styles.avatarText}>
                      {item.author?.name?.charAt(0) || 'U'}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.contentContainer}>
                <View style={styles.headerContainer}>
                  {item.author?.name && item.author.name.trim() !== '' && item.author.name !== '나' && (
                    <Text style={styles.authorName}>{item.author.name}</Text>
                  )}
                  {item.author?.name && item.author.name.trim() !== '' && item.author.name !== '나' && (
                    <Text style={styles.separator}>•</Text>
                  )}
                  <Text style={styles.timeText}>
                    {(formatTime || defaultFormatTime)(item.createdAt, item)}
                  </Text>
                </View>
                {renderActions && renderActions(item)}
                {/* 위치 정보 표시 (트래블로그일 때) */}
                {(item.locationName || (item.latitude && item.longitude)) && (
                  <View style={styles.locationContainer}>
                    <View style={styles.locationIcon}>
                      <Feather name="map-pin" size={14} color="rgba(139, 92, 246, 0.8)" />
                    </View>
                    <View style={styles.locationContent}>
                      {item.locationName ? (
                        <Text style={styles.locationName}>{item.locationName}</Text>
                      ) : (
                        <Text style={styles.locationName}>이 근처</Text>
                      )}
                    </View>
                  </View>
                )}
                <Text style={styles.contentText}>
                  {item.content}
                </Text>
                {item.imageUrls && item.imageUrls.length > 0 && (
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.imageScrollView}
                  >
                    {item.imageUrls.map((imageUrl: string, imgIndex: number) => (
                      <TouchableOpacity
                        key={imgIndex}
                        onPress={() => handleImageClick(item.imageUrls || [], imgIndex)}
                        style={styles.imageContainer}
                      >
                        <FastImage
                          source={{ 
                            uri: imageUrl,
                            priority: FastImage.priority.normal,
                            cache: FastImage.cacheControl.immutable
                          }}
                          style={styles.image}
                          resizeMode={FastImage.resizeMode.cover}
                          onError={() => {
                            console.error('이미지 로드 실패:', imageUrl);
                          }}
                        />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            </View>
            {index < items.length - 1 && (
              <View style={styles.separatorLine} />
            )}
          </View>
        )}
        initialNumToRender={8}
        windowSize={5}
        removeClippedSubviews
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
      />
      <ImageModal
        images={imageModal.images}
        initialIndex={imageModal.initialIndex}
        isOpen={imageModal.isOpen}
        onClose={closeImageModal}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignTokens.colors.background,
  },
  itemContainer: {
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: 32, // paddingLeft(16) + 아바타 중심(16) = 32
    top: 32, // paddingTop(16) + 아바타 중심(16) = 32
    height: '100%',
    width: 0.5,
    borderStyle: 'dashed',
    borderWidth: 0.5,
    borderColor: DesignTokens.colors.secondary,
    opacity: 0.5,
    backgroundColor: 'transparent',
  },
  firstTimelineLine: {
    top: 16, // paddingTop(0) + 아바타 중심(16) = 16
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  firstTimelineItem: {
    paddingTop: 0,
  },
  avatarContainer: {
    marginRight: 16,
    zIndex: 10,
    backgroundColor: DesignTokens.colors.background,
    borderRadius: 16,
  },
  defaultAvatar: {
    width: 32,
    height: 32,
    backgroundColor: DesignTokens.colors.lightGray,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 12,
    color: DesignTokens.colors.gray,
  },
  contentContainer: {
    flex: 1,
    minWidth: 0,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '500',
    color: DesignTokens.colors.darkGray,
  },
  separator: {
    fontSize: 14,
    color: DesignTokens.colors.mediumGray,
    marginHorizontal: 8,
  },
  timeText: {
    fontSize: 14,
    color: DesignTokens.colors.gray,
    fontWeight: 'bold',
    fontFamily: DesignTokens.fonts.default,
  },
  contentText: {
    fontSize: 16,
    color: DesignTokens.colors.text,
    lineHeight: 24,
    marginBottom: 12,
    fontFamily: DesignTokens.fonts.default,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  locationIcon: {
    width: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
  },
  locationContent: {
    flexShrink: 1,
  },
  locationName: {
    fontSize: 13,
    fontWeight: '500',
    color: DesignTokens.colors.gray,
    fontFamily: DesignTokens.fonts.default,
  },
  locationAddress: {
    fontSize: 12,
    color: DesignTokens.colors.gray,
    fontFamily: DesignTokens.fonts.default,
    lineHeight: 16,
  },
  imageScrollView: {
    marginTop: 8,
  },
  imageContainer: {
    marginRight: 8,
  },
  image: {
    width: 110,
    height: 110,
    borderWidth: 2,
    borderColor: DesignTokens.colors.text,    // 검정 테두리
    backgroundColor: DesignTokens.colors.background, // 흰색 배경
    // 직각 모서리 (borderRadius 없음)
  },
  separatorLine: {
    height: 1,
    backgroundColor: DesignTokens.colors.secondary,
    opacity: 0.1,
    marginLeft: 64,
    marginRight: 16,
  },
});