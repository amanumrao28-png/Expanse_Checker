import React from 'react';
import { formatCurrency } from '../utils/formatters';
import { getCategoryById } from '../utils/categories';
import CategoryIcon from './CategoryIcon';
import { ShieldCheck, AlertCircle, AlertTriangle, Flame } from 'lucide-react';

const BudgetProgress = ({
  categoryId,
  categoryName,
  spent = 0,
  budget = 100,
  remaining: customRemaining,
  percentageUsed: customPct,
  status: customStatus,
  statusLabel: customStatusLabel,
  showIcon = true,
  onClick
}) => {
  const cat = getCategoryById(categoryId || categoryName);
  const name = categoryName || cat.name;

  const numericSpent = typeof spent === 'number' ? spent : parseFloat(spent || 0);
  const numericBudget = typeof budget === 'number' ? budget : parseFloat(budget || 0);

  const calculatedPct = numericBudget > 0 ? (numericSpent / numericBudget) * 100 : 0;
  const pct = customPct !== undefined ? customPct : Math.round(calculatedPct * 10) / 10;
  const remaining = customRemaining !== undefined ? customRemaining : Math.round((numericBudget - numericSpent) * 100) / 100;

  // Determine visual state
  let stateKey = 'safe';
  let stateLabel = 'Safe spending';
  let StateIcon = ShieldCheck;
  let barGradient = 'from-emerald-400 via-teal-400 to-cyan-400';
  let badgeClasses = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25';
  let cardBorder = 'border-slate-800/80 hover:border-emerald-500/30';

  if (pct > 100) {
    stateKey = 'over_budget';
    stateLabel = 'Over budget';
    StateIcon = Flame;
    barGradient = 'from-rose-500 via-red-500 to-rose-600 animate-pulse';
    badgeClasses = 'text-rose-400 bg-rose-500/15 border-rose-500/30';
    cardBorder = 'border-rose-900/50 hover:border-rose-500/40';
  } else if (pct >= 85) {
    stateKey = 'near_limit';
    stateLabel = 'Near limit';
    StateIcon = AlertCircle;
    barGradient = 'from-orange-500 via-amber-500 to-rose-500';
    badgeClasses = 'text-orange-400 bg-orange-500/15 border-orange-500/30';
    cardBorder = 'border-orange-900/40 hover:border-orange-500/30';
  } else if (pct >= 70) {
    stateKey = 'warning';
    stateLabel = 'Warning';
    StateIcon = AlertTriangle;
    barGradient = 'from-amber-400 to-yellow-400';
    badgeClasses = 'text-amber-400 bg-amber-500/15 border-amber-500/30';
    cardBorder = 'border-amber-900/30 hover:border-amber-500/30';
  }

  const finalLabel = customStatusLabel || stateLabel;

  return (
    <div
      onClick={onClick}
      className={`p-4 sm:p-5 rounded-2xl bg-slate-900/50 backdrop-blur-md border ${cardBorder} transition-all duration-300 ${
        onClick ? 'hover:bg-slate-850/60 hover:scale-[1.01] cursor-pointer group shadow-lg hover:shadow-cyan-500/5' : ''
      }`}
    >
      {/* Top Header: Icon + Category + Status Badge */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          {showIcon && <CategoryIcon categoryId={cat.id} size="sm" />}
          <div className="min-w-0">
            <h5 className="text-sm sm:text-base font-bold text-white tracking-wide truncate group-hover:text-cyan-300 transition-colors">
              {name}
            </h5>
            <span className="text-[11px] sm:text-xs text-slate-400 font-medium">
              Budget: {formatCurrency(numericBudget)}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end shrink-0">
          <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${badgeClasses}`}>
            <StateIcon className="w-3.5 h-3.5" />
            <span>{finalLabel}</span>
          </div>
          <span className="text-[11px] text-slate-400 font-bold mt-1">
            {pct}% used
          </span>
        </div>
      </div>

      {/* Progress Track with animated bar */}
      <div className="w-full bg-slate-950/80 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-800/80 mb-3">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r ${barGradient}`}
          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        />
      </div>

      {/* Metrics Row: Spent & Remaining */}
      <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-800/50">
        <div>
          <span className="text-slate-500 text-[11px] block">Spent</span>
          <span className="font-bold text-slate-200">
            {formatCurrency(numericSpent)}
          </span>
        </div>

        <div className="text-right">
          <span className="text-slate-500 text-[11px] block">
            {remaining < 0 ? 'Over Limit' : 'Remaining'}
          </span>
          <span className={`font-bold ${remaining < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {remaining < 0 ? `-${formatCurrency(Math.abs(remaining))}` : formatCurrency(remaining)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default BudgetProgress;
