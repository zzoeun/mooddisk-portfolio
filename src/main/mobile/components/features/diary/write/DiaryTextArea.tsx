import React, { useRef, useEffect } from 'react';
import { TextInput, StyleSheet, View, Keyboard } from 'react-native';
import DesignTokens from '../../../../constants/designTokens';

interface DiaryTextAreaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
  inputAccessoryViewID?: string;
  onFocus?: () => void;
  onBlur?: () => void;
}

const DiaryTextArea: React.FC<DiaryTextAreaProps> = ({
  value,
  onChange,
  placeholder = "지금, 어떤가요?",
  minHeight = 200,
  inputAccessoryViewID,
  onFocus,
  onBlur,
}) => {
  const textInputRef = useRef<TextInput>(null);

  // 텍스트 입력 시 커서 위치를 유지하도록 처리 (자동 스크롤 제거)

  const handleFocus = () => {
    onFocus?.();
    // 포커스 시에는 커서 위치를 강제로 변경하지 않음
  };

  const handleBlur = () => {
    onBlur?.();
  };

  return (
    <View style={styles.container}>
      <TextInput
        ref={textInputRef}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="rgba(139, 92, 246, 0.7)"
        multiline
        style={[styles.textInput, { minHeight }]}
        inputAccessoryViewID={inputAccessoryViewID}
        scrollEnabled={false}
        onFocus={handleFocus}
        onBlur={handleBlur}
        textAlignVertical="top"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: DesignTokens.colors.background,
  },
  textInput: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    fontSize: 16,
    lineHeight: 24,
    textAlignVertical: 'top',
    color: DesignTokens.colors.text,
    fontFamily: DesignTokens.fonts.default,
    minHeight: 120,
    // maxHeight 제거하여 텍스트가 자유롭게 확장되도록 함
  },
});

export default DiaryTextArea;
