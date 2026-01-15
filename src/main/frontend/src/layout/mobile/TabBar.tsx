import React from 'react';
import { 
  DiaryIcon, 
  ChallengeIcon, 
  DiskbookIcon, 
  MyPageIcon 
} from '../../components/common/icons/MenuIcons';

interface TabBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const MobileTabBar: React.FC<TabBarProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'diary', label: '일기장', icon: DiaryIcon },
    { id: 'challenge', label: '로그', icon: ChallengeIcon },
    { id: 'diskbook', label: '디스크', icon: DiskbookIcon },
    { id: 'mypage', label: '내 정보', icon: MyPageIcon }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      {/* Figma 스타일 탭바 컨테이너 */}
      <div 
        className="relative bg-white px-4 pt-7 pb-6"
        style={{ 
          height: '60px'
        }}
      >
        {/* 아이콘들 */}
        <div className="flex items-center justify-around h-full">
          {tabs.map((tab, index) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="relative flex flex-col items-center justify-center gap-1 transition-all duration-200"
              >
                {/* 픽셀 아이콘 */}
                <Icon 
                  size={24}
                  color={isActive ? '#642E8C' : '#B0B0B0'}
                  className={isActive ? '' : 'opacity-100'}
                />
                
                {/* 탭 텍스트 */}
                <span 
                  className={`text-xs font-medium transition-all duration-200 ${
                    isActive ? 'text-[#642E8C]' : 'text-[#B0B0B0]'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default MobileTabBar;