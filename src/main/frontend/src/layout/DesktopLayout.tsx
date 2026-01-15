import React, { useMemo, useCallback } from 'react';
import TitleBar from './desktop/TitleBar';
import StatusBar from './desktop/StatusBar';
import ContentArea from './desktop/ContentArea';
import SectionRenderer from '../SectionRenderer';

interface DesktopLayoutProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  setIsLoggedIn: (isLoggedIn: boolean) => void;
}

export default function DesktopLayout({
  activeSection,
  setActiveSection,
  setIsLoggedIn,
}: DesktopLayoutProps) {
  // write 섹션으로 이동하기 전의 섹션을 추적
  const sectionBeforeWriteRef = React.useRef<string>('diary');
  
  // 탭 변경 시 이전 섹션 추적
  React.useEffect(() => {
    // write 섹션이 아닐 때만 이전 섹션 업데이트
    if (activeSection !== 'write') {
      sectionBeforeWriteRef.current = activeSection;
    }
  }, [activeSection]);
  
  // 탭 변경 핸들러 - write 섹션이면 바로 해당 섹션으로 이동 (SectionRenderer에서 상태 초기화)
  const handleSectionChange = useCallback((section: string) => {
    // write 섹션으로 이동할 때 이전 섹션 저장
    if (section === 'write' && activeSection !== 'write') {
      sectionBeforeWriteRef.current = activeSection;
    }
    // 바로 해당 섹션으로 이동 (write 섹션은 SectionRenderer에서 상태 초기화됨)
    setActiveSection(section);
  }, [setActiveSection, activeSection]);
  
  // 탭 표시용 activeSection (write 섹션이면 이전 섹션 표시)
  const displayActiveSection = activeSection === 'write' ? sectionBeforeWriteRef.current : activeSection;

  // SectionRenderer를 컴포넌트로 렌더링하고 결과를 받기
  const sectionContent = useMemo(() => {
    return <SectionRenderer activeSection={activeSection} onSectionChange={handleSectionChange} />;
  }, [activeSection, handleSectionChange]);

  // SectionRenderer에서 title과 content를 추출하기 위해 별도로 처리
  // 하지만 SectionRenderer가 객체를 반환하므로, 이를 처리할 수 있는 래퍼가 필요합니다.
  // 일단 SectionRenderer를 직접 사용하는 방식으로 변경
  const { title, content } = SectionRenderer({ activeSection, onSectionChange: handleSectionChange });

  return (
    <div className="min-h-screen p-4">
      <div className="h-[calc(100vh-2rem)] mx-auto">
        <div className="y2k-window rounded-lg overflow-hidden shadow-2xl h-full flex flex-col">
          <TitleBar
            title={title}
            onClose={() => setIsLoggedIn(false)}
          />
          <ContentArea
            activeSection={displayActiveSection}
            onSectionChange={handleSectionChange}
          >
            {content}
          </ContentArea>
          <StatusBar />
        </div>
      </div>
    </div>
  );
} 