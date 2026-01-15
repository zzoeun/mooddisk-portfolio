import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLocation } from '../../../../hooks/useLocation';
import { findNearbyPlaces, reverseGeocode } from '../../../../utils/locationUtils';
import { PlaceDetails } from '../../../../utils/googlePlaces';
import DesignTokens from '../../../../constants/designTokens';
import { useIsTablet } from '../../../../hooks/useDeviceInfo';
import { getMaxWidth } from '../../../../utils/deviceUtils';

export interface LocationInfo {
  latitude: number;
  longitude: number;
  locationName?: string;
  address?: string;
}

interface LocationPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectLocation: (location: LocationInfo) => void;
}

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  visible,
  onClose,
  onSelectLocation,
}) => {
  const isTablet = useIsTablet();
  const { getCurrentLocation, isLoading: isLocationLoading } = useLocation();
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const [places, setPlaces] = useState<PlaceDetails[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);

  // 모달이 열릴 때 현재 위치 가져오기
  useEffect(() => {
    if (visible) {
      loadCurrentLocationAndPlaces();
    } else {
      // 모달이 닫힐 때 상태 초기화
      setPlaces([]);
      setCurrentLocation(null);
      setCurrentAddress(null);
    }
  }, [visible]);

  const loadCurrentLocationAndPlaces = async () => {
    try {
      setIsLoadingPlaces(true);
      
      // 현재 위치 가져오기
      const location = await getCurrentLocation();
      if (!location) {
        Alert.alert('위치 오류', '현재 위치를 가져올 수 없습니다.');
        setIsLoadingPlaces(false);
        return;
      }

      setCurrentLocation({
        latitude: location.latitude,
        longitude: location.longitude,
      });

      // 역지오코딩으로 주소 가져오기
      try {
        const geocodeResult = await reverseGeocode(
          location.latitude,
          location.longitude
        );
        if (geocodeResult) {
          // 국가명 제거 후 저장
          const cleanedAddress = removeCountryFromAddress(geocodeResult.address);
          setCurrentAddress(cleanedAddress);
        } else {
          setCurrentAddress(null);
        }
      } catch (error) {
        console.error('역지오코딩 실패:', error);
        setCurrentAddress(null);
      }

      // 근처 장소 검색
      const nearbyPlaces = await findNearbyPlaces(
        location.latitude,
        location.longitude,
        10
      );

      setPlaces(nearbyPlaces);
    } catch (error) {
      console.error('위치 및 장소 검색 실패:', error);
      Alert.alert('오류', '장소를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoadingPlaces(false);
    }
  };

  const handleSelectPlace = (place: PlaceDetails) => {
    // getPlaceDisplayName 함수를 사용하여 장소명 추출
    let locationName = getPlaceDisplayName(place);

    // '위치'로 fallback된 경우 주소의 첫 부분 사용
    if (locationName === '위치' && place.formatted_address) {
      locationName = place.formatted_address.split(',')[0].trim();
    }

    console.log('📍 선택한 장소:', {
      displayName: place.displayName,
      locationName,
      formatted_address: place.formatted_address,
    });

    // 주소에서 국가명 제거
    const cleanedAddress = removeCountryFromAddress(place.formatted_address || '');
    
    onSelectLocation({
      latitude: place.geometry.location.lat,
      longitude: place.geometry.location.lng,
      locationName: locationName && locationName.trim() && locationName !== '위치' ? locationName.trim() : undefined,
      address: cleanedAddress || place.formatted_address || '',
    });

    onClose();
  };

  const handleSelectCurrentLocation = async () => {
    if (!currentLocation) return;

    // 역지오코딩을 통해 주소 가져오기
    try {
      const geocodeResult = await reverseGeocode(
        currentLocation.latitude,
        currentLocation.longitude
      );

      if (geocodeResult) {
        // 국가명 제거 후 저장
        const cleanedAddress = removeCountryFromAddress(geocodeResult.address);
        // 주소 옆에 "인근" 추가
        const locationNameWithNearby = cleanedAddress 
          ? `${cleanedAddress} 인근`
          : geocodeResult.address 
            ? `${geocodeResult.address} 인근`
            : '인근';
        onSelectLocation({
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          locationName: locationNameWithNearby,
          address: cleanedAddress || geocodeResult.address,
        });
      } else {
        // 역지오코딩 실패 시 좌표만 저장 (locationName은 "인근"으로 설정)
        onSelectLocation({
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        });
      }
    } catch (error) {
      console.error('역지오코딩 실패:', error);
      // 오류 발생 시 좌표만 저장 (locationName은 "인근"으로 설정)
      onSelectLocation({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      });
    }

    onClose();
  };

  // 주소에서 국가명 제거 (모든 국가)
  const removeCountryFromAddress = (address: string | null): string | null => {
    if (!address) return null;
    
    let cleanedAddress = address.trim();
    
    // 주소를 쉼표로 분리
    const parts = cleanedAddress.split(/[,，]/).map(part => part.trim()).filter(part => part.length > 0);
    
    if (parts.length === 0) return null;
    
    // 일반적인 국가명 목록 (앞이나 뒤에 있을 수 있음)
    const countryNames = [
      // 한국
      '대한민국', 'South Korea', 'Republic of Korea', 'Korea',
      // 미국
      'United States', 'United States of America', 'USA', 'US',
      // 일본
      'Japan', '일본',
      // 중국
      'China', "People's Republic of China", 'PRC', '중국',
      // 기타 주요 국가들
      'United Kingdom', 'UK', 'Great Britain',
      'France', 'Germany', 'Italy', 'Spain',
      'Canada', 'Australia', 'India', 'Brazil', 'Mexico', 'Russia',
      'Thailand', 'Vietnam', 'Singapore', 'Indonesia', 'Philippines', 'Malaysia',
      'Egypt', 'Turkey', 'Greece', 'Portugal', 'Netherlands', 'Belgium',
      'Switzerland', 'Austria', 'Sweden', 'Norway', 'Denmark', 'Finland',
      'Poland', 'Czech Republic', 'Hungary', 'Romania', 'Bulgaria',
      'Argentina', 'Chile', 'Peru', 'Colombia', 'Venezuela',
      'New Zealand', 'South Africa', 'Kenya', 'Morocco', 'Tunisia',
    ];
    
    // 대소문자 무시 비교를 위한 함수
    const isCountryName = (name: string): boolean => {
      const normalizedName = name.trim();
      return countryNames.some(country => 
        normalizedName.toLowerCase() === country.toLowerCase()
      );
    };
    
    // 첫 번째 부분이 국가명인지 확인
    if (parts.length > 0 && isCountryName(parts[0])) {
      parts.shift(); // 첫 번째 부분 제거
    }
    
    // 마지막 부분이 국가명인지 확인
    if (parts.length > 0 && isCountryName(parts[parts.length - 1])) {
      parts.pop(); // 마지막 부분 제거
    }
    
    // 다시 합치기
    cleanedAddress = parts.join(', ').trim();
    
    // 추가로 앞뒤에서 국가명 제거 (혹시 모를 경우)
    countryNames.forEach(country => {
      const escapedCountry = country.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      cleanedAddress = cleanedAddress.replace(new RegExp(`^${escapedCountry}\\s*[,，]\\s*`, 'i'), '');
      cleanedAddress = cleanedAddress.replace(new RegExp(`\\s*[,，]\\s*${escapedCountry}$`, 'i'), '');
      cleanedAddress = cleanedAddress.replace(new RegExp(`^${escapedCountry}\\s+`, 'i'), '');
      cleanedAddress = cleanedAddress.replace(new RegExp(`\\s+${escapedCountry}$`, 'i'), '');
    });
    
    return cleanedAddress.trim() || null;
  };

  const getPlaceDisplayName = (place: PlaceDetails): string => {
    // 1. displayName이 있으면 우선 사용 (가장 정확한 장소명)
    if (place.displayName) {
      return place.displayName;
    }

    // 2. address_components에서 장소명 찾기
    const addressComponents = place.address_components || [];
    for (const component of addressComponents) {
      if (
        component.types.includes('tourist_attraction') ||
        component.types.includes('lodging') ||
        component.types.includes('restaurant') ||
        component.types.includes('cafe') ||
        component.types.includes('store') ||
        component.types.includes('shopping_mall')
      ) {
        return component.long_name;
      }
    }

    // 3. formatted_address의 첫 부분 사용 (주소의 첫 번째 요소)
    if (place.formatted_address) {
      return place.formatted_address.split(',')[0].trim();
    }

    return '위치';
  };

  const dynamicStyles = isTablet ? {
    container: { ...styles.container, paddingHorizontal: 40 },
    contentWrapper: { ...styles.contentWrapper, maxWidth: getMaxWidth(), alignSelf: 'center' as const },
  } : {};

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, dynamicStyles.container]}>
        {/* 태블릿 모드 여백을 위한 래퍼 */}
        <View style={[styles.contentWrapper, dynamicStyles.contentWrapper]}>
          {/* 헤더 */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>내 위치</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>닫기</Text>
            </TouchableOpacity>
          </View>

          {/* 내용 */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* 로딩 상태 */}
            {(isLocationLoading || isLoadingPlaces) && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={DesignTokens.colors.primary} />
                <Text style={styles.loadingText}>
                  {isLocationLoading ? '위치 정보를 가져오는 중...' : '인근 장소를 검색하는 중...'}
                </Text>
              </View>
            )}

            {/* 장소 리스트 */}
            {!isLocationLoading && !isLoadingPlaces && (
              <View style={styles.placeList}>
                {/* "이 근처로만 표시" 옵션 */}
                {currentLocation && (
                  <TouchableOpacity
                    style={styles.optionItem}
                    onPress={handleSelectCurrentLocation}
                  >
                    <View style={styles.optionIcon}>
                      <Feather name="map-pin" size={24} color={DesignTokens.colors.primary} />
                    </View>
                    <View style={styles.optionContent}>
                      <Text style={styles.optionTitle}>이 근처로 표시</Text>
                      <Text style={styles.optionSubtitle}>
                        {currentAddress || `${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}`}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}

                {/* 장소 리스트 */}
                {places.length > 0 ? (
                  places.map((place, index) => (
                    <TouchableOpacity
                      key={place.place_id || index}
                      style={styles.placeItem}
                      onPress={() => handleSelectPlace(place)}
                    >
                      <View style={styles.placeIcon}>
                        <Feather name="map-pin" size={24} color={DesignTokens.colors.primary} />
                      </View>
                      <View style={styles.placeContent}>
                        <Text style={styles.placeName}>
                          {getPlaceDisplayName(place)}
                        </Text>
                        {place.formatted_address && (
                          <Text style={styles.placeAddress} numberOfLines={2}>
                            {removeCountryFromAddress(place.formatted_address) || place.formatted_address}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>근처에 장소를 찾을 수 없습니다</Text>
                    <Text style={styles.emptySubText}>다시 시도해주세요</Text>
                    <TouchableOpacity
                      style={styles.retryButton}
                      onPress={loadCurrentLocationAndPlaces}
                    >
                      <Text style={styles.retryButtonText}>다시 시도</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignTokens.colors.background,
  },
  contentWrapper: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 3,
    borderBottomColor: DesignTokens.colors.border,
    backgroundColor: DesignTokens.colors.background,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: DesignTokens.colors.primary,
    fontFamily: DesignTokens.fonts.default,
    textTransform: 'uppercase',
  },
  closeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: DesignTokens.colors.alert,
    borderWidth: 2,
    borderColor: DesignTokens.colors.text,
  },
  closeButtonText: {
    fontSize: 14,
    color: DesignTokens.colors.text,
    fontWeight: 'bold',
    fontFamily: DesignTokens.fonts.default,
    textTransform: 'uppercase',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: DesignTokens.colors.gray,
    fontFamily: DesignTokens.fonts.default,
    marginTop: 16,
  },
  placeList: {
    padding: 20,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: DesignTokens.colors.background,
    borderWidth: 3,
    borderColor: DesignTokens.colors.border,
    marginBottom: 12,
  },
  optionIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: DesignTokens.colors.primary,
    fontFamily: DesignTokens.fonts.default,
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 12,
    color: DesignTokens.colors.gray,
    fontFamily: DesignTokens.fonts.default,
  },
  placeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: DesignTokens.colors.background,
    borderWidth: 3,
    borderColor: DesignTokens.colors.border,
    marginBottom: 12,
  },
  placeIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  placeContent: {
    flex: 1,
  },
  placeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: DesignTokens.colors.gray,
    fontFamily: DesignTokens.fonts.default,
    marginBottom: 4,
  },
  placeAddress: {
    fontSize: 12,
    color: DesignTokens.colors.gray,
    fontFamily: DesignTokens.fonts.default,
    lineHeight: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: DesignTokens.colors.primary,
    marginBottom: 8,
    fontFamily: DesignTokens.fonts.default,
    textTransform: 'uppercase',
  },
  emptySubText: {
    fontSize: 14,
    color: DesignTokens.colors.text,
    fontFamily: DesignTokens.fonts.default,
    marginBottom: 16,
  },
  retryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: DesignTokens.colors.accent,
    borderWidth: 2,
    borderColor: DesignTokens.colors.text,
    alignItems: 'center',
  },
  retryButtonText: {
    color: DesignTokens.colors.text,
    fontWeight: 'bold',
    fontFamily: DesignTokens.fonts.default,
    fontSize: 14,
    textTransform: 'uppercase',
  },
});

