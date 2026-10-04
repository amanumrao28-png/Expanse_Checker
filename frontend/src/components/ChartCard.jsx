import React from 'react';
import GlassCard from './GlassCard';

const ChartCard = ({
  title,
  subtitle,
  action,
  children,
  className = '',
  height = 'h-72'
}) => {
  return (
    <GlassCard className={`p-5 md:p-6 flex flex-col justify-between ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-base md:text-lg font-bold text-white tracking-tight">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs md:text-sm text-slate-400 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>

      {/* Chart container */}
      <div className={`w-full ${height}`}>
        {children}
      </div>
    </GlassCard>
  );
};

export default ChartCard;
