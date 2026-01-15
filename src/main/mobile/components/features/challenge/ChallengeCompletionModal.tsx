import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { MyChallengeEntry } from '@mooddisk/types';
import DesignTokens from '../../../constants/designTokens';

interface ChallengeCompletionModalProps {
  visible: boolean;
  challenge: MyChallengeEntry | null;
  onClose: () => void;
}

const { width, height } = Dimensions.get('window');

export const ChallengeCompletionModal: React.FC<ChallengeCompletionModalProps> = ({
  visible,
  challenge,
  onClose,
}) => {
  // challenge가 없으면 모달을 표시하지 않음 (overlay가 남아있지 않도록)
  if (!challenge || !visible) {
    return null;
  }
  
  console.log('✅ ChallengeCompletionModal: 모달 렌더링 시작');

  const getCompletionMessage = () => {
    const progressDays = challenge.progressDays || 0;
    const durationDays = challenge.durationDays || 0;
    
    if (progressDays >= durationDays) {
      return {
        title: '로그 완료',
        message: `${durationDays}일의 로그가 모여 한 편의 이야기가 되었습니다.`,
        subMessage: '모든 기록이 당신만의 디스크로 남았어요.',
        color: DesignTokens.colors.text,
        bgColor: DesignTokens.colors.accent,
      };
    } else {
      return {
        title: '로그는 계속 됩니다.',
        message: '빈칸도 당신의 로그에 포함돼요.',
        subMessage: '완벽하지 않아도, 이미 충분히 의미 있는 기록이에요.',
        color: DesignTokens.colors.text,
        bgColor: DesignTokens.colors.alert,
      };
    }
  };

  const completionInfo = getCompletionMessage();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: completionInfo.bgColor, borderWidth: 3, borderColor: DesignTokens.colors.text }]}>
          <View style={styles.content}>
            <Text style={[styles.title, { color: completionInfo.color }]}>
              {completionInfo.title}
            </Text>
            
            <View style={[styles.challengeInfo, { backgroundColor: DesignTokens.colors.background, borderWidth: 2, borderColor: DesignTokens.colors.text }]}>
              <Text style={styles.challengeTitle}>{challenge.title}</Text>
              <Text style={styles.challengeDescription}>{challenge.description}</Text>
            </View>

            <View style={styles.progressInfo}>
              <Text style={styles.progressText}>
                진행률: {Math.round(((challenge.progressDays || 0) / (challenge.durationDays || 1)) * 100)}%
              </Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${Math.min(100, ((challenge.progressDays || 0) / (challenge.durationDays || 1)) * 100)}%`,
                      backgroundColor: completionInfo.color
                    }
                  ]} 
                />
              </View>
            </View>

            <Text style={[styles.message, { color: completionInfo.color }]}>
              {completionInfo.message}
            </Text>

            <Text style={[styles.subMessage, { color: completionInfo.color }]}>
              {completionInfo.subMessage}
            </Text>

            <TouchableOpacity 
              style={[styles.closeButton, { backgroundColor: DesignTokens.colors.primary, borderWidth: 2, borderColor: DesignTokens.colors.text }]}
              onPress={onClose}
            >
              <Text style={styles.closeButtonText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  modalContainer: {
    width: width * 0.85,
    maxWidth: 400,
    zIndex: 10000,
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: DesignTokens.fonts.default,
    textTransform: 'uppercase',
  },
  challengeInfo: {
    width: '100%',
    padding: 16,
    marginBottom: 20,
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: DesignTokens.colors.primary,
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: DesignTokens.fonts.default,
    textTransform: 'uppercase',
  },
  challengeDescription: {
    fontSize: 14,
    color: DesignTokens.colors.text,
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: DesignTokens.fonts.default,
  },
  progressInfo: {
    width: '100%',
    marginBottom: 20,
  },
  progressText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: DesignTokens.colors.text,
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: DesignTokens.fonts.default,
    textTransform: 'uppercase',
  },
  progressBar: {
    width: '100%',
    height: 12,
        backgroundColor: DesignTokens.colors.background,
    borderWidth: 2,
        borderColor: DesignTokens.colors.text,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 12,
    fontWeight: 'bold',
    fontFamily: DesignTokens.fonts.default,
  },
  subMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    fontWeight: 'bold',
    fontFamily: DesignTokens.fonts.default,
  },
  closeButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  closeButtonText: {
    color: DesignTokens.colors.text,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: DesignTokens.fonts.default,
    textTransform: 'uppercase',
  },
});
