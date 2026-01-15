import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { createTravelLog } from '@mooddisk/api';
import DesignTokens from '../../../constants/designTokens';
import { useIsTablet } from '../../../hooks/useDeviceInfo';
import { getMaxWidth } from '../../../utils/deviceUtils';
import { DestinationSearchInput } from './DestinationSearchInput';
import { PlacePrediction, PlaceDetails } from '../../../utils/googlePlaces';

interface TravelLogCreateModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const TravelLogCreateModal: React.FC<TravelLogCreateModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const isTablet = useIsTablet();
  const [logName, setLogName] = useState('');
  const [destination, setDestination] = useState('');
  const [selectedPlace, setSelectedPlace] = useState<PlacePrediction | null>(null);
  const [selectedPlaceDetails, setSelectedPlaceDetails] = useState<PlaceDetails | null>(null);
  const [departureDate, setDepartureDate] = useState<Date | null>(null);
  const [returnDate, setReturnDate] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 날짜 선택 모달 상태
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerType, setDatePickerType] = useState<'departure' | 'return'>('departure');
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  // 날짜를 YYYY-MM-DD 형식으로 변환
  const formatDateToString = (date: Date | null): string => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 문자열을 Date로 변환
  const parseDateString = (dateString: string): Date | null => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime()) ? date : null;
  };

  // 달력 날짜 생성
  const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number): number => {
    return new Date(year, month, 1).getDay();
  };

  const getCalendarDays = (month: Date) => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const daysInMonth = getDaysInMonth(year, monthIndex);
    const firstDay = getFirstDayOfMonth(year, monthIndex);
    
    const days = [];
    
    // 이전 달 날짜
    const prevMonthDays = getDaysInMonth(year, monthIndex - 1);
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, monthIndex - 1, prevMonthDays - i),
        isCurrentMonth: false,
      });
    }
    
    // 현재 달 날짜
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        date: new Date(year, monthIndex, day),
        isCurrentMonth: true,
      });
    }
    
    // 다음 달 날짜 (42개 셀 채우기)
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        date: new Date(year, monthIndex + 1, day),
        isCurrentMonth: false,
      });
    }
    
    return days;
  };

  // 날짜 선택 핸들러
  const handleDateSelect = (date: Date) => {
    if (datePickerType === 'departure') {
      setDepartureDate(date);
      // 출발일이 귀국일보다 늦으면 귀국일 초기화
      if (returnDate && date > returnDate) {
        setReturnDate(null);
      }
    } else {
      // 귀국일은 출발일 이후여야 함
      if (departureDate && date < departureDate) {
        Alert.alert('입력 오류', '귀국일은 출발일 이후여야 합니다.');
        return;
      }
      setReturnDate(date);
    }
    setShowDatePicker(false);
  };

  // 날짜 선택 버튼 클릭
  const handleDateButtonPress = (type: 'departure' | 'return') => {
    setDatePickerType(type);
    // 선택된 날짜가 있으면 해당 월로, 없으면 오늘 날짜로
    const targetDate = type === 'departure' ? departureDate : returnDate;
    if (targetDate) {
      setSelectedMonth(new Date(targetDate.getFullYear(), targetDate.getMonth()));
      setCurrentYear(targetDate.getFullYear());
    } else {
      setSelectedMonth(new Date());
      setCurrentYear(new Date().getFullYear());
    }
    setShowDatePicker(true);
  };

  // 목적지를 JSON 형식으로 변환
  const formatDestinationToJson = (
    destinationName: string,
    place: PlacePrediction | null,
    placeDetails: PlaceDetails | null
  ): string => {
    // 선택된 장소 정보가 있으면 사용, 없으면 기본값 사용
    let country = '';
    
    if (place?.structured_formatting?.secondary_text) {
      const parts = place.structured_formatting.secondary_text.split(',');
      country = parts[parts.length - 1]?.trim() || '';
    }
    
    // Place Details에서 주소 컴포넌트로부터 나라 정보 추출
    if (placeDetails?.address_components) {
      const countryComponent = placeDetails.address_components.find(
        (component) => component.types.includes('country')
      );
      if (countryComponent) {
        country = countryComponent.long_name;
      }
    }
    
    // 좌표 가져오기 (Place Details에서)
    const lat = placeDetails?.geometry?.location?.lat || 0;
    const lon = placeDetails?.geometry?.location?.lng || 0;
    
    const destinationData = [{
      name: place?.structured_formatting?.main_text || destinationName.trim(),
      country: country,
      continent: '', // 나중에 지도 API로 채울 수 있음
      lat: lat,
      lon: lon,
    }];
    
    return JSON.stringify(destinationData);
  };

  // 장소 선택 핸들러
  const handlePlaceSelect = (place: PlacePrediction, placeDetails?: PlaceDetails) => {
    setSelectedPlace(place);
    setSelectedPlaceDetails(placeDetails || null);
  };

  const handleSubmit = async () => {
    // 유효성 검증
    if (!destination.trim()) {
      Alert.alert('입력 오류', '여행지를 입력해주세요.');
      return;
    }

    if (!departureDate) {
      Alert.alert('입력 오류', '출발하는 날을 선택해주세요.');
      return;
    }

    if (!returnDate) {
      Alert.alert('입력 오류', '돌아오는 날을 선택해주세요.');
      return;
    }

    if (returnDate < departureDate) {
      Alert.alert('입력 오류', '귀국일은 출발일 이후여야 합니다.');
      return;
    }

    setIsSubmitting(true);

    try {
      const destinationsJson = formatDestinationToJson(destination, selectedPlace, selectedPlaceDetails);
      
      // 타임존은 백엔드에서 자동 계산하도록 함 (Google Time Zone API 권한 문제 방지)
      // destinations JSON에 좌표가 포함되어 있으므로 백엔드에서 첫 번째 목적지 좌표로 타임존 계산 가능
      
      await createTravelLog({
        logName: logName.trim() || undefined,
        destinations: destinationsJson,
        departureDate: formatDateToString(departureDate),
        returnDate: formatDateToString(returnDate),
      } as any);

      // 성공 시 상태 초기화
      setLogName('');
      setDestination('');
      setSelectedPlace(null);
      setSelectedPlaceDetails(null);
      setDepartureDate(null);
      setReturnDate(null);
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('TRAVEL.LOG 생성 실패:', error);
      Alert.alert(
        '생성 실패',
        error?.response?.data?.message || 'TRAVEL.LOG 생성에 실패했습니다. 다시 시도해주세요.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setLogName('');
      setDestination('');
      setSelectedPlace(null);
      setSelectedPlaceDetails(null);
      setDepartureDate(null);
      setReturnDate(null);
      setShowDatePicker(false);
      onClose();
    }
  };

  const calendarDays = getCalendarDays(selectedMonth);
  const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={[
          styles.modalContainer,
          isTablet && {
            maxWidth: getMaxWidth(),
            width: '90%',
          }
        ]}>
          <View style={styles.header}>
            <Text style={styles.title}>TRAVEL.LOG 시작</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              disabled={isSubmitting}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* 로그 이름 입력 (선택) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>LOG 이름</Text>
              <TextInput
                style={styles.input}
                value={logName}
                onChangeText={setLogName}
                placeholder="미입력시 여행지 이름으로 자동 설정됩니다."
                placeholderTextColor={DesignTokens.colors.mediumGray}
                editable={!isSubmitting}
              />
            </View>

            {/* 목적지 입력 (필수) */}
            <View style={[styles.inputGroup, styles.destinationInputGroup]}>
              <Text style={styles.label}>
                여행지 <Text style={styles.required}>*</Text>
              </Text>
              <DestinationSearchInput
                value={destination}
                onChangeText={setDestination}
                onSelect={handlePlaceSelect}
                placeholder="예: 대한민국, 카이로, 파리"
                disabled={isSubmitting}
              />
            </View>

            {/* 출발일 선택 (필수) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                출발하는 날 <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => handleDateButtonPress('departure')}
                disabled={isSubmitting}
              >
                <Text style={[
                  styles.dateButtonText,
                  !departureDate && styles.dateButtonPlaceholder
                ]}>
                  {departureDate ? formatDateToString(departureDate) : '날짜를 선택하세요'}
                </Text>
                <View style={styles.dateButtonIcon}>
                  <Feather name="calendar" size={20} color={DesignTokens.colors.text} />
                </View>
              </TouchableOpacity>
            </View>

            {/* 귀국일 선택 (필수) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                돌아오는 날 <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => handleDateButtonPress('return')}
                disabled={isSubmitting}
              >
                <Text style={[
                  styles.dateButtonText,
                  !returnDate && styles.dateButtonPlaceholder
                ]}>
                  {returnDate ? formatDateToString(returnDate) : '날짜를 선택하세요'}
                </Text>
                <View style={styles.dateButtonIcon}>
                  <Feather name="calendar" size={20} color={DesignTokens.colors.text} />
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* 하단 버튼 */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.cancelButton, isSubmitting && styles.disabledButton]}
              onPress={handleClose}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelButtonText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.submitButton,
                isSubmitting && styles.disabledButton
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? '생성 중...' : '시작하기'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 날짜 선택 모달 */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <TouchableOpacity
          style={styles.datePickerOverlay}
          activeOpacity={1}
          onPress={() => setShowDatePicker(false)}
        >
          <View style={styles.datePickerContainer} onStartShouldSetResponder={() => true}>
            {/* 헤더 */}
            <View style={styles.datePickerHeader}>
              <Text style={styles.datePickerTitle}>
                {datePickerType === 'departure' ? '출발일 선택' : '귀국일 선택'}
              </Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(false)}
                style={styles.datePickerCloseButton}
              >
                <Text style={styles.datePickerCloseButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* 월 선택 바 */}
            <View style={styles.monthNavContainer}>
              <TouchableOpacity
                onPress={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1))}
                style={styles.monthNavButton}
              >
                <Feather name="chevron-left" size={20} color={DesignTokens.colors.text} />
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => {
                  setCurrentYear(selectedMonth.getFullYear());
                  setShowMonthPicker(true);
                }}
                style={styles.monthDisplayButton}
              >
                <Text style={styles.monthDisplayText}>
                  {`${selectedMonth.getFullYear()}.${String(selectedMonth.getMonth() + 1).padStart(2, '0')}`}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1))}
                style={styles.monthNavButton}
              >
                <Feather name="chevron-right" size={20} color={DesignTokens.colors.text} />
              </TouchableOpacity>
            </View>

            {/* 요일 헤더 */}
            <View style={styles.weekdayHeader}>
              {WEEKDAYS.map((day, index) => (
                <View key={day} style={styles.weekdayContainer}>
                  <Text
                    style={[
                      styles.weekdayText,
                      index === 0 && styles.sunday,
                      index === 6 && styles.saturday,
                    ]}
                  >
                    {day}
                  </Text>
                </View>
              ))}
            </View>

            {/* 달력 그리드 */}
            <View style={styles.calendarGrid}>
              {calendarDays.map((day, index) => {
                const isSelected = 
                  (datePickerType === 'departure' && departureDate && 
                   day.date.getTime() === departureDate.getTime()) ||
                  (datePickerType === 'return' && returnDate && 
                   day.date.getTime() === returnDate.getTime());
                
                const isToday = (() => {
                  const today = new Date();
                  return (
                    day.date.getFullYear() === today.getFullYear() &&
                    day.date.getMonth() === today.getMonth() &&
                    day.date.getDate() === today.getDate()
                  );
                })();

                const isDisabled = Boolean(
                  !day.isCurrentMonth ||
                  (datePickerType === 'return' && departureDate && day.date < departureDate) ||
                  (datePickerType === 'departure' && returnDate && day.date > returnDate)
                );

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.calendarCell,
                      !day.isCurrentMonth && styles.calendarCellOtherMonth,
                      isSelected && styles.calendarCellSelected,
                      isToday && !isSelected && styles.calendarCellToday,
                      isDisabled && styles.calendarCellDisabled,
                    ]}
                    onPress={() => !isDisabled && handleDateSelect(day.date)}
                    disabled={isDisabled}
                  >
                    <Text
                      style={[
                        styles.calendarCellText,
                        !day.isCurrentMonth && styles.calendarCellTextOtherMonth,
                        isSelected && styles.calendarCellTextSelected,
                        isToday && !isSelected && styles.calendarCellTextToday,
                        isDisabled && styles.calendarCellTextDisabled,
                      ]}
                    >
                      {day.date.getDate()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 월 선택 팝업 */}
            <Modal
              visible={showMonthPicker}
              transparent={true}
              animationType="fade"
              onRequestClose={() => setShowMonthPicker(false)}
            >
              <TouchableOpacity
                style={styles.monthPickerOverlay}
                activeOpacity={1}
                onPress={() => setShowMonthPicker(false)}
              >
                <View style={styles.monthPickerContainer}>
                  <View style={styles.monthGrid}>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                      const isSelected = 
                        selectedMonth.getMonth() === month - 1 && 
                        selectedMonth.getFullYear() === currentYear;
                      
                      return (
                        <TouchableOpacity
                          key={month}
                          onPress={() => {
                            setSelectedMonth(new Date(currentYear, month - 1));
                            setShowMonthPicker(false);
                          }}
                          style={[
                            styles.monthPickerButton,
                            isSelected && styles.monthPickerButtonSelected
                          ]}
                        >
                          <Text style={[
                            styles.monthPickerButtonText,
                            isSelected && styles.monthPickerButtonTextSelected
                          ]}>
                            {month}월
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  
                  {/* 년도 네비게이션 */}
                  <View style={styles.yearNav}>
                    <TouchableOpacity
                      onPress={() => setCurrentYear(currentYear - 1)}
                      style={styles.yearButton}
                    >
                      <Feather name="chevron-left" size={16} color={DesignTokens.colors.text} />
                      <Text style={styles.yearButtonText}>{currentYear - 1}</Text>
                    </TouchableOpacity>
                    
                    <Text style={styles.yearText}>{currentYear}</Text>
                    
                    <TouchableOpacity
                      onPress={() => setCurrentYear(currentYear + 1)}
                      style={styles.yearButton}
                    >
                      <Text style={styles.yearButtonText}>{currentYear + 1}</Text>
                      <Feather name="chevron-right" size={16} color={DesignTokens.colors.text} />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            </Modal>
          </View>
        </TouchableOpacity>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: DesignTokens.colors.background,
    borderWidth: 3,
    borderColor: DesignTokens.colors.border,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 2,
    borderBottomColor: DesignTokens.colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: DesignTokens.colors.primary,
    fontFamily: DesignTokens.fonts.default,
    textTransform: 'uppercase',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: DesignTokens.colors.text,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  destinationInputGroup: {
    marginBottom: 24, // 검색 결과가 표시될 때를 대비해 여백 유지
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: DesignTokens.colors.text,
    marginBottom: 8,
    fontFamily: DesignTokens.fonts.default,
  },
  required: {
    color: DesignTokens.colors.alert,
  },
  input: {
    borderWidth: 2,
    borderColor: DesignTokens.colors.border,
    backgroundColor: DesignTokens.colors.background,
    padding: 12,
    fontSize: 16,
    color: DesignTokens.colors.text,
    fontFamily: DesignTokens.fonts.default,
  },
  hint: {
    fontSize: 12,
    color: DesignTokens.colors.mediumGray,
    marginTop: 4,
    fontFamily: DesignTokens.fonts.default,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 2,
    borderTopColor: DesignTokens.colors.border,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: DesignTokens.colors.border,
    backgroundColor: DesignTokens.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: DesignTokens.colors.text,
    fontFamily: DesignTokens.fonts.default,
    textTransform: 'uppercase',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: DesignTokens.colors.text,
    backgroundColor: DesignTokens.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: DesignTokens.colors.text,
    fontFamily: DesignTokens.fonts.default,
    textTransform: 'uppercase',
  },
  disabledButton: {
    opacity: 0.5,
  },
  // 날짜 선택 버튼
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: DesignTokens.colors.border,
    backgroundColor: DesignTokens.colors.background,
    padding: 12,
    minHeight: 44,
  },
  dateButtonText: {
    fontSize: 16,
    color: DesignTokens.colors.text,
    fontFamily: DesignTokens.fonts.default,
    flex: 1,
  },
  dateButtonPlaceholder: {
    color: DesignTokens.colors.mediumGray,
  },
  dateButtonIcon: {
    marginLeft: 8,
  },
  // 날짜 선택 모달
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
  },
  datePickerContainer: {
    backgroundColor: DesignTokens.colors.background,
    borderWidth: 3,
    borderColor: DesignTokens.colors.border,
    padding: 20,
    marginHorizontal: 16,
    width: '100%',
    maxWidth: 400,
    zIndex: 10001,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: DesignTokens.colors.border,
    paddingBottom: 12,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: DesignTokens.colors.primary,
    fontFamily: DesignTokens.fonts.default,
    textTransform: 'uppercase',
  },
  datePickerCloseButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerCloseButtonText: {
    fontSize: 24,
    color: DesignTokens.colors.text,
    fontWeight: 'bold',
  },
  monthNavContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 16,
  },
  monthNavButton: {
    padding: 8,
    backgroundColor: DesignTokens.colors.accent,
    borderWidth: 2,
    borderColor: DesignTokens.colors.border,
  },
  monthDisplayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  monthDisplayText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: DesignTokens.colors.primary,
    fontFamily: DesignTokens.fonts.default,
    textTransform: 'uppercase',
  },
  weekdayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekdayContainer: {
    flex: 1,
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: DesignTokens.colors.text,
    fontFamily: DesignTokens.fonts.default,
    textTransform: 'uppercase',
  },
  sunday: {
    color: DesignTokens.colors.alert,
  },
  saturday: {
    color: DesignTokens.colors.accent,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  calendarCell: {
    width: '13%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    borderWidth: 2,
    borderColor: DesignTokens.colors.border,
    backgroundColor: DesignTokens.colors.background,
  },
  calendarCellOtherMonth: {
    opacity: 0.3,
  },
  calendarCellSelected: {
    backgroundColor: DesignTokens.colors.alert,
    borderColor: DesignTokens.colors.text,
  },
  calendarCellToday: {
    borderColor: DesignTokens.colors.accent,
    borderWidth: 3,
  },
  calendarCellDisabled: {
    opacity: 0.3,
  },
  calendarCellText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: DesignTokens.colors.text,
    fontFamily: DesignTokens.fonts.default,
  },
  calendarCellTextOtherMonth: {
    color: DesignTokens.colors.mediumGray,
  },
  calendarCellTextSelected: {
    color: DesignTokens.colors.text,
  },
  calendarCellTextToday: {
    color: DesignTokens.colors.accent,
  },
  calendarCellTextDisabled: {
    color: DesignTokens.colors.mediumGray,
  },
  // 월 선택 팝업
  monthPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthPickerContainer: {
    backgroundColor: DesignTokens.colors.background,
    borderWidth: 3,
    borderColor: DesignTokens.colors.border,
    padding: 24,
    marginHorizontal: 16,
    width: '100%',
    maxWidth: 384,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  monthPickerButton: {
    width: '30%',
    paddingVertical: 12,
    backgroundColor: DesignTokens.colors.background,
    borderWidth: 2,
    borderColor: DesignTokens.colors.border,
    alignItems: 'center',
  },
  monthPickerButtonSelected: {
    backgroundColor: DesignTokens.colors.alert,
    borderColor: DesignTokens.colors.text,
  },
  monthPickerButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: DesignTokens.colors.primary,
    fontFamily: DesignTokens.fonts.default,
    textTransform: 'uppercase',
  },
  monthPickerButtonTextSelected: {
    color: DesignTokens.colors.text,
  },
  yearNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  yearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: DesignTokens.colors.accent,
    borderWidth: 2,
    borderColor: DesignTokens.colors.border,
  },
  yearButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: DesignTokens.colors.text,
    fontFamily: DesignTokens.fonts.default,
  },
  yearText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: DesignTokens.colors.primary,
    fontFamily: DesignTokens.fonts.default,
    textTransform: 'uppercase',
  },
});
