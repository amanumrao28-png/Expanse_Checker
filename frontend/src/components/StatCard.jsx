import React from 'react';
import GlassCard from './GlassCard';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

const StatCard = ({
  title,
  value,
  subtitle,
  change,
  changeType = 'neutral', // 'positive' (green), 'negative' (warning/red), 'neutral'
  icon: Icon,
  accentColor = 'cyan', // 'cyan', 'purple', 'emerald', 'indigo'
  onClick
}) => {
  const accentGradients = {
    cyan: {
      bg: 'from-cyan-500/15 to-blue-500/5',
      iconBg: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
      border: 'hover:border-cyan-500/40',
      glow: 'group-hover:shadow-[0_0_25px_-5px_rgba(56,189,248,0.25)]'
    },
    purple: {
      bg: 'from-purple-500/15 to-indigo-500/5',
      iconBg: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
      border: 'hover:border-purple-500/40',
      glow: 'group-hover:shadow-[0_0_25px_-5px_rgba(168,85,247,0.25)]'
    },
    emerald: {
      bg: 'from-emerald-500/15 to-teal-500/5',
      iconBg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      border: 'hover:border-emerald-500/40',
      glow: 'group-hover:shadow-[0_0_25px_-5px_rgba(16,185,129,0.25)]'
    },
    amber: {
      bg: 'from-amber-500/15 to-orange-500/5',
      iconBg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      border: 'hover:border-amber-500/40',
      glow: 'group-hover:shadow-[0_0_25px_-5px_rgba(245,158,11,0.25)]'
    }
  };

  const style = accentGradients[accentColor] || accentGradients.cyan;

  const changeColors = {
    positive: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    negative: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    neutral: 'text-slate-400 bg-slate-500/10 border-slate-500/20'
  };

  const ChangeIcon = changeType === 'positive' 
    ? ArrowUpRight 
    : changeType === 'negative' 
    ? ArrowDownRight 
    : Minus;

  return (
    <GlassCard
      interactive={!!onClick}
      onClick={onClick}
      className={`group p-5 md:p-6 transition-all duration-300 ${style.border} ${style.glow}`}
    >
      {/* Background ambient lighting */}
      <div className={`absolute -right-8 -top-8 w-28 h-28 bg-gradient-to-br ${style.bg} rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500`} />

      <div className="flex items-center justify-between gap-4 mb-4">
        <span className="text-xs md:text-sm font-medium text-slate-400 tracking-wide uppercase">
          {title}
        </span>
        {Icon && (
          <div className={`p-2.5 rounded-xl border ${style.iconBg} transition-transform duration-300 group-hover:scale-110 shadow-sm`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white group-hover:text-cyan-200 transition-colors">
          {value}
        </div>
      </div>

      {(change || subtitle) && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-800/80">
          {change && (
            <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-md border ${changeColors[changeType]}`}>
              <ChangeIcon className="w-3.5 h-3.5" />
              {change}
            </span>
          )}
          {subtitle && (
            <span className="text-xs text-slate-400 truncate">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </GlassCard>
  );
};

export default StatCard;
