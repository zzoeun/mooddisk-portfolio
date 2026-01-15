/**
 * 미디어 쿼리 유틸리티
 * styled-components와 Tailwind CSS 환경 모두에서 사용할 수 있는 반응형 헬퍼 함수들
 */

// styled-components용 함수 형태
export const MediaQuery = {
  // 모바일 (480px 이하)
  mobile: (styles: any) => `@media only screen and (max-width: 479px) { ${styles} }`,
  
  // 태블릿 (480px ~ 767px)
  tablet: (styles: any) => `@media only screen and (min-width: 480px) and (max-width: 767px) { ${styles} }`,
  
  // 랩톱 (768px ~ 1023px)
  laptop: (styles: any) => `@media only screen and (min-width: 768px) and (max-width: 1023px) { ${styles} }`,
  
  // 데스크톱 (1024px ~ 1199px)
  desktop: (styles: any) => `@media only screen and (min-width: 1024px) and (max-width: 1199px) { ${styles} }`,
  
  // 대형 데스크톱 (1200px 이상)
  largeDesktop: (styles: any) => `@media only screen and (min-width: 1200px) { ${styles} }`,
  
  // 가로 모드
  landscape: (styles: any) => `@media only screen and (orientation: landscape) { ${styles} }`,
  
  // 세로 모드
  portrait: (styles: any) => `@media only screen and (orientation: portrait) { ${styles} }`,
  
  // 다크 모드
  darkMode: (styles: any) => `@media (prefers-color-scheme: dark) { ${styles} }`,
  
  // 특정 브레이크포인트 이하
  below: (breakpoint: number) => (styles: any) => `@media only screen and (max-width: ${breakpoint}px) { ${styles} }`,
  
  // 특정 브레이크포인트 이상
  above: (breakpoint: number) => (styles: any) => `@media only screen and (min-width: ${breakpoint}px) { ${styles} }`
};

// Tailwind CSS 클래스와 함께 사용할 수 있는 헬퍼 함수들
export const ResponsiveHelper = {
  // 모바일에서만 표시
  mobileOnly: 'block md:hidden',
  
  // 데스크톱에서만 표시
  desktopOnly: 'hidden md:block',
  
  // 태블릿 이상에서 표시
  tabletAndUp: 'hidden sm:block',
  
  // 랩톱 이상에서 표시
  laptopAndUp: 'hidden lg:block',
  
  // 데스크톱 이상에서 표시
  desktopAndUp: 'hidden xl:block'
};

// CSS 변수로 사용할 수 있는 브레이크포인트 값들
export const Breakpoints = {
  mobile: 480,
  tablet: 768,
  laptop: 1024,
  desktop: 1200
};

export default MediaQuery;