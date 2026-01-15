import React from 'react';

interface SystemStatusProps {
  currentTime: Date;
  variant?: "login" | "sidebar";
  showDate?: boolean;
  showSystemInfo?: boolean;
}

export const SystemStatus: React.FC<SystemStatusProps> = ({ 
  currentTime, 
  variant = 'login',
  showDate = true,
  showSystemInfo = true 
}) => {
  if (variant === 'sidebar') {
    return (
      <span className="text-[#8B5CF6] text-xs">
        {currentTime.toLocaleTimeString('ko-KR', { 
          hour: '2-digit', 
          minute: '2-digit',
          second: '2-digit'
        })}
      </span>
    );
  }

  return (
    <div className="text-center text-xs text-white/60 leading-relaxed">
      <div className="text-[#8B5CF6] mb-1">
        {showDate && currentTime.toLocaleDateString('ko-KR')} {currentTime.toLocaleTimeString('ko-KR')}
      </div>
      {showSystemInfo && (
        <div className="whitespace-pre-line">
          <span className="text-white/60">System: </span>
          <span className="text-[#7DD3FC]">mood.disk v{process.env.REACT_APP_VERSION || "0.0.0"}</span>
          {'\n'}
          <span className="text-white/60">Status: </span>
          <span className="text-[#34D399] font-semibold">ONLINE</span>
        </div>
      )}
    </div>
  );
};
