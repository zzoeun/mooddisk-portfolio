import { X } from 'lucide-react';

interface TitleBarProps {
  title: string;
  onClose: () => void;
}

export default function TitleBar({ 
  title, 
  onClose 
}: TitleBarProps) {
  return (
    <div className="y2k-main-title justify-between">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 bg-purple-300 rounded-sm flex items-center justify-center text-xs">
          💾
        </div>
        <span className="neon-glow text-sm">mood.disk - {title}</span>
      </div>
      <div className="flex items-center gap-1">
        <button 
          onClick={onClose}
          className="w-5 h-5 y2k-button text-xs flex items-center justify-center text-purple-700 font-bold"
        >
          <X className="w-2.5 h-2.5" />
        </button>
      </div>
    </div>
  );
} 