import React from 'react';

const GlassCard = ({
  children,
  className = '',
  interactive = false,
  gradientBorder = false,
  glow = false,
  onClick,
  ...props
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        relative rounded-[20px] overflow-hidden transition-all duration-300
        ${interactive ? 'glass-panel-interactive cursor-pointer' : 'glass-panel'}
        ${gradientBorder ? 'before:absolute before:inset-0 before:p-[1px] before:rounded-[20px] before:bg-gradient-to-r before:from-cyan-500/30 before:via-purple-500/25 before:to-blue-500/30 before:-z-10' : ''}
        ${glow ? 'ai-card-glow' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

export default GlassCard;
