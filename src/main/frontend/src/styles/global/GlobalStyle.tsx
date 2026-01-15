import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  /* Reset CSS */
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, 'Helvetica Neue', 'Segoe UI', 'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }



  /* Y2K Grid Styles */
  .y2k-grid {
    position: relative;
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background: 
        linear-gradient(rgba(255,255,255,0.075) 0.1em, transparent 0.1em),
        linear-gradient(90deg, rgba(255,255,255,0.075) 0.1em, transparent 0.1em);
      background-size: 3em 3em;
      pointer-events: none;
    }
  }

  .y2k-window {
  background: #fff;
  border: 3px solid white;
  border-radius: 8px  ;
  box-shadow: inset 0 0 0 2px #000;
  }

  .y2k-window-title {
    background: linear-gradient(to right,#663266, #9a66cc);
    color: white;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    padding: 0.5rem 0.75rem;
    height: 30px;
    display: flex;
    align-items: center;
    box-sizing: border-box;
  }

  .y2k-main-title {
    background: linear-gradient(to right,#663266, #9a66cc);
    color: white;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    padding: 0.75rem 1rem;
    height: 36px;
    display: flex;
    align-items: center;
    box-sizing: border-box;
  }

  .y2k-button {
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.5);
    box-shadow: 
      0 2px 8px rgba(0, 0, 0, 0.1),
      inset 0 0 8px rgba(255, 255, 255, 0.5);
    transition: all 0.2s;

    &:hover {
      background: rgba(255, 255, 255, 1);
      transform: translateY(-1px);
      box-shadow: 
        0 4px 12px rgba(0, 0, 0, 0.15),
        inset 0 0 8px rgba(255, 255, 255, 0.5);
    }

    &:active {
      transform: translateY(0);
      box-shadow: 
        0 2px 4px rgba(0, 0, 0, 0.1),
        inset 0 0 8px rgba(255, 255, 255, 0.5);
    }
  }

  .neon-glow {
    color: #fff;
    text-shadow: 
      0 0 5px #fff,
      0 0 10px #fff,
      0 0 20px #ff00de,
      0 0 30px #ff00de,
      0 0 40px #ff00de;
  }

  .retro-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.5) rgba(0, 0, 0, 0.1);

    &::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }

    &::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.1);
      border-radius: 4px;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.5);
      border-radius: 4px;
      border: 2px solid rgba(0, 0, 0, 0.1);

      &:hover {
        background: rgba(255, 255, 255, 0.7);
      }
    }
  }

  /* Pixel Modal Styles */
  .pixel-perfect {
    image-rendering: pixelated;
    image-rendering: -moz-crisp-edges;
    image-rendering: crisp-edges;
  }

  .pixel-bounce {
    animation: pixel-bounce 0.6s ease-in-out;
  }

  @keyframes pixel-bounce {
    0%, 20%, 50%, 80%, 100% {
      transform: translateY(0);
    }
    40% {
      transform: translateY(-4px);
    }
    60% {
      transform: translateY(-2px);
    }
  }

  .pixel-blink {
    animation: pixel-blink 1s infinite;
  }

  @keyframes pixel-blink {
    0%, 50% {
      opacity: 1;
    }
    51%, 100% {
      opacity: 0.3;
    }
  }

  .pixel-text-shadow {
    text-shadow: 
      1px 1px 0px #000,
      2px 2px 0px #000;
  }

  .pixel-glow {
    text-shadow: 
      0 0 5px currentColor,
      0 0 10px currentColor,
      0 0 15px currentColor;
  }

  .retro-border {
    border: 2px solid #000;
    box-shadow: 
      inset 2px 2px 0px rgba(255, 255, 255, 0.5),
      inset -2px -2px 0px rgba(0, 0, 0, 0.5);
  }

  /* Mobile Modal Styles */
  .mobile-card {
    background: white;
    border: 3px solid #000;
    border-radius: 0;
    box-shadow: 
      0 4px 0px #000,
      0 8px 16px rgba(0, 0, 0, 0.3);
  }

  .mobile-header {
    background: #703c7a;
    color: white;
    padding: 0.5rem 1rem;
    border-bottom: 2px solid #000;
    min-height: 40px;
    display: flex;
    align-items: center;
  }

  .mobile-button {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: 2px solid #000;
    padding: 0.75rem 1rem;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    transition: all 0.2s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    }

    &:active {
      transform: translateY(0);
    }
  }

  .mobile-button-outline {
    background: white;
    color: #000;
    border: 2px solid #000;
    padding: 0.75rem 1rem;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    transition: all 0.2s;

    &:hover {
      background: #f0f0f0;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    }

    &:active {
      transform: translateY(0);
    }
  }

  .mobile-card {
    background: white;
    border: 2px solid #000;
    border-radius: 8px;
    padding: 1rem;
    margin: 1rem;
    box-shadow: 4px 4px 0px rgba(0, 0, 0, 0.8);
    transition: all 0.2s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 6px 6px 0px rgba(0, 0, 0, 0.8);
    }
  }

  .mobile-badge {
    background: #f3f4f6;
    color: #374151;
    border: 1px solid #d1d5db;
    padding: 0.25rem 0.5rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .mobile-input {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #8c6193;
    border-radius: 4px;
    font-size: 1rem;
    transition: all 0.2s;

    &:focus {
      outline: none;
      border-color: #8c6193;
      box-shadow: 0 0 0 3px rgba(140, 97, 147, 0.1);
    }
  }

  .mobile-textarea {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #000;
    border-radius: 4px;
    font-size: 1rem;
    resize: vertical;
    min-height: 120px;
    transition: all 0.2s;

    &:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
  }

  .mobile-floating-button {
    position: fixed;
    bottom: 5rem;
    right: 1rem;
    width: 56px;
    height: 56px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: 2px solid #000;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 4px 4px 0px rgba(0, 0, 0, 0.8);
    transition: all 0.2s;
    z-index: 50;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 6px 6px 0px rgba(0, 0, 0, 0.8);
    }

    &:active {
      transform: translateY(0);
      box-shadow: 2px 2px 0px rgba(0, 0, 0, 0.8);
    }
  }

  /* Animation Classes */
  .animate-in {
    animation-fill-mode: both;
  }

  .animate-out {
    animation-fill-mode: both;
  }

  .fade-in {
    animation: fadeIn 0.2s ease-out;
  }

  .fade-out {
    animation: fadeOut 0.15s ease-in;
  }

  .slide-in-from-bottom-4 {
    animation: slideInFromBottom 0.3s ease-out;
  }

  .slide-out-to-bottom-4 {
    animation: slideOutToBottom 0.2s ease-in;
  }

  .zoom-in-95 {
    animation: zoomIn95 0.15s ease-out;
  }

  .zoom-out-95 {
    animation: zoomOut95 0.1s ease-in;
  }

  .pixel-glitch-in {
    animation: pixelGlitchIn 0.3s ease-out;
  }

  .pixel-glitch-out {
    animation: pixelGlitchOut 0.2s ease-in;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes fadeOut {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }

  @keyframes slideInFromBottom {
    from {
      opacity: 0;
      transform: translateY(1rem);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideOutToBottom {
    from {
      opacity: 1;
      transform: translateY(0);
    }
    to {
      opacity: 0;
      transform: translateY(1rem);
    }
  }

  @keyframes zoomIn95 {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes zoomOut95 {
    from {
      opacity: 1;
      transform: scale(1);
    }
    to {
      opacity: 0;
      transform: scale(0.95);
    }
  }

  @keyframes pixelGlitchIn {
    0% {
      opacity: 0;
      transform: translateX(-10px) scale(0.9);
    }
    25% {
      opacity: 0.5;
      transform: translateX(5px) scale(0.95);
    }
    50% {
      opacity: 0.8;
      transform: translateX(-3px) scale(0.98);
    }
    75% {
      opacity: 0.9;
      transform: translateX(2px) scale(0.99);
    }
    100% {
      opacity: 1;
      transform: translateX(0) scale(1);
    }
  }

  @keyframes pixelGlitchOut {
    0% {
      opacity: 1;
      transform: translateX(0) scale(1);
    }
    25% {
      opacity: 0.8;
      transform: translateX(-2px) scale(0.98);
    }
    50% {
      opacity: 0.5;
      transform: translateX(3px) scale(0.95);
    }
    75% {
      opacity: 0.2;
      transform: translateX(-5px) scale(0.9);
    }
    100% {
      opacity: 0;
      transform: translateX(10px) scale(0.8);
    }
  }

  /* Hide scrollbar for webkit browsers */
  .overflow-x-auto::-webkit-scrollbar {
    display: none;
  }

  /* Media Queries */
  @media (max-width: 768px) {
    .star {
      display: none;
    }
    
    .intro-page .star,
    .login-page .star {
      display: block;
    }
  }
`;

export default GlobalStyle;