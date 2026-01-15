import React from 'react';
import { AppLogo } from '../../common/brand/AppLogo';

export const LoginHeader: React.FC = () => {
  return (
    <div className="flex flex-col items-center w-full">
      {/* 로고 */}
      <div className="flex items-center justify-center w-full mb-6">
        <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg">
          <AppLogo size="lg" />
        </div>
      </div>
      
      {/* 서브텍스트 */}
      <p className="text-white/90 text-center text-lg font-bold leading-relaxed drop-shadow-md">
        feel, write, save<br />당신의 감정을 기록 중입니다.
      </p>
    </div>
  );
}; 