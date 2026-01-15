import React from 'react';

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
}

export const ErrorModal: React.FC<ErrorModalProps> = ({
  isOpen,
  onClose,
  message
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-sm mx-4">
        <div className="text-red-500 text-lg mb-2">오류가 발생했습니다</div>
        <div className="text-gray-600 text-sm mb-4">{message}</div>
        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg text-sm"
        >
          확인
        </button>
      </div>
    </div>
  );
};
