import React from 'react';
import { TextArea } from '../../../common/forms';

interface DiaryTextAreaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

const DiaryTextArea: React.FC<DiaryTextAreaProps> = ({
  value,
  onChange,
  placeholder = "지금, 어떤가요?",
  className = '',
  minHeight = '300px'
}) => {
  return (
    <TextArea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      minHeight={minHeight}
    />
  );
};

export default DiaryTextArea;
