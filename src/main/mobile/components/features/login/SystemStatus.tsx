import React from 'react';
import Constants from 'expo-constants';
import { View, Text, StyleSheet } from 'react-native';

interface SystemStatusProps {
  currentTime: Date;
  variant?: 'login' | 'sidebar';
  showDate?: boolean;
  showTime?: boolean;
  showSystemInfo?: boolean;
}

const SystemStatus: React.FC<SystemStatusProps> = ({
  currentTime,
  variant = 'login',
  showDate = true,
  showTime = true,
  showSystemInfo = true,
}) => {
  if (variant === 'sidebar') {
    return (
      <Text style={styles.sidebarTime}>
        {showTime ? currentTime.toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) : ''}
      </Text>
    );
  }

  return (
    <View style={styles.container}>
      {(showDate || showTime) && (
        <Text style={styles.accent}>
          {showDate ? currentTime.toLocaleDateString('ko-KR') : ''}
          {showDate && showTime ? ' ' : ''}
          {showTime ? currentTime.toLocaleTimeString('ko-KR') : ''}
        </Text>
      )}
      {showSystemInfo && (
        <Text style={styles.info}>
          <Text style={styles.dim}>System: </Text>
          <Text style={styles.infoAccent}>
            mood.disk v{(Constants as any)?.expoConfig?.version || (Constants as any)?.manifest2?.extra?.version || (Constants as any)?.manifest?.extra?.version || '0.0.0'}
          </Text>
          {'\n'}
          <Text style={styles.dim}>Status: </Text>
          <Text style={styles.online}>ONLINE</Text>
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  sidebarTime: {
    color: '#8B5CF6',
    fontSize: 12,
  },
  accent: {
    color: '#8B5CF6',
    fontSize: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  info: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
  dim: {
    color: 'rgba(255,255,255,0.6)',
  },
  infoAccent: {
    color: '#7DD3FC',
  },
  online: {
    color: '#34D399',
    fontWeight: '600',
  },
});

export default SystemStatus;


