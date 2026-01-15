import React, { useState } from 'react';
import { MoreVertical } from 'lucide-react';
import { PixelEdit, PixelDelete } from '../icons/PixelIcons';
import { TimelineItem } from './GenericTimeline';

interface TimelineActionsProps {
  item: TimelineItem;
  isOpen: boolean;
  onToggle: () => void;
  onEdit?: (item: TimelineItem) => void;
  onDelete?: (itemId: string) => void;
  className?: string;
}

export const TimelineActions: React.FC<TimelineActionsProps> = ({
  item,
  isOpen,
  onToggle,
  onEdit,
  onDelete,
  className = ""
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const handleButtonClick = (action: () => void) => {
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 200);
    action();
  };

  return (
    <div className={`absolute top-4 right-4 menu-container ${className}`}>
      <button
        onClick={onToggle}
        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
      >
        <MoreVertical size={16} className="text-gray-500" />
      </button>
      
      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div className="absolute right-0 top-8 bg-white border border-purple-600 rounded-none shadow-lg z-10 transform translate-x-2">
          <div className="flex flex-col">
            {onEdit && (
              <button
                onClick={() => handleButtonClick(() => {
                  onEdit(item);
                  onToggle();
                })}
                className="flex items-center gap-2 px-6 py-3 text-sm text-gray-800 hover:bg-gray-100 active:bg-gray-200 active:transform active:translate-y-0.5 transition-all duration-150 border-b border-purple-600 min-w-20 whitespace-nowrap bg-gray-50 hover:shadow-inner"
              >
                <PixelEdit size={18} color="#6B7280" />
                수정
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => handleButtonClick(() => {
                  onDelete(item.id);
                  onToggle();
                })}
                className="flex items-center gap-2 px-6 py-3 text-sm text-red-700 hover:bg-red-100 active:bg-red-200 active:transform active:translate-y-0.5 transition-all duration-150 min-w-20 whitespace-nowrap bg-red-50 hover:shadow-inner"
              >
                <PixelDelete size={18} color="#FF4D6D" />
                삭제
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
