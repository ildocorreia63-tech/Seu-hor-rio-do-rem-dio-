import React, { useState } from 'react';
import appLogo from '../assets/logo.png';

interface AppLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showShadow?: boolean;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 'md',
  className = '',
  showShadow = true,
}) => {
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    xs: 'w-7 h-7 rounded-lg',
    sm: 'w-9 h-9 sm:w-10 sm:h-10 rounded-xl',
    md: 'w-10 h-10 sm:w-11 sm:h-11 rounded-2xl',
    lg: 'w-14 h-14 sm:w-16 sm:h-16 rounded-2xl',
    xl: 'w-20 h-20 sm:w-24 sm:h-24 rounded-3xl',
  };

  return (
    <div
      className={`relative shrink-0 flex items-center justify-center bg-white overflow-hidden ${
        showShadow ? 'shadow-md shadow-slate-900/10' : ''
      } ${sizeClasses[size]} ${className}`}
    >
      {!hasError ? (
        <img
          src={appLogo}
          alt="Seu Horário do Remédio"
          className="w-full h-full object-cover select-none"
          loading="eager"
          onError={() => setHasError(true)}
        />
      ) : (
        /* Vector SVG Fallback with the exact colors and design */
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full object-contain select-none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Clock Circle */}
          <circle cx="50" cy="50" r="42" fill="#0284c7" />
          <circle cx="50" cy="50" r="36" fill="#f8fafc" />
          {/* Clock Hands */}
          <line x1="50" y1="50" x2="50" y2="26" stroke="#0f172a" strokeWidth="4.5" strokeLinecap="round" />
          <line x1="50" y1="50" x2="68" y2="50" stroke="#0f172a" strokeWidth="4.5" strokeLinecap="round" />
          <circle cx="50" cy="50" r="3.5" fill="#0284c7" />
          {/* Alarm Bell */}
          <path
            d="M74 24C74 20 70 17 66 17C62 17 58 20 58 24C58 28 55 31 55 31H77C77 31 74 28 74 24Z"
            fill="#06b6d4"
          />
          <circle cx="66" cy="33" r="2" fill="#0e7490" />
          {/* Capsule Pill */}
          <g transform="rotate(-35 55 60)">
            <rect x="42" y="48" width="30" height="14" rx="7" fill="#0d9488" />
            <rect x="42" y="48" width="15" height="14" rx="7" fill="#ffffff" />
          </g>
        </svg>
      )}
    </div>
  );
};
