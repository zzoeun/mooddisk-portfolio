import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import DesignTokens from '../../../constants/designTokens';

interface Y2KProgressBarProps {
  progress: number;
}

const Y2KProgressBar: React.FC<Y2KProgressBarProps> = ({ progress }) => {
  const maxSteps = 8;
  const stepsProgress = (progress / 100) * maxSteps;
  const fullBlocks = Math.floor(stepsProgress);
  const partialBlockFill = stepsProgress % 1;

  return (
    <View style={styles.wrapper}>
      <View style={styles.blocksRow}>
        {Array.from({ length: maxSteps }, (_, index) => {
          const isFullyFilled = index < fullBlocks;
          const isPartiallyFilled = index === fullBlocks && partialBlockFill > 0;
          return (
            <View key={`block-${index}`} style={[styles.blockWrapper, isFullyFilled && styles.blockWrapperFilled]}>
              {isFullyFilled && (
                <>
                  <View pointerEvents="none" style={styles.neonGlow} />
                  <View pointerEvents="none" style={styles.neonOuter} />
                  <View pointerEvents="none" style={styles.neonHalo} />
                </>
              )}
              <View
                style={[
                  styles.block,
                  isFullyFilled ? styles.blockFilled : styles.blockEmpty,
                ]}
              >
                {isPartiallyFilled && (
                  <View
                    style={[
                      styles.partialFill,
                      { width: `${partialBlockFill * 100}%` },
                    ]}
                  />
                )}
              </View>
            </View>
          );
        })}
      </View>
      <Text style={styles.label}>{progress >= 100 ? '시스템 로딩 완료!' : ''}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    alignItems: 'center',
    gap: 6,
    marginTop: 0,
  },
  blocksRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  blockWrapper: {
    position: 'relative',
    width: 24,
    height: 16,
    marginHorizontal: 2,
  },
  blockWrapperFilled: {
    // iOS: allow shadows to render outside
  },
  block: {
    width: 24,
    height: 16,
    borderWidth: 1.5,
    borderColor: DesignTokens.colors.primary, // purple-300 for higher contrast
    overflow: 'hidden',
    backgroundColor: DesignTokens.colors.lightGray, // gray-200
  },
  blockFilled: {
    backgroundColor: DesignTokens.colors.primary, // purple-500
    borderColor: DesignTokens.colors.secondary, // purple-600
    shadowColor: DesignTokens.colors.sectionBackground,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 4,
    elevation: 2,
  },
  blockEmpty: {
    backgroundColor: DesignTokens.colors.lightGray,
    borderColor: DesignTokens.colors.mediumGray,
  },
  partialFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: DesignTokens.colors.accent,
    opacity: 0.9,
  },
  label: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    textShadowColor: 'rgba(168, 85, 247, 0.2)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 2,
  },
  neonGlow: {
    position: 'absolute',
    top: -2,
    bottom: -2,
    left: -2,
    right: -2,
    borderRadius: 2,
    backgroundColor: 'rgba(168,85,247,0.22)',
    opacity: 1,
  },
  neonOuter: {
    position: 'absolute',
    top: -2,
    bottom: -2,
    left: -2,
    right: -2,
    borderRadius: 4,
    backgroundColor: 'rgba(192,132,252,0.12)',
  },
  neonHalo: {
    position: 'absolute',
    top: -4,
    bottom: -4,
    left: -4,
    right: -4,
    borderRadius: 8,
    backgroundColor: 'rgba(233,213,255,0.06)',
  },
});

export default Y2KProgressBar;


