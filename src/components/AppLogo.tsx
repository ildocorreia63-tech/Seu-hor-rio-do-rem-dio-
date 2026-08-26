import React from 'react';
import { APP_LOGO_SRC } from '../assets/logoBase64';

interface AppLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showShadow?: boolean;
  rounded?: 'default' | 'full' | 'none';
}

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 'md',
  className = '',
  showShadow = true,
  rounded = 'default',
}) => {
  const sizeClasses = {
    xs: 'w-7 h-7',
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-20 h-20 sm:w-24 sm:h-24',
    xl: 'w-28 h-28 sm:w-36 sm:h-36',
    '2xl': 'w-40 h-40 sm:w-48 sm:h-48',
  };

  const roundedClasses = {
    default: 'rounded-2xl sm:rounded-3xl',
    full: 'rounded-full',
    none: 'rounded-none',
  };

  return (
    <div
      className={`relative shrink-0 flex items-center justify-center bg-white overflow-hidden p-1 ${
        showShadow ? 'shadow-xl shadow-slate-950/20' : ''
      } ${roundedClasses[rounded]} ${sizeClasses[size]} ${className}`}
    >
      <img
        src={APP_LOGO_SRC}
        alt="Seu Horário do Remédio"
        className="w-full h-full object-contain select-none block"
        loading="eager"
        decoding="sync"
      />
    </div>
  );
};

