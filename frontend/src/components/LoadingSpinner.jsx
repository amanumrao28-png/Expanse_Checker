import React from 'react';

const LoadingSpinner = ({ text = 'Loading student finance data...', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4'
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 gap-3">
      <div className="relative">
        <div
          className={`${sizeClasses[size]} rounded-full border-cyan-500/20 border-t-cyan-400 animate-spin`}
        />
        <div
          className={`absolute inset-0 ${sizeClasses[size]} rounded-full border-purple-500/20 border-b-purple-400 animate-spin`}
          style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}
        />
      </div>
      {text && (
        <p className="text-xs md:text-sm text-slate-400 font-medium animate-pulse tracking-wide">
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
