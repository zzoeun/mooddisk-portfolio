import React from 'react';
import DesignTokens from '../../../constants/designTokens';

interface AccountSectionProps {
  isWithdrawing: boolean;
  isLoggingOut: boolean;
  onWithdraw: () => void;
  onLogout: () => void;
}

export const AccountSection: React.FC<AccountSectionProps> = ({
  isWithdrawing,
  isLoggingOut,
  onWithdraw,
  onLogout,
}) => {
  return (
    <div 
      className="mx-4 p-4"
      style={{ backgroundColor: DesignTokens.colors.background }}
    >
      <div className="flex justify-end gap-3">
        <button
          onClick={onWithdraw}
          disabled={isWithdrawing}
          className="px-4 py-2 font-bold text-sm uppercase disabled:opacity-50"
          style={{
            backgroundColor: DesignTokens.colors.lightGray,
            border: `2px solid ${DesignTokens.colors.mediumGray}`,
            color: DesignTokens.colors.gray,
          }}
        >
          회원탈퇴
        </button>
        <button
          onClick={onLogout}
          disabled={isLoggingOut}
          className="px-4 py-2 font-bold text-sm uppercase disabled:opacity-50"
          style={{
            backgroundColor: DesignTokens.colors.accent,
            border: `2px solid ${DesignTokens.colors.text}`,
            color: DesignTokens.colors.text,
          }}
        >
          로그아웃
        </button>
      </div>
    </div>
  );
};


