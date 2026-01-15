import React from 'react';
import FloppySidebar from './FloppySidebar';

interface ContentAreaProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  children: React.ReactNode;
}

export default function ContentArea({ 
  activeSection, 
  onSectionChange, 
  children 
}: ContentAreaProps) {
  const [isSidebarMinimized, setIsSidebarMinimized] = React.useState(false);

  return (
    <div className="flex bg-gray-100 flex-1 overflow-hidden">
      {/* Sidebar */}
      <div className={`bg-gray-200 border-r-2 border-gray-400 retro-scrollbar overflow-y-auto overflow-x-hidden transition-all duration-300 ${
  isSidebarMinimized ? 'w-[60px] p-[6px]' : 'w-[230px] p-[12px]'
} shrink-0`}>
        <div className="break-words">
          <FloppySidebar 
            onSectionChange={onSectionChange}
            activeSection={activeSection}
            isMinimized={isSidebarMinimized}
            onMinimizeToggle={() => setIsSidebarMinimized(!isSidebarMinimized)}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 retro-scrollbar overflow-y-auto">
        <div className="p-6 min-h-full">
          {children}
        </div>
      </div>
    </div>
  );
} 