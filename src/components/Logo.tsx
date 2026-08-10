import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textClassName?: string;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  textClassName = '',
}) => {
  const sizeMap = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const textSizeMap = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Official KeepFlow SVG Icon */}
      <div className={`relative flex-shrink-0 ${sizeMap[size]}`}>
        <img
          src="/logo.svg"
          alt="KeepFlow Logo"
          className="w-full h-full object-contain drop-shadow-md rounded-xl"
          referrerPolicy="no-referrer"
        />
      </div>

      {showText && (
        <span
          className={`font-black tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent select-none ${textSizeMap[size]} ${textClassName}`}
        >
          Keep<span className="font-light text-slate-800 dark:text-slate-100">Flow</span>
        </span>
      )}
    </div>
  );
};
