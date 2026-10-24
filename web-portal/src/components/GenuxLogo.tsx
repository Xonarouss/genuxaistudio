import React from 'react';

interface GenuxLogoProps {
  className?: string;
  size?: number;
  animated?: boolean;
}

export const GenuxLogo: React.FC<GenuxLogoProps> = ({ 
  className = "w-8 h-8", 
  size = 32,
  animated = false 
}) => {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg 
        viewBox="0 0 100 100" 
        width={size} 
        height={size}
        className={`transition-transform duration-300 ${animated ? 'hover:scale-110' : ''}`}
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="genuxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4F46E5" />
            <stop offset="50%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#9333EA" />
          </linearGradient>
          <linearGradient id="genuxPrism" x1="20%" y1="10%" x2="80%" y2="90%">
            <stop offset="0%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#4F46E5" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Structural Aperture Hexagon */}
        <polygon 
          points="50,6 88,27 88,73 50,94 12,73 12,27" 
          stroke="#0F172A" 
          strokeWidth="3.5" 
          strokeLinejoin="round"
          className="opacity-90"
        />

        {/* Dynamic Genjutsu Optical Iris Blades */}
        <path 
          d="M50 16 L76 31 L64 54 Z" 
          fill="url(#genuxGrad)" 
          opacity="0.9"
        />
        <path 
          d="M80 37 L80 67 L56 61 Z" 
          fill="url(#genuxGrad)" 
          opacity="0.8"
        />
        <path 
          d="M74 71 L48 86 L48 60 Z" 
          fill="url(#genuxGrad)" 
          opacity="0.9"
        />
        <path 
          d="M44 84 L18 69 L30 46 Z" 
          fill="url(#genuxGrad)" 
          opacity="0.75"
        />
        <path 
          d="M16 59 L16 29 L40 35 Z" 
          fill="url(#genuxGrad)" 
          opacity="0.85"
        />
        <path 
          d="M22 25 L48 10 L48 36 Z" 
          fill="url(#genuxGrad)" 
          opacity="0.7"
        />

        {/* Center Optical 3D Prism / Play Core */}
        <polygon 
          points="42,38 66,50 42,62" 
          fill="#FFFFFF" 
          filter="url(#glow)"
        />
        <circle 
          cx="50" 
          cy="50" 
          r="6" 
          fill="url(#genuxPrism)" 
        />
      </svg>
    </div>
  );
};
