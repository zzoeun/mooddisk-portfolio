import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
  title?: string;
  showAllTimeOption?: boolean;
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
  title = "월 선택",
  showAllTimeOption = true
}) => {
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <>
      {/* 월 선택 바 */}
      <div className="flex items-center justify-center px-0 py-1 gap-4">
        <button
          onClick={() => onMonthChange(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1))}
          className="p-2"
          style={{
            backgroundColor: DesignTokens.colors.accent,
            border: `2px solid ${DesignTokens.colors.profileBorder}`,
          }}
        >
          <ChevronLeft size={20} color={DesignTokens.colors.text} />
        </button>
        
        <button 
          onClick={() => {
            onYearChange(selectedMonth.getFullYear());
            onMonthPickerToggle(true);
          }}
          className="px-4 py-2"
          style={{
            border: `2px solid ${DesignTokens.colors.border}`,
          }}
        >
          <span
            className="text-base font-bold uppercase"
            style={{
              color: DesignTokens.colors.primary,
              fontFamily: DesignTokens.fonts.default,
            }}
          >
            {showAllTime ? '전체 기간' : `${selectedMonth.getFullYear()}.${String(selectedMonth.getMonth() + 1).padStart(2, '0')}`}
          </span>
        </button>
        
        <button
          onClick={() => onMonthChange(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1))}
          className="p-2"
          style={{
            backgroundColor: DesignTokens.colors.accent,
            border: `2px solid ${DesignTokens.colors.profileBorder}`,
          }}
        >
          <ChevronRight size={20} color={DesignTokens.colors.text} />
        </button>
      </div>

      {/* 월 선택 팝업 */}
      {showMonthPicker && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => onMonthPickerToggle(false)}
        >
          <div 
            className="p-6 mx-4 w-full max-w-sm"
            style={{
              backgroundColor: DesignTokens.colors.background,
              border: `3px solid ${DesignTokens.colors.border}`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 월 그리드 */}
            <div className="flex flex-wrap gap-2 mb-4">
              {months.map((month) => {
                const isSelected = selectedMonth.getMonth() === month - 1 && selectedMonth.getFullYear() === currentYear && !showAllTime;
                
                return (
                  <button
                    key={month}
                    onClick={() => {
                      onMonthChange(new Date(currentYear, month - 1));
                      onAllTimeChange(false);
                      onMonthPickerToggle(false);
                    }}
                    className="py-3 text-center font-bold uppercase text-base"
                    style={{
                      width: 'calc(33.333% - 6px)',
                      backgroundColor: isSelected ? DesignTokens.colors.alert : DesignTokens.colors.background,
                      border: `2px solid ${isSelected ? DesignTokens.colors.profileBorder : DesignTokens.colors.border}`,
                      color: isSelected ? DesignTokens.colors.text : DesignTokens.colors.primary,
                      fontFamily: DesignTokens.fonts.default,
                    }}
                  >
                    {month}월
                  </button>
                );
              })}
            </div>
            
            {/* 년도 네비게이션 */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => onYearChange(currentYear - 1)}
                className="flex items-center gap-1 py-2 px-3"
                style={{
                  backgroundColor: DesignTokens.colors.accent,
                  border: `2px solid ${DesignTokens.colors.profileBorder}`,
                }}
              >
                <ChevronLeft size={16} color={DesignTokens.colors.text} />
                <span
                  className="text-base font-bold"
                  style={{
                    color: DesignTokens.colors.text,
                    fontFamily: DesignTokens.fonts.default,
                  }}
                >
                  {currentYear - 1}
                </span>
              </button>
              
              <span
                className="text-base font-bold uppercase"
                style={{
                  color: DesignTokens.colors.primary,
                  fontFamily: DesignTokens.fonts.default,
                }}
              >
                {currentYear}
              </span>
              
              <button
                onClick={() => onYearChange(currentYear + 1)}
                className="flex items-center gap-1 py-2 px-3"
                style={{
                  backgroundColor: DesignTokens.colors.accent,
                  border: `2px solid ${DesignTokens.colors.profileBorder}`,
                }}
              >
                <span
                  className="text-base font-bold"
                  style={{
                    color: DesignTokens.colors.text,
                    fontFamily: DesignTokens.fonts.default,
                  }}
                >
                  {currentYear + 1}
                </span>
                <ChevronRight size={16} color={DesignTokens.colors.text} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export { MonthPicker };
