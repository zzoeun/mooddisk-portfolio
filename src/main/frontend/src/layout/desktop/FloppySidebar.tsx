import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  DiaryIcon, 
  MyPageIcon, 
  ChallengeIcon, 
  DiskbookIcon, 
  TrashIcon 
} from '../../components/common/icons/MenuIcons';
import StatusDisplay from './StatusDisplay';
import { useUser } from '../../context/UserContext';
import DesignTokens from '../../constants/designTokens';

interface FloppySidebarProps {
  onSectionChange: (section: string) => void;
  activeSection: string;
  isMinimized?: boolean;
  onMinimizeToggle?: () => void;
}

export default function FloppySidebar({ 
  onSectionChange, 
  activeSection, 
  isMinimized: externalIsMinimized, 
  onMinimizeToggle 
}: FloppySidebarProps) {
  const [internalIsMinimized, setInternalIsMinimized] = useState(false);
  const { nickname } = useUser();
  
  // 외부에서 제어하는 경우 외부 상태를, 그렇지 않으면 내부 상태를 사용
  const isMinimized = externalIsMinimized !== undefined ? externalIsMinimized : internalIsMinimized;
  const handleMinimizeToggle = onMinimizeToggle || (() => setInternalIsMinimized(!internalIsMinimized));

  const menuItems = [
    { id: 'diary', label: '일기장', icon: DiaryIcon, color: '#E91E63' },
    { id: 'challenge', label: '로그', icon: ChallengeIcon, color: '#F39C12' },
    { id: 'diskbook', label: '디스크', icon: DiskbookIcon, color: '#9B59B6' },
    { id: 'mypage', label: '내 정보', icon: MyPageIcon, color: '#3498DB' },
    { id: 'trash', label: '휴지통', icon: TrashIcon, color: '#2C3E50' },
  ];

  return (
    <div
      className={`h-full transition-all duration-300 flex flex-col border-r-4 relative ${
        isMinimized ? 'w-16' : 'w-64'
      }`}
    >
      {/* Title */}
      <div className="flex-shrink-0 px-2 py-2 border-b flex items-center justify-between relative">
        {!isMinimized && (
          <span 
            className="ml-2"
            style={{ 
              fontSize: '18px',
              lineHeight: '21.78px',
              fontFamily: DesignTokens.fonts.default,
              fontWeight: '700',
              color: DesignTokens.colors.secondary
            }}
          >
            {nickname || 'User'}.disk
          </span>
        )}
        <button
          onClick={handleMinimizeToggle}
          className={`w-6 h-6 bg-white hover:bg-purple-200 border-2 border-purple-600 
                   rounded flex items-center justify-center transition-all ${isMinimized ? 'mr-1' : 'mr-10'}`}
        >
          <span className="text-purple-600 text-xs font-bold">
            {isMinimized ? '➡' : '⬅'}
          </span>
        </button>
      </div>

      {/* Menu */}
      <div className="flex-1 space-y-2 px-2 py-4 overflow-y-auto pb-40">
        {menuItems.map((item) => {
          // write 섹션이면 이전 섹션으로 표시 (SectionRenderer에서 관리)
          // 일단 write 섹션이면 diary로 표시 (나중에 SectionRenderer에서 전달받도록 수정 필요)
          const displayActiveSection = activeSection === 'write' ? 'diary' : activeSection;
          const isActive = displayActiveSection === item.id;
          return (
          <button
            key={item.id}
            onClick={() => onSectionChange(item.id)}
            className={`w-full flex items-center ${isMinimized ? 'justify-center' : ''} rounded-md gap-2 px-2 py-2 border-2 text-left font-pretendard text-xs tracking-tight ${
              isActive ? 'bg-purple-300 text-black' : 'bg-white text-black'
            }`}
            style={{ borderColor: item.color }}
          >
            <div
              className={`flex items-center justify-center ${isMinimized ? 'w-12 h-8' : 'w-8 h-8'} ${isMinimized ? 'mx-0' : ''}`}
              style={{
                backgroundColor: item.color,
                border: '2px solid black',
              }}
            >
              <item.icon size={20} color="#ffffff" />
            </div>
            {!isMinimized && <span>{item.label}</span>}
          </button>
          );
        })}
      </div>

      {/* 상태창 - 완전히 하단에 고정 */}
      <div className="absolute bottom-0 left-0 right-0 px-2">
        <StatusDisplay isVisible={!isMinimized} />
      </div>
    </div>
  );
} 