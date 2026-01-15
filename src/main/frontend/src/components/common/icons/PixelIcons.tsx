import React from 'react';

interface PixelIconProps {
  size?: number;
  color?: string;
  className?: string;
}

// Trophy 아이콘 (챌린지)
export const PixelTrophy: React.FC<PixelIconProps> = ({ 
  size = 24, 
  color = '#ffffff', 
  className = '' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 22 20" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M17 2V0H5V2H0V7H1V9H2V10H3V11H4V12H5V13H8V14H10V17H6V20H16V17H12V14H14V13H17V12H18V11H19V10H20V9H21V7H22V2H17ZM4 10V9H3V7H2V4H4V5H5V7H6V10H7V11H5V10H4ZM20 7H19V9H18V10H17V11H15V10H16V8H17V5H18V4H20V7Z" 
      fill={color}
    />
  </svg>
);

// Save 아이콘 (디스크북)
export const PixelSave: React.FC<PixelIconProps> = ({ 
  size = 24, 
  color = '#ffffff', 
  className = '' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M22 7V6H21V5H20V4H19V3H18V2H17V1H2V2H1V22H2V23H22V22H23V7H22ZM9 19V15H10V14H14V15H15V19H14V20H10V19H9ZM16 10H4V4H16V10Z" 
      fill={color}
    />
  </svg>
);

// Pencil 아이콘 (일기장)
export const PixelPencil: React.FC<PixelIconProps> = ({ 
  size = 24, 
  color = '#ffffff', 
  className = '' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M8 20H9V21H8V22H7V23H1V17H2V16H3V15H4V16H5V17H6V18H7V19H8V20Z" fill={color}/>
    <path d="M17 10H18V12H17V13H16V14H15V15H14V16H13V17H12V18H11V19H10V18H9V17H8V16H7V15H6V14H5V13H6V12H7V11H8V10H9V9H10V8H11V7H12V6H14V7H15V8H16V9H17V10Z" fill={color}/>
    <path d="M23 4V7H22V8H21V9H19V8H18V7H17V6H16V5H15V3H16V2H17V1H20V2H21V3H22V4H23Z" fill={color}/>
  </svg>
);

// Comment Dots 아이콘 (고민상담소)
export const PixelCommentDots: React.FC<PixelIconProps> = ({ 
  size = 24, 
  color = '#ffffff', 
  className = '' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M22 8V6H21V5H20V4H18V3H15V2H9V3H6V4H4V5H3V6H2V8H1V14H2V16H3V18H2V19H1V21H6V20H7V19H9V20H15V19H18V18H20V17H21V16H22V14H23V8H22ZM16 13V12H15V10H16V9H18V10H19V12H18V13H16ZM10 12V10H11V9H13V10H14V12H13V13H11V12H10ZM8 9V10H9V12H8V13H6V12H5V10H6V9H8Z" 
      fill={color}
    />
  </svg>
);

// User 아이콘 (내 서랍)
export const PixelUser: React.FC<PixelIconProps> = ({ 
  size = 24, 
  color = '#ffffff', 
  className = '' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" 
      fill={color}
    />
  </svg>
);

// Plus 아이콘 (글 작성용)
export const PixelPlus: React.FC<PixelIconProps> = ({ 
  size = 30, 
  color = '#5937F6', 
  className = '' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 30 30" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M28.75 13.75V16.25H27.5V17.5H17.5V27.5H16.25V28.75H13.75V27.5H12.5V17.5H2.5V16.25H1.25V13.75H2.5V12.5H12.5V2.5H13.75V1.25H16.25V2.5H17.5V12.5H27.5V13.75H28.75Z" 
      fill={color}
    />
  </svg>
);

// Circle 아이콘 (FAB 배경용) - 픽셀 스타일 원형
export const PixelCircle: React.FC<PixelIconProps> = ({ 
  size = 56, 
  color = '#61ffd3', 
  className = '' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 18 18" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M15 16H14V17H12V18H6V17H4V16H3V15H2V14H1V12H0V6H1V4H2V3H3V2H4V1H6V0H12V1H14V2H15V3H16V4H17V6H18V12H17V14H16V15H15V16Z" 
      fill={color}
    />
  </svg>
);

// Edit 아이콘 (수정)
export const PixelEdit: React.FC<PixelIconProps> = ({ 
  size = 24, 
  color = '#000000', 
  className = '' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path fill-rule="evenodd" clip-rule="evenodd" d="M18 2H16V4H18V2ZM3.99988 4.00002H9.99988V6.00002H3.99988V20H17.9999V14H19.9999V22H19.9999V22H1.99988V22V20V6.00002V4.00002H3.99988ZM8.00006 12H6.00006V16V18V18H12.0001V16L13.9999 16V14H11.9999V16L8.00006 16V12ZM11.9999 10H10V11.9999H8V9.99994H9.99994V8.00002H11.9999V6.00002H13.9999V8.00002H11.9999V10ZM14.0001 4.00002H16.0001V6.00002H14.0001V4.00002ZM17.9999 4.00002H19.9999V6.00002H21.9999V8.00002H19.9999V10H18V11.9999H16V9.99994H17.9999V8.00002H19.9999V6.00002H17.9999V4.00002ZM14.0001 12H16.0001V14H14.0001V12Z" fill={color}/>
  </svg>
);

// Delete 아이콘 (삭제)
export const PixelDelete: React.FC<PixelIconProps> = ({ 
  size = 24, 
  color = '#FF0000', 
  className = '' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path fill-rule="evenodd" clip-rule="evenodd" d="M15.9995 2H15.9998V4H15.9995V6H17.9995H19.9995H21.9995V8H19.9995V20H19.9998V22L19.9995 22H17.9995H5.99976L3.99976 22V20V8H1.99951V6H3.99976H5.99976H7.99976V4V2H9.99976H13.9995H15.9995ZM13.9995 4H9.99976V6H13.9995V4ZM13.9995 8H9.99976H7.99976L5.99976 8V20H17.9995V8L15.9995 8H13.9995ZM8.99951 10H10.9995V18H8.99951V10ZM14.9998 10H12.9998V18H14.9998V10Z" fill={color}/>
  </svg>
);

// Bell 아이콘 (알림)
export const PixelBell: React.FC<PixelIconProps> = ({ 
  size = 24, 
  color = '#5937F6', 
  className = '' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M15 20V22H14V23H10V22H9V20H15Z" 
      fill={color}
    />
    <path 
      d="M22 17V18H21V19H3V18H2V17H3V16H4V14H5V8H6V6H7V5H8V4H10V3H11V1H13V3H14V4H16V5H17V6H18V8H19V14H20V16H21V17H22Z" 
      fill={color}
    />
  </svg>
);

// Search 아이콘 (검색바용)
export const PixelSearch: React.FC<PixelIconProps> = ({ 
  size = 18, 
  color = '#999999', 
  className = '' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 18 18" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M16.5 16.5H15V15H16.5V16.5ZM15 15H13.5V13.5H15V15ZM10.5 13.5H4.5V12H10.5V13.5ZM13.5 13.5H12V12H13.5V13.5ZM4.5 12H3V10.5H4.5V12ZM12 12H10.5V10.5H12V12ZM3 10.5H1.5V4.5H3V10.5ZM13.5 10.5H12V4.5H13.5V10.5ZM4.5 4.5H3V3H4.5V4.5ZM12 4.5H10.5V3H12V4.5ZM10.5 3H4.5V1.5H10.5V3Z" 
      fill={color}
    />
  </svg>
);

// Eye 아이콘 (조회수용)
export const PixelEye: React.FC<PixelIconProps> = ({ 
  size = 13, 
  color = '#888888', 
  className = '' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 13 13" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M8.66665 5.95833V7.04166H8.12498V7.58333H7.58331V8.125H7.04165V8.66666H5.95831V8.125H5.41665V7.58333H4.87498V7.04166H4.33331V5.95833H5.41665V5.41666H5.95831V4.33333H7.04165V4.87499H7.58331V5.41666H8.12498V5.95833H8.66665Z" fill={color}/>
    <path d="M11.9167 5.95833V4.87499H11.375V4.33333H10.8334V3.79166H10.2917V3.24999H9.20835V2.70833H3.79169V3.24999H2.70835V3.79166H2.16669V4.33333H1.62502V4.87499H1.08335V5.95833H0.541687V7.04166H1.08335V8.125H1.62502V8.66666H2.16669V9.20833H2.70835V9.75H3.79169V10.2917H9.20835V9.75H10.2917V9.20833H10.8334V8.66666H11.375V8.125H11.9167V7.04166H12.4584V5.95833H11.9167ZM9.75002 7.04166H9.20835V8.125H8.66669V8.66666H8.12502V9.20833H7.04169V9.75H5.95835V9.20833H4.87502V8.66666H4.33335V8.125H3.79169V7.04166H3.25002V5.95833H3.79169V4.87499H4.33335V4.33333H4.87502V3.79166H5.95835V3.24999H7.04169V3.79166H8.12502V4.33333H8.66669V4.87499H9.20835V5.95833H9.75002V7.04166Z" fill={color}/>
  </svg>
);

// MessageCircle 아이콘 (댓글수용)
export const PixelMessageCircle: React.FC<PixelIconProps> = ({ 
  size = 11, 
  color = '#888888', 
  className = '' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 11 11" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M10.917 8.75H2.25V7.66699H9.83301V1.16699H1.16699V8.75H2.25V9.83301H1.16699V10.917H0.0830078V0.0830078H10.917V8.75ZM6.58301 6.04199H2.25V4.95801H6.58301V6.04199ZM8.75 3.875H2.25V2.79199H8.75V3.875Z" fill={color}/>
  </svg>
);

// Clock 아이콘 (시간용)
export const PixelClock: React.FC<PixelIconProps> = ({ 
  size = 13, 
  color = '#888888', 
  className = '' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 13 13" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M4.875 2.16699H8.125V1.08301H9.20801V2.16699H11.375V11.917H1.625V2.16699H3.79199V1.08301H4.875V2.16699ZM2.70801 10.833H10.292V5.41699H2.70801V10.833ZM5.95801 8.66699H3.79199V6.5H5.95801V8.66699ZM2.70801 4.33301H10.292V3.25H2.70801V4.33301Z" fill={color}/>
  </svg>
);

// Back 아이콘 (뒤로가기)
export const PixelBack: React.FC<PixelIconProps> = ({ 
  size = 24, 
  color = '#5937F6', 
  className = '' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M1 13V11H2V10H3V9H4V8H5V7H6V6H7V5H8V4H9V3H10V2H11V1H12V2H13V3H14V4H13V5H12V6H11V7H10V8H9V9H8V10H23V14H8V15H9V16H10V17H11V18H12V19H13V20H14V21H13V22H12V23H11V22H10V21H9V20H8V19H7V18H6V17H5V16H4V15H3V14H2V13H1Z" 
      fill={color}
    />
  </svg>
);
