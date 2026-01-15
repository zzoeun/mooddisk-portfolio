import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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
    <View style={styles.accountSection}>
      <View style={styles.accountActions}>
        <TouchableOpacity
          style={styles.withdrawButton}
          onPress={onWithdraw}
          disabled={isWithdrawing}
        >
          <Text style={styles.withdrawText}>회원탈퇴</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={onLogout}
          disabled={isLoggingOut}
        >
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  accountSection: {
    marginHorizontal: DesignTokens.spacing.sectionPadding,
    backgroundColor: DesignTokens.colors.background,
    padding: DesignTokens.spacing.sectionPadding,
  },
  accountActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: DesignTokens.spacing.innerPadding,
  },
  withdrawButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: DesignTokens.colors.lightGray,
    borderWidth: 2,
    borderColor: DesignTokens.colors.mediumGray,
  },
  withdrawText: {
    fontSize: 14,
    color: DesignTokens.colors.gray,
    fontWeight: 'bold',
    fontFamily: DesignTokens.fonts.default,
    textTransform: 'uppercase',
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: DesignTokens.colors.accent,
    borderWidth: 2,
    borderColor: DesignTokens.colors.text,
  },
  logoutText: {
    fontSize: 14,
    color: DesignTokens.colors.text,
    fontWeight: 'bold',
    fontFamily: DesignTokens.fonts.default,
    textTransform: 'uppercase',
  },
});
