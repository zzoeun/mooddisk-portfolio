// packages/types/src/common/app.ts
export interface AppState {
  isLoggedIn: boolean;
  isMobile: boolean;
  activeSection: string;
}

export interface AppActions {
  setIsLoggedIn: (isLoggedIn: boolean) => void;
  setActiveSection: (section: string) => void;
}
