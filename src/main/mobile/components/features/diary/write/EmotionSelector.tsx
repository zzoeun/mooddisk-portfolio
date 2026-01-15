import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { PixelEmotion } from '../../../common/icons/PixelEmotion';
import { emotionMapping } from '@mooddisk/utils';
import DesignTokens from '../../../../constants/designTokens';

interface EmotionSelectorProps {
  selectedEmotion: string;
  onEmotionChange: (emotion: string) => void;
  className?: string;
}

export const EmotionSelector: React.FC<EmotionSelectorProps> = ({
  selectedEmotion,
  onEmotionChange,
  className = '',
}) => {
  const emotions = Object.entries(emotionMapping).map(([key, value]) => ({
    value: key, // "HAPPY", "PROUD" 등
    emotion: key.toLowerCase(), // "happy", "proud" 등
  }));

  return (
    <View style={styles.container}>
      <View style={styles.emotionsRow}>
        {emotions.map(({ value, emotion }) => (
          <TouchableOpacity
            key={value}
            onPress={() => {
              console.log('🎭 EmotionSelector - 감정 선택:', { value, emotion, selectedEmotion });
              onEmotionChange(value);
            }}
            style={[
              styles.emotionButton,
              selectedEmotion === value && styles.selectedEmotionButton
            ]}
          >
            <PixelEmotion
              emotion={emotion}
              size="md"
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emotionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  emotionButton: {
    padding: 8,
    backgroundColor: 'transparent',
  },
  selectedEmotionButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: DesignTokens.colors.border,
  },
});
