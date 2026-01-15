import React, { useState, useEffect } from 'react';

export default function StatusBar() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // 1초마다 현재 시간 업데이트
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-gray-300 border-t-2 border-gray-400 px-4 py-2 flex items-center justify-between text-xs shrink-0">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>온라인</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span>연결됨</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span>RAM: 64MB</span>
        <span>디스크: 1.44MB</span>
        <span className="neon-glow text-purple-600">
          {currentTime.toLocaleTimeString('ko-KR', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit',
            hour12: true
          })}
        </span>
      </div>
    </div>
  );
} 