import React from 'react';
import { ChallengeEntry } from "@mooddisk/types";
import { splitTextByLineBreaks } from "@mooddisk/utils";
import DesignTokens from '../../../constants/designTokens';

// 설명용 줄바꿈 처리 함수
const formatDescriptionWithLineBreaks = (text: string) => {
  const lines = splitTextByLineBreaks(text);
  return lines.map((line, index) => (
    <p 
      key={index} 
      className="text-sm leading-[20px] mb-1.5"
      style={{ color: DesignTokens.colors.text }}
    >
      {line.trim()}
    </p>
  ));
};

// 규칙용 줄바꿈 처리 함수
const formatTextWithLineBreaks = (text: string) => {
  const lines = splitTextByLineBreaks(text);
  return lines.map((line, index) => (
    <div 
      key={index} 
      className="flex items-start mb-1.5 p-1.5"
      style={{
        backgroundColor: DesignTokens.colors.background,
        border: `2px solid ${DesignTokens.colors.accent}`,
      }}
    >
      <span 
        className="text-base font-bold mr-2 mt-0.5"
        style={{ color: DesignTokens.colors.accent }}
      >
        ▶
      </span>
      <span 
        className="text-sm leading-4 flex-1"
        style={{ color: DesignTokens.colors.text }}
      >
        {line.trim()}
      </span>
    </div>
  ));
};

interface ChallengeDetailProps {
  challenge: ChallengeEntry;
  onBack: () => void;
  onJoin: (challengeId: string) => void;
  onSubmitPost?: () => void;
  newPost?: { content: string };
  setNewPost?: (post: { content: string }) => void;
  loading?: boolean;
}

export function ChallengeDetail({
  challenge,
  onJoin,
  loading = false
}: ChallengeDetailProps) {
  if (loading) {
    return (
      <div className="pb-20 px-4">
        {/* 챌린지 이미지 스켈레톤 */}
        <div 
          className="relative mx-auto mb-6 animate-pulse"
          style={{
            width: '100%',
            maxWidth: '400px',
            aspectRatio: '1',
            backgroundColor: DesignTokens.colors.lightGray,
            border: `4px solid ${DesignTokens.colors.border}`,
          }}
        />
        
        {/* 챌린지 정보 스켈레톤 */}
        <div className="px-4 space-y-4">
          <div className="h-8 bg-gray-200 rounded animate-pulse" style={{ width: '60%' }} />
          <div className="h-4 bg-gray-200 rounded animate-pulse" style={{ width: '100%' }} />
          <div className="h-4 bg-gray-200 rounded animate-pulse" style={{ width: '80%' }} />
          
          {/* 참여 버튼 스켈레톤 */}
          <div className="h-12 bg-gray-200 rounded animate-pulse mt-6" />
        </div>
      </div>
    );
  }

  const isTravelLog = challenge.type === 'TRAVEL';

  return (
    <div className="pb-20">
      {/* 챌린지 이미지 */}
      <div 
        className="relative mx-auto"
        style={{
          width: '100%',
          maxWidth: '400px',
          aspectRatio: '1',
          backgroundColor: DesignTokens.colors.darkGray,
          border: `4px solid ${DesignTokens.colors.border}`,
        }}
      >
        {challenge.imageUrl ? (
          <img
            src={challenge.imageUrl}
            alt={challenge.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const placeholder = target.nextSibling as HTMLElement;
              if (placeholder) placeholder.style.display = 'flex';
            }}
          />
        ) : null}
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{ 
            backgroundColor: DesignTokens.colors.darkGray,
            display: challenge.imageUrl ? 'none' : 'flex'
          }}
        >
          <span className="text-5xl" style={{ color: DesignTokens.colors.primary }}>🎮</span>
        </div>
        
        {/* 기간 정보 배지 */}
        <div 
          className="absolute bottom-2 right-2 px-2 py-1 flex items-center gap-1"
          style={{
            backgroundColor: DesignTokens.colors.accent,
            border: `2px solid ${DesignTokens.colors.background}`,
          }}
        >
          <span 
            className="text-sm font-bold"
            style={{ color: DesignTokens.colors.text }}
          >
            {challenge.duration}days
          </span>
        </div>
      </div>

      {/* 챌린지 상세 정보 */}
      <div className="px-4 py-4 max-w-[400px] mx-auto">
        {/* 참여 버튼 또는 참여 중 표시 */}
        <div className="mb-4">
          {!challenge.isJoined ? (
            isTravelLog ? (
              <button
                disabled
                className="w-full py-2 font-bold text-sm uppercase opacity-50 cursor-not-allowed"
                style={{
                  backgroundColor: DesignTokens.colors.lightGray,
                  border: `2px solid ${DesignTokens.colors.border}`,
                  color: DesignTokens.colors.text,
                }}
              >
                앱에서만 가능
              </button>
            ) : (
              <button
                onClick={() => onJoin(challenge.id)}
                className="w-full py-2 font-bold text-sm uppercase transition-opacity hover:opacity-80"
                style={{
                  backgroundColor: DesignTokens.colors.accent,
                  border: `2px solid ${DesignTokens.colors.text}`,
                  color: DesignTokens.colors.text,
                }}
              >
                시작하기
              </button>
            )
          ) : (
            <div 
              className="w-full py-2 text-center font-bold text-sm uppercase"
              style={{
                backgroundColor: DesignTokens.colors.alert,
                border: `2px solid ${DesignTokens.colors.text}`,
                color: DesignTokens.colors.text,
              }}
            >
              기록 중
            </div>
          )}
        </div>

        {/* 챌린지 설명 */}
        <div 
          className="mb-4 p-3"
          style={{
            backgroundColor: DesignTokens.colors.background,
            border: `${DesignTokens.borders.width} solid ${DesignTokens.colors.border}`,
          }}
        >
          <h3 
            className="text-lg font-bold uppercase mb-2"
            style={{ color: DesignTokens.colors.primary }}
          >
            소개
          </h3>
          <div className="py-1">
            {formatDescriptionWithLineBreaks(challenge.description)}
          </div>
        </div>

        {/* 챌린지 규칙 */}
        {challenge.rules && (
          <div 
            className="mb-4 p-3"
            style={{
              backgroundColor: DesignTokens.colors.background,
              border: `${DesignTokens.borders.width} solid ${DesignTokens.colors.border}`,
            }}
          >
            <h3 
              className="text-lg font-bold uppercase mb-2"
              style={{ color: DesignTokens.colors.primary }}
            >
              참여 방법
            </h3>
            <div className="py-1">
              {formatTextWithLineBreaks(challenge.rules)}
            </div>
          </div>
        )}

        {/* 챌린지 보상 */}
        {challenge.rewards && (
          <div 
            className="mb-4 p-3"
            style={{
              backgroundColor: DesignTokens.colors.background,
              border: `${DesignTokens.borders.width} solid ${DesignTokens.colors.border}`,
            }}
          >
            <h3 
              className="text-lg font-bold uppercase mb-2"
              style={{ color: DesignTokens.colors.primary }}
            >
              기록가이드
            </h3>
            <div className="py-1">
              {formatDescriptionWithLineBreaks(challenge.rewards)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
