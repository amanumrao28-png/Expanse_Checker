import React from 'react';
import GlassCard from './GlassCard';
import { Sparkles, AlertTriangle, CheckCircle, ArrowRight, Bot, AlertCircle, Info, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AIInsight = ({
  insight,
  onAskAI
}) => {
  const navigate = useNavigate();

  if (!insight) return null;

  // Severity styling map
  const severityConfig = {
    high: {
      label: 'High Severity',
      badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      dotBg: 'bg-rose-400'
    },
    medium: {
      label: 'Medium Severity',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      dotBg: 'bg-amber-400'
    },
    low: {
      label: 'Informational',
      badgeBg: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
      dotBg: 'bg-cyan-400'
    }
  };

  const typeConfig = {
    warning: {
      border: 'border-amber-500/30 hover:border-amber-500/60',
      icon: AlertTriangle,
      iconColor: 'text-amber-400',
      glow: 'hover:shadow-[0_0_25px_-5px_rgba(245,158,11,0.25)]',
      gradient: 'from-amber-500/10 via-purple-500/5 to-transparent'
    },
    danger: {
      border: 'border-rose-500/40 hover:border-rose-500/70',
      icon: AlertCircle,
      iconColor: 'text-rose-400',
      glow: 'hover:shadow-[0_0_25px_-5px_rgba(244,63,94,0.3)]',
      gradient: 'from-rose-500/15 via-purple-500/5 to-transparent'
    },
    success: {
      border: 'border-emerald-500/30 hover:border-emerald-500/60',
      icon: CheckCircle,
      iconColor: 'text-emerald-400',
      glow: 'hover:shadow-[0_0_25px_-5px_rgba(16,185,129,0.25)]',
      gradient: 'from-emerald-500/10 via-cyan-500/5 to-transparent'
    },
    info: {
      border: 'border-cyan-500/30 hover:border-cyan-500/60',
      icon: Sparkles,
      iconColor: 'text-cyan-400',
      glow: 'hover:shadow-[0_0_25px_-5px_rgba(56,189,248,0.25)]',
      gradient: 'from-cyan-500/10 via-blue-500/5 to-transparent'
    }
  };

  const currentType = typeConfig[insight.type] || typeConfig.info;
  const currentSeverity = severityConfig[insight.severity] || severityConfig.low;
  const IconComponent = currentType.icon;

  const handleAction = () => {
    const textToAsk = insight.explanation || insight.content;
    if (onAskAI) {
      onAskAI(insight);
    } else {
      navigate('/ai-assistant', { state: { prompt: `Tell me more about this insight: "${textToAsk}" and how I can optimize my budget.` } });
    }
  };

  return (
    <GlassCard
      interactive
      onClick={handleAction}
      className={`p-5 relative group overflow-hidden border transition-all duration-300 transform hover:-translate-y-1 ${currentType.border} ${currentType.glow} animate-fade-in`}
    >
      {/* Background AI Mesh Glow with subtle pulse */}
      <div className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl ${currentType.gradient} rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500`} />

      {/* Top Header Row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* AI Icon with glowing badge */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500/20 via-purple-600/20 to-blue-500/20 border border-purple-500/30 shadow-md flex items-center justify-center shrink-0 group-hover:border-cyan-400/50 transition-colors">
            <Bot className="w-4 h-4 text-cyan-400 group-hover:rotate-6 transition-transform" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold tracking-wider uppercase text-purple-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" />
                AI Financial Insight
              </span>
            </div>
            <h4 className="text-sm sm:text-base font-bold text-white mt-0.5 group-hover:text-cyan-200 transition-colors truncate">
              {insight.title}
            </h4>
          </div>
        </div>

        {/* Severity Badge */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${currentSeverity.badgeBg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${currentSeverity.dotBg} animate-ping [animation-duration:2s]`} />
            <span>{currentSeverity.label}</span>
          </span>
        </div>
      </div>

      {/* Explanation Text */}
      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed relative z-10 my-2">
        {insight.explanation || insight.content}
      </p>

      {/* Metric Badge & Call to action */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-medium">
        {insight.metric ? (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-800/90 text-slate-200 border border-slate-700/80">
            {insight.metric}
          </span>
        ) : (
          <span className="text-[10px] text-slate-500">PostgreSQL Verified</span>
        )}

        <span className="text-cyan-400 group-hover:text-cyan-300 flex items-center gap-1 transition-colors">
          <span>Ask Gemma</span>
          <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
        </span>
      </div>
    </GlassCard>
  );
};

export default AIInsight;
