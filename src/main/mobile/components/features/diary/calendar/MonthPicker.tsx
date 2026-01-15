import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import DesignTokens from '../../../../constants/designTokens';

interface MonthPickerProps {
  selectedMonth: Date;
  onMonthChange: (month: Date) => void;
  showAllTime: boolean;
  onAllTimeChange: (show: boolean) => void;
  showMonthPicker: boolean;
  onMonthPickerToggle: (show: boolean) => void;
  currentYear: number;
  onYearChange: (year: number) => void;
}

const MonthPicker: React.FC<MonthPickerProps> = ({
  selectedMonth,
  onMonthChange,
  showAllTime,
  onAllTimeChange,
  showMonthPicker,
  onMonthPickerToggle,
  currentYear,
  onYearChange,
}) => {
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <>
      {/* 월 선택 바 */}
      <View style={styles.container}>
        <TouchableOpacity 
          onPress={() => onMonthChange(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1))}
          style={styles.navButton}
        >
          <Feather name="chevron-left" size={20} color={DesignTokens.colors.text} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => {
            onYearChange(selectedMonth.getFullYear());
            onMonthPickerToggle(true);
          }}
          style={styles.monthButton}
        >
          <Text style={styles.monthText}>
            {showAllTime ? '전체 기간' : `${selectedMonth.getFullYear()}.${String(selectedMonth.getMonth() + 1).padStart(2, '0')}`}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => onMonthChange(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1))}
          style={styles.navButton}
        >
          <Feather name="chevron-right" size={20} color={DesignTokens.colors.text} />
        </TouchableOpacity>
      </View>

      {/* 월 선택 팝업 */}
      <Modal
        visible={showMonthPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => onMonthPickerToggle(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => onMonthPickerToggle(false)}
        >
          <View style={styles.modalContainer}>
            {/* 월 그리드 */}
            <View style={styles.monthGrid}>
              {months.map((month) => {
                const isSelected = selectedMonth.getMonth() === month - 1 && selectedMonth.getFullYear() === currentYear && !showAllTime;
                
                return (
                  <TouchableOpacity
                    key={month}
                    onPress={() => {
                      onMonthChange(new Date(currentYear, month - 1));
                      onAllTimeChange(false);
                      onMonthPickerToggle(false);
                    }}
                    style={[
                      styles.monthButton,
                      isSelected && styles.selectedMonthButton
                    ]}
                  >
                    <Text style={[
                      styles.monthButtonText,
                      isSelected && styles.selectedMonthText
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
                onPress={() => onYearChange(currentYear - 1)}
                style={styles.yearButton}
              >
                <Feather name="chevron-left" size={16} color={DesignTokens.colors.text} />
                <Text style={styles.yearButtonText}>{currentYear - 1}</Text>
              </TouchableOpacity>
              
              <Text style={styles.yearText}>{currentYear}</Text>
              
              <TouchableOpacity
                onPress={() => onYearChange(currentYear + 1)}
                style={styles.yearButton}
              >
                <Text style={styles.yearButtonText}>{currentYear + 1}</Text>
                <Feather name="chevron-right" size={16} color={DesignTokens.colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 0,
    paddingVertical: 4,
    gap: 16,
  },
  navButton: {
    padding: 8,
    backgroundColor: DesignTokens.colors.accent,
    borderWidth: 2,
    borderColor: DesignTokens.colors.profileBorder,
  },
  monthText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: DesignTokens.colors.primary,
    fontFamily: DesignTokens.fonts.default,
    textTransform: 'uppercase',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: DesignTokens.colors.background,
    borderWidth: 3,
    borderColor: DesignTokens.colors.border,
    padding: 24,
    marginHorizontal: 16,
    width: '100%',
    maxWidth: 384, // max-w-sm equivalent
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  monthButton: {
    width: '30%',
    paddingVertical: 12,
    backgroundColor: DesignTokens.colors.background,
    borderWidth: 2,
    borderColor: DesignTokens.colors.border,
    alignItems: 'center',
  },
  selectedMonthButton: {
    backgroundColor: DesignTokens.colors.alert,
    borderColor: DesignTokens.colors.profileBorder,
  },
  monthButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: DesignTokens.colors.primary,
    fontFamily: DesignTokens.fonts.default,
    textTransform: 'uppercase',
  },
  selectedMonthText: {
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
    borderColor: DesignTokens.colors.profileBorder,
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

export { MonthPicker };
