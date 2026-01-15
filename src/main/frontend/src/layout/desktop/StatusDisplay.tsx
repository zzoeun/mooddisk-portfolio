import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';

interface StatusDisplayProps {
  isVisible?: boolean;
}

const systemMessages = [
  '💾 Saving user data...',
  '🖥️ Initializing modules...',
  '🌐 Connected to mood.disk server',
  '⚠️ Low Disk Space Warning!',
  '📡 Syncing with Y2K server...',
  '🔒 Encrypting user files...',
  '🧠 Loading emotional modules...'
];

const neonPulse = keyframes`
  0%, 100% { text-shadow: 0 0 5px #8b5cf6, 0 0 10px #8b5cf6; }
  50% { text-shadow: 0 0 10px #8b5cf6, 0 0 20px #8b5cf6; }
`;

const shimmer = keyframes`
  0% { background-position: -200px 0; }
  100% { background-position: 200px 0; }
`;

const progressPulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
`;

const progressGlow = keyframes`
  0%, 100% { box-shadow: 0 0 5px #8b5cf6, 0 0 10px #8b5cf6; }
  50% { box-shadow: 0 0 10px #8b5cf6, 0 0 20px #8b5cf6; }
`;

const Container = styled.div`
  padding: 12px;
  background: #f8fafc;
  color: #374151;
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  margin-top: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  min-width: 200px;
  max-width: 100%;
  overflow: hidden;
`;

const Title = styled.div`
  font-weight: 600;
  margin-bottom: 8px;
  color: #8b5cf6;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  animation: ${neonPulse} 2s infinite;
`;

const StatusRow = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 6px;
  gap: 8px;
  min-width: 0;
`;

const Label = styled.div`
  width: 40px;
  font-size: 10px;
  font-weight: 500;
  color: #6b7280;
  flex-shrink: 0;
`;

const ProgressBar = styled.div`
  flex: 1;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
  min-width: 40px;
  max-width: 80px;
`;

const ProgressFill = styled.div<{ width: number }>`
  height: 100%;
  width: ${props => props.width}%;
  background: linear-gradient(90deg, #8b5cf6, #a855f7, #c084fc, #a855f7, #8b5cf6);
  background-size: 200px 100%;
  animation: ${shimmer} 1.5s linear infinite, ${progressPulse} 2s ease-in-out infinite, ${progressGlow} 3s ease-in-out infinite;
  border-radius: 3px;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    background-size: 100px 100%;
    animation: ${shimmer} 2s linear infinite reverse;
    border-radius: 3px;
  }
`;

const Value = styled.div`
  min-width: 45px;
  text-align: right;
  font-size: 10px;
  font-weight: 600;
  color: #8b5cf6;
  flex-shrink: 0;
`;

const ServerStatus = styled.div`
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  font-weight: 500;
  color: #059669;
`;

const Indicator = styled.div`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 5px #10b981, 0 0 10px #10b981;
  animation: ${neonPulse} 2s infinite;
`;

const Message = styled.div`
  margin-top: 8px;
  color: #6b7280;
  font-size: 9px;
  line-height: 1.4;
  word-wrap: break-word;
  overflow-wrap: break-word;
  hyphens: auto;
  max-width: 100%;
  min-width: 0;
  white-space: normal;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export default function StatusDisplay({ isVisible = true }: StatusDisplayProps) {
  const [ramUsage, setRamUsage] = useState(64); // MB
  const [diskUsage, setDiskUsage] = useState(1.44); // MB
  const [currentMessage, setCurrentMessage] = useState(systemMessages[0]);

  useEffect(() => {
    if (!isVisible) return;

    const messageInterval = setInterval(() => {
      const nextMessage = systemMessages[Math.floor(Math.random() * systemMessages.length)];
      setCurrentMessage(nextMessage);
    }, 4000);

    const ramInterval = setInterval(() => {
      setRamUsage(prev => Math.min(128, prev + Math.random() * 5));
    }, 2000);

    const diskInterval = setInterval(() => {
      setDiskUsage(prev => Math.min(1.44, prev + Math.random() * 0.1));
    }, 2000);

    return () => {
      clearInterval(messageInterval);
      clearInterval(ramInterval);
      clearInterval(diskInterval);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  const ramPercent = (ramUsage / 128) * 100;
  const diskPercent = (diskUsage / 1.44) * 100;

  return (
    <Container>
      <Title>💻 SYSTEM STATUS</Title>

      <StatusRow>
        <Label>RAM:</Label>
        <ProgressBar>
          <ProgressFill width={ramPercent} />
        </ProgressBar>
        <Value>{ramUsage.toFixed(0)}MB</Value>
      </StatusRow>

      <StatusRow>
        <Label>DISK:</Label>
        <ProgressBar>
          <ProgressFill width={diskPercent} />
        </ProgressBar>
        <Value>{diskUsage.toFixed(2)}MB</Value>
      </StatusRow>

      <ServerStatus>
        <Indicator className="online" /> ONLINE
      </ServerStatus>

      <Message>{currentMessage}</Message>
    </Container>
  );
} 