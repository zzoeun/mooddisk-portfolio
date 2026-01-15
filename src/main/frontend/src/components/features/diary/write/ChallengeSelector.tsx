import React, { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';
import { ChallengeEntry } from '@mooddisk/types';
import { getMyChallenges } from '@mooddisk/api';
import { BottomSheetModal } from '../../../common/modals';

interface ChallengeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onChallengeSelect: (challenge: ChallengeEntry) => void;
  selectedCategory?: string;
  className?: string;
  selectedChallengeIdx?: number; // 현재 선택된 챌린지 ID 추가
}

export const ChallengeSelector: React.FC<ChallengeSelectorProps> = ({
  isOpen,
  onClose,
  onChallengeSelect,
  selectedCategory,
  className = '',
  selectedChallengeIdx
}) => {
  const [myChallengesList, setMyChallengesList] = useState<ChallengeEntry[]>([]);
  const [loadingChallenges, setLoadingChallenges] = useState(false);

  // 챌린지 목록 가져오기
  const loadMyChallenges = async () => {
    try {
      setLoadingChallenges(true);
      const apiMyChallenges = await getMyChallenges();
      setMyChallengesList(apiMyChallenges);
    } catch (error) {
      console.error('챌린지 목록 로드 실패:', error);
      setMyChallengesList([]);
    } finally {
      setLoadingChallenges(false);
    }
  };

  // 모달 열릴 때 챌린지 목록 로드
  useEffect(() => {
    if (isOpen) {
      loadMyChallenges();
    }
  }, [isOpen]);

  // 챌린지 선택 처리
  const handleChallengeSelect = (challenge: ChallengeEntry) => {
    onChallengeSelect(challenge);
    onClose();
  };

  return (
    <BottomSheetModal
      isOpen={isOpen}
      onClose={onClose}
      title="기록 중인 챌린지"
      className={className}
    >
      {loadingChallenges ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-full p-4 border rounded-lg animate-pulse"
              style={{
                borderColor: '#e5e7eb',
              }}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-lg bg-gray-200"
                />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded" style={{ width: '60%' }} />
                  <div className="h-3 bg-gray-200 rounded" style={{ width: '40%' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : myChallengesList.length > 0 ? (
        <div className="space-y-3">
          {myChallengesList.map((challenge) => {
            const isSelected = challenge.challengeIdx === selectedChallengeIdx;
            return (
              <button
                key={challenge.challengeIdx}
                onClick={() => handleChallengeSelect(challenge)}
                className={`w-full p-4 border rounded-lg transition-colors text-left ${
                  isSelected
                    ? 'bg-purple-100 border-purple-400 shadow-sm' 
                    : 'border-gray-200 hover:bg-purple-50 hover:border-purple-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isSelected ? 'bg-purple-200' : 'bg-purple-100'
                  }`}>
                    <Trophy className={`w-5 h-5 ${
                      isSelected ? 'text-purple-700' : 'text-purple-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className={`font-medium ${
                        isSelected ? 'text-purple-900' : 'text-gray-900'
                      }`}>
                        {challenge.title}
                      </h4>
                      {isSelected && (
                        <span className="px-2 py-1 bg-purple-200 text-purple-700 text-xs rounded-full font-medium">
                          선택됨
                        </span>
                      )}
                    </div>
                    <p className={`text-sm mt-1 ${
                      isSelected ? 'text-purple-600' : 'text-gray-500'
                    }`}>
                      진행일: {challenge.progressDays}일
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">기록 중인 로그가 없습니다</p>
          <p className="text-sm text-gray-400 mt-1">로그를 시작해보세요!</p>
        </div>
      )}
    </BottomSheetModal>
  );
};


