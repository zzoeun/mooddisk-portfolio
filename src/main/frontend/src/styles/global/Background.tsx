import React, { useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

// 임시로 cn 함수 직접 구현
const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(" ");
};

const animStar = keyframes`
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(-200vh);
  }
`;

const StarContainer = styled.div`
  position: absolute;
  inset: 0;

  .star {
    position: absolute;
    background: white;
    border-radius: 50%;
    opacity: 0.5;
    animation: ${animStar} linear infinite;
  }

  &#stars1 .star {
    animation-duration: 100s;
  }

  &#stars2 .star {
    animation-duration: 150s;
  }

  &#stars3 .star {
    animation-duration: 200s;
  }

  /* 모바일에서 별 애니메이션 제어 */
  @media (max-width: 768px) {
    .star {
      display: none;
    }
    
    .intro-page &,
    .login-page & {
      .star {
        display: block;
      }
    }
  }

  /* 작은 모바일에서도 동일하게 제어 */
  @media (max-width: 480px) {
    .star {
      display: none;
    }
    
    .intro-page &,
    .login-page & {
      .star {
        display: block;
      }
    }
  }
`;

const Background = () => {
  useEffect(() => {
    const createStars = (id: string, count: number, sizeRange: [number, number]) => {
      const container = document.getElementById(id);
      if (!container) return;
      
      for (let i = 0; i < count; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 200}vh`;
        // 크기 범위를 다양하게 설정
        const size = Math.random() * (sizeRange[1] - sizeRange[0]) + sizeRange[0];
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        // 밝기도 다양하게
        star.style.opacity = `${Math.random() * 0.7 + 0.3}`; // 0.3 ~ 1.0
        star.style.animationDelay = `${Math.random() * -200}s`;
        container.appendChild(star);
      }
    };

    // 반응형 별 생성 설정
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
      createStars('stars1', 150, [0.5, 2]); // 작은 별들
      createStars('stars2', 100, [1, 3]);   // 중간 크기 별들
      createStars('stars3', 50, [2, 4]);    // 큰 별들
    } else {
      createStars('stars1', 300, [0.5, 2]); // 작은 별들
      createStars('stars2', 200, [1, 3]);   // 중간 크기 별들
      createStars('stars3', 100, [2, 4]);   // 큰 별들
    }

    // Cleanup function
    return () => {
      ['stars1', 'stars2', 'stars3'].forEach(id => {
        const container = document.getElementById(id);
        if (container) {
          container.innerHTML = '';
        }
      });
    };
  }, []);

  return (
    <>
      <div className="fixed inset-0 bg-black -z-10">
        <StarContainer id="stars1" />
        <StarContainer id="stars2" />
        <StarContainer id="stars3" />
      </div>
      <div 
        className={cn(
          "fixed inset-0 -z-10",
          "after:absolute after:inset-0 after:bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.5)_100%)]"
        )}
      />
    </>
  );
};

export default Background;