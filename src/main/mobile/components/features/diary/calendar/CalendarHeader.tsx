import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import DesignTokens from '../../../../constants/designTokens';

interface CalendarHeaderProps {
  weekdays: readonly string[];
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({ weekdays }) => (
  <View style={styles.container}>
    {weekdays.map((day, index) => (
      <View key={day} style={styles.dayContainer}>
        <Text
          style={[
            styles.dayText,
            index === 0 && styles.sunday,
            index === 6 && styles.saturday,
          ]}
        >
          {day}
        </Text>
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 0,
    marginBottom: 8,
    backgroundColor: DesignTokens.colors.background,
    marginHorizontal: 0,
  },
  dayContainer: {
    flex: 1,
    alignItems: 'center',
  },
  dayText: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingVertical: 4,
    color: DesignTokens.colors.text,
    fontFamily: DesignTokens.fonts.default,
    textTransform: 'uppercase',
  },
  sunday: {
    color: DesignTokens.colors.alert, // 코랄핑크
  },
  saturday: {
    color: DesignTokens.colors.accent, // 민트그린
  },
});

export { CalendarHeader };
