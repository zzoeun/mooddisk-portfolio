import { useState, useEffect, useCallback, useMemo } from "react";
import { AppState, AppActions } from "@mooddisk/types";
import { useAuth } from "../../context/AuthContext";

export function useAppState(): AppState & AppActions {
  const { isLoggedIn: authIsLoggedIn } = useAuth();
  const [isLoggedIn, setIsLoggedIn] = useState(authIsLoggedIn);
  const [activeSection, setActiveSectionState] = useState(() => {
    const savedSection = localStorage.getItem("activeSection");
    return savedSection || "diary";
  });
  const [isMobile, setIsMobile] = useState(false);

  // 모바일 디바이스 감지
  useEffect(() => {
    const checkIfMobile = () => {
      const isMobileDevice = window.innerWidth < 768;
      setIsMobile(isMobileDevice);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);

    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // AuthContext의 로그인 상태와 동기화
  useEffect(() => {
    setIsLoggedIn(authIsLoggedIn);
  }, [authIsLoggedIn]);

  // activeSection 변경 시 localStorage에 저장 - useCallback으로 메모이제이션
  const setActiveSection = useCallback((section: string) => {
    setActiveSectionState(section);
    localStorage.setItem("activeSection", section);
  }, []);

  // setIsLoggedIn도 useCallback으로 메모이제이션
  const handleSetIsLoggedIn = useCallback((loggedIn: boolean) => {
    setIsLoggedIn(loggedIn);
  }, []);

  // setIsMobile도 useCallback으로 메모이제이션
  const handleSetIsMobile = useCallback((mobile: boolean) => {
    setIsMobile(mobile);
  }, []);

  // 반환 객체를 useMemo로 메모이제이션
  return useMemo(
    () => ({
      isLoggedIn,
      activeSection,
      isMobile,
      setIsLoggedIn: handleSetIsLoggedIn,
      setActiveSection,
      setIsMobile: handleSetIsMobile,
    }),
    [
      isLoggedIn,
      activeSection,
      isMobile,
      handleSetIsLoggedIn,
      setActiveSection,
      handleSetIsMobile,
    ]
  );
}
