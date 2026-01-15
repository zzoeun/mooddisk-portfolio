import React from 'react';

interface TextAreaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  label?: string;
  required?: boolean;
}

export const TextArea: React.FC<TextAreaProps> = ({
  value,
  onChange,
  placeholder = "내용을 입력해주세요.",
  className = '',
  minHeight = '300px',
  label,
  required = false
}) => {
  return (
    <div className={`flex-1 ${className}`}>
      {label && (
        <label className="block text-sm font-medium mb-2 text-black">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-64 px-4 py-3 border-0 focus:outline-none text-base resize-none bg-transparent"
        style={{ minHeight }}
      />
    </div>
  );
};


