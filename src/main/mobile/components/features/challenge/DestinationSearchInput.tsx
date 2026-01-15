import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useDebounce } from '../../../hooks/useDebounce';
import {
  searchPlaces,
  getPlaceTypeLabel,
  getPlaceIcon,
  PlacePrediction,
  getGooglePlacesApiKey,
  generateSessionToken,
  getPlaceDetails,
  PlaceDetails,
} from '../../../utils/googlePlaces';
import DesignTokens from '../../../constants/designTokens';

interface DestinationSearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSelect: (place: PlacePrediction, placeDetails?: PlaceDetails) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const DestinationSearchInput: React.FC<DestinationSearchInputProps> = ({
  value,
  onChangeText,
  onSelect,
  placeholder = '예: 도쿄, 파리, 서울',
  disabled = false,
}) => {
  const [searchResults, setSearchResults] = useState<PlacePrediction[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | undefined>(undefined);
  const debouncedQuery = useDebounce(value, 300);

  // Session Token 생성 (검색 시작 시)
  useEffect(() => {
    if (debouncedQuery.trim() && !sessionToken) {
      setSessionToken(generateSessionToken());
    }
  }, [debouncedQuery]);

  // 검색 실행
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedQuery.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const apiKey = getGooglePlacesApiKey();
        // Session Token이 없으면 생성
        const token = sessionToken || generateSessionToken();
        if (!sessionToken) {
          setSessionToken(token);
        }
        const results = await searchPlaces(debouncedQuery, apiKey, token);
        setSearchResults(results);
      } catch (error) {
        console.error('검색 실패:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [debouncedQuery, sessionToken]);

  // 검색 결과 선택 핸들러
  const handleSelectPlace = useCallback(
    async (place: PlacePrediction) => {
      onChangeText(place.description);
      setSearchResults([]);
      setIsFocused(false);

      // Place Details API 호출하여 좌표 가져오기
      try {
        const apiKey = getGooglePlacesApiKey();
        const placeDetails = await getPlaceDetails(place.place_id, apiKey, sessionToken);
        onSelect(place, placeDetails || undefined);
        
        // Session Token 사용 후 초기화 (다음 검색을 위해)
        setSessionToken(undefined);
      } catch (error) {
        console.error('Place Details 조회 실패:', error);
        // Place Details 실패해도 기본 정보는 전달
        onSelect(place, undefined);
        setSessionToken(undefined);
      }
    },
    [onSelect, onChangeText, sessionToken]
  );

  // 검색어 클리어
  const handleClear = useCallback(() => {
    onChangeText('');
    setSearchResults([]);
  }, [onChangeText]);

  // 검색 결과 아이템 렌더링
  const renderSearchItem = useCallback(
    ({ item }: { item: PlacePrediction }) => {
      const iconName = getPlaceIcon(item.types);
      const typeLabel = getPlaceTypeLabel(item.types);

      return (
        <TouchableOpacity
          style={styles.searchItem}
          onPress={() => handleSelectPlace(item)}
          activeOpacity={0.7}
        >
          <View style={styles.searchItemIcon}>
            <Feather name={iconName as any} size={20} color="#007AFF" />
          </View>
          <View style={styles.searchItemContent}>
            <Text style={styles.searchItemMainText}>
              {item.structured_formatting.main_text}
            </Text>
            <Text style={styles.searchItemSecondaryText}>
              {typeLabel} | {item.structured_formatting.secondary_text}
            </Text>
          </View>
        </TouchableOpacity>
      );
    },
    [handleSelectPlace]
  );

  const showResults = isFocused && (searchResults.length > 0 || isSearching);

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
        ]}
      >
        <Feather
          name="search"
          size={20}
          color={isFocused ? DesignTokens.colors.primary : DesignTokens.colors.mediumGray}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={DesignTokens.colors.mediumGray}
          editable={!disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            // 약간의 지연을 두어 onPress 이벤트가 먼저 실행되도록
            setTimeout(() => setIsFocused(false), 200);
          }}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {value.length > 0 && (
          <TouchableOpacity
            onPress={handleClear}
            style={styles.clearButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="x" size={18} color={DesignTokens.colors.mediumGray} />
          </TouchableOpacity>
        )}
        {isSearching && (
          <ActivityIndicator
            size="small"
            color={DesignTokens.colors.primary}
            style={styles.loadingIndicator}
          />
        )}
      </View>

      {/* 검색 결과를 inputGroup 내부에 포함시켜 ScrollView 내부에서만 표시 */}
      {showResults && (
        <View style={styles.resultsContainer}>
          {isSearching && searchResults.length === 0 ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator
                size="small"
                color={DesignTokens.colors.primary}
              />
              <Text style={styles.emptyText}>검색 중...</Text>
            </View>
          ) : searchResults.length > 0 ? (
            <ScrollView
              style={styles.resultsList}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled={true}
            >
              {searchResults.map((item) => (
                <View key={item.place_id}>
                  {renderSearchItem({ item })}
                </View>
              ))}
            </ScrollView>
          ) : null}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: DesignTokens.colors.border,
    backgroundColor: DesignTokens.colors.background,
    paddingHorizontal: 12,
    minHeight: 44,
  },
  inputContainerFocused: {
    borderColor: DesignTokens.colors.primary,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: DesignTokens.colors.text,
    fontFamily: DesignTokens.fonts.default,
    paddingVertical: 12,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  loadingIndicator: {
    marginLeft: 8,
  },
  resultsContainer: {
    marginTop: 0,
    maxHeight: 150, // 높이를 더 제한하여 아래 필드를 확실히 가리지 않도록
    backgroundColor: DesignTokens.colors.background,
    borderWidth: 2,
    borderColor: DesignTokens.colors.border,
    borderTopWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultsList: {
    maxHeight: 150,
  },
  searchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: DesignTokens.colors.lightGray,
  },
  searchItemIcon: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  searchItemContent: {
    flex: 1,
  },
  searchItemMainText: {
    fontSize: 16,
    fontWeight: '600',
    color: DesignTokens.colors.text,
    marginBottom: 4,
    fontFamily: DesignTokens.fonts.default,
  },
  searchItemSecondaryText: {
    fontSize: 14,
    color: DesignTokens.colors.mediumGray,
    fontFamily: DesignTokens.fonts.default,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: DesignTokens.colors.mediumGray,
    fontFamily: DesignTokens.fonts.default,
  },
});
