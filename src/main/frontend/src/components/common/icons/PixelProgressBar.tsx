import React from "react";

interface PixelProgressBarProps {
  progress: number; // 0-100
  maxSteps?: number; // 픽셀 블록 개수 (기본값: 10)
  size?: "sm" | "md" | "lg";
  color?: "purple" | "green" | "blue" | "red" | "yellow";
  showPercentage?: boolean;
  className?: string;
  isMobile?: boolean;
}

export const PixelProgressBar: React.FC<PixelProgressBarProps> = ({
  progress,
  maxSteps = 10,
  size = "md",
  color = "purple",
  showPercentage = true,
  className = "",
  isMobile = false
}) => {
  // 색상 매핑
  const colors = {
    purple: {
      bg: "bg-purple-500",
      light: "bg-purple-100",
      glow: "#a855f7"
    },
    green: {
      bg: "bg-green-500",
      light: "bg-green-100",
      glow: "#22c55e"
    },
    blue: {
      bg: "bg-blue-500",
      light: "bg-blue-100",
      glow: "#3b82f6"
    },
    red: {
      bg: "bg-red-500",
      light: "bg-red-100",
      glow: "#ef4444"
    },
    yellow: {
      bg: "bg-yellow-500",
      light: "bg-yellow-100",
      glow: "#eab308"
    }
  };

  if (isMobile) {
    // 모바일용 심플한 프로그레스바
    return (
      <div className={`w-full ${className}`}>
        <div className="flex items-center justify-between text-xs font-mono text-gray-600 mb-2">
          <span>진행률</span>
          {showPercentage && (
            <span className="font-bold">
              {progress.toFixed(1)}%
            </span>
          )}
        </div>
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${colors[color].bg} transition-all duration-500`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }

  // 데스크톱용 픽셀 프로그레스바
  const stepsProgress = (progress / 100) * maxSteps;
  const fullBlocks = Math.floor(stepsProgress);
  const partialBlockFill = stepsProgress % 1;
  
  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4"
  };
  
  const colorClasses = {
    purple: {
      filled: "bg-purple-500 border-purple-700",
      empty: "bg-gray-200 border-gray-400"
    },
    green: {
      filled: "bg-green-500 border-green-700",
      empty: "bg-gray-200 border-gray-400"
    },
    blue: {
      filled: "bg-blue-500 border-blue-700",
      empty: "bg-gray-200 border-gray-400"
    },
    red: {
      filled: "bg-red-500 border-red-700",
      empty: "bg-gray-200 border-gray-400"
    },
    yellow: {
      filled: "bg-yellow-500 border-yellow-700",
      empty: "bg-gray-200 border-gray-400"
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between text-xs font-mono text-gray-600 mb-2">
        <span>진행률</span>
        {showPercentage && (
          <span className="font-bold">
            {progress.toFixed(1)}%
          </span>
        )}
      </div>
      <div className="flex gap-0.5">
        {Array.from({ length: maxSteps }, (_, index) => {
          const isFullyFilled = index < fullBlocks;
          const isPartiallyFilled = index === fullBlocks && partialBlockFill > 0;

          return (
            <div
              key={index}
              className={`
                flex-1 aspect-square relative overflow-hidden
                border-2
                ${isFullyFilled 
                  ? colorClasses[color].filled 
                  : colorClasses[color].empty
                }
                transition-all duration-500 ease-out
                ${isFullyFilled ? "shadow-lg animate-pulse" : "shadow-none"}
              `}
              style={{
                imageRendering: "pixelated",
                boxShadow: isFullyFilled 
                  ? `0 0 8px ${colors[color].glow},
                     0 0 16px ${colors[color].glow}20,
                     inset 0 0 8px ${colors[color].glow}`
                  : "none"
              }}
            >
              {/* 부분 채움을 위한 오버레이 */}
              {isPartiallyFilled && (
                <div
                  className="absolute inset-0 transition-all duration-500 ease-out"
                  style={{
                    background: `linear-gradient(to right, ${colors[color].glow} ${partialBlockFill * 100}%, transparent ${partialBlockFill * 100}%)`,
                    opacity: 0.5
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 픽셀 하트 진행률 컴포넌트
export const PixelHeartProgress: React.FC<PixelProgressBarProps> = ({
  progress,
  maxSteps = 5,
  size = "md",
  showPercentage = true,
  className = "",
  isMobile = false
}) => {
  // 백엔드에서 받은 진행률(0-100)을 하트 개수에 맞게 변환
  const filledHearts = Math.floor((progress / 100) * maxSteps);
  const hasHalfHeart = ((progress / 100) * maxSteps) % 1 >= 0.5;
  
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6"
  };

  const PixelHeart = ({ filled, half = false }: { filled: boolean; half?: boolean }) => (
    <div className={`${sizeClasses[size]} relative`}>
      <svg
        viewBox="0 0 16 16"
        className={`w-full h-full ${filled ? "text-pink-500" : "text-gray-300"}`}
        style={{ imageRendering: "pixelated" }}
      >
        <g fill="currentColor">
          <rect x="1" y="3" width="1" height="1" />
          <rect x="2" y="2" width="2" height="1" />
          <rect x="1" y="4" width="3" height="1" />
          <rect x="2" y="5" width="2" height="1" />
          <rect x="3" y="6" width="1" height="1" />
          
          <rect x="6" y="2" width="2" height="1" />
          <rect x="5" y="3" width="4" height="1" />
          <rect x="6" y="4" width="3" height="1" />
          <rect x="7" y="5" width="2" height="1" />
          <rect x="8" y="6" width="1" height="1" />
          
          <rect x="4" y="5" width="3" height="1" />
          <rect x="5" y="6" width="2" height="1" />
          <rect x="6" y="7" width="1" height="1" />
        </g>
        {half && (
          <defs>
            <clipPath id={`half-heart-${Math.random()}`}>
              <rect x="0" y="0" width="8" height="16" />
            </clipPath>
          </defs>
        )}
      </svg>
    </div>
  );

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between text-xs font-mono text-gray-600 mb-2">
        <span>진행률</span>
        {showPercentage && (
          <span className={`font-bold ${isMobile ? "text-sm" : "text-xs"}`}>
            {progress.toFixed(1)}%
          </span>
        )}
      </div>
      <div className={`flex ${isMobile ? "gap-2" : "gap-1"}`}>
        {Array.from({ length: maxSteps }, (_, index) => (
          <PixelHeart
            key={index}
            filled={index < filledHearts}
            half={index === filledHearts && hasHalfHeart}
          />
        ))}
      </div>
    </div>
  );
};