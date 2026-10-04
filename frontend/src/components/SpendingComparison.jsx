import React, { useState, useEffect } from 'react';
import GlassCard from './GlassCard';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';
import { expenseService } from '../services/expenseService';
import { formatCurrency } from '../utils/formatters';
import {
  GitCompare,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Calendar,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

const SpendingComparison = () => {
  const now = new Date();
  const currentMonthStr = now.toISOString().substring(0, 7);
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthStr = prevMonth.toISOString().substring(0, 7);

  const [month1, setMonth1] = useState(currentMonthStr);
  const [month2, setMonth2] = useState(prevMonthStr);
  const [comparison, setComparison] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const runComparison = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await expenseService.compareSpending(month1, month2);
      setComparison(data);
    } catch (err) {
      console.error('Failed to compare spending periods:', err);
      setError('Unable to load comparison data from PostgreSQL');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runComparison();
  }, [month1, month2]);

  return (
    <GlassCard className="p-6 border border-slate-700/80 shadow-2xl space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-2">
            <GitCompare className="w-3.5 h-3.5" />
            <span>Fiscal Delta Analysis</span>
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Spending Comparison
          </h3>
          <p className="text-xs text-slate-400">
            Compare expenditure variances and category shifts across two billing cycles
          </p>
        </div>

        {/* Month Selectors */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative flex items-center group">
            <input
              type="month"
              value={month1}
              onChange={(e) => setMonth1(e.target.value)}
              className="pl-9 pr-2.5 py-1.5 rounded-xl glass-input text-xs text-white cursor-pointer font-semibold shadow-inner focus:border-cyan-400 transition-all"
            />
            <Calendar className="w-4 h-4 text-cyan-400 absolute left-2.5 pointer-events-none z-20 drop-shadow-[0_0_6px_rgba(34,211,238,0.9)] group-hover:scale-110 transition-transform" />
          </div>
          <span className="text-xs text-slate-500 font-extrabold uppercase">vs</span>
          <div className="relative flex items-center group">
            <input
              type="month"
              value={month2}
              onChange={(e) => setMonth2(e.target.value)}
              className="pl-9 pr-2.5 py-1.5 rounded-xl glass-input text-xs text-white cursor-pointer font-semibold shadow-inner focus:border-cyan-400 transition-all"
            />
            <Calendar className="w-4 h-4 text-cyan-400 absolute left-2.5 pointer-events-none z-20 drop-shadow-[0_0_6px_rgba(34,211,238,0.9)] group-hover:scale-110 transition-transform" />
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="py-12 text-center">
          <LoadingSpinner size="md" text="Comparing periods..." />
        </div>
      )}

      {error && !isLoading && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {comparison && !isLoading && (
        <div className="space-y-5 animate-fade-in">
          {/* Summary Delta Banner */}
          <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            comparison.difference_amount > 0
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              : comparison.difference_amount < 0
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-slate-800/80 border-slate-700 text-slate-300'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                comparison.difference_amount > 0
                  ? 'bg-rose-500/20 text-rose-400'
                  : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                {comparison.difference_amount > 0 ? (
                  <TrendingUp className="w-5 h-5" />
                ) : (
                  <TrendingDown className="w-5 h-5" />
                )}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider opacity-80">
                  Net Spend Variance
                </p>
                <h4 className="text-lg sm:text-xl font-bold text-white">
                  {comparison.difference_amount >= 0 ? '+' : '-'}{formatCurrency(Math.abs(comparison.difference_amount))}{' '}
                  <span className="text-sm font-normal opacity-80">
                    ({comparison.percentage_change.toFixed(1)}%)
                  </span>
                </h4>
              </div>
            </div>

            <div className="text-xs text-right opacity-90 space-y-0.5">
              <p>
                <strong>{comparison.period1.month}:</strong> {formatCurrency(comparison.period1.total_spent)} ({comparison.period1.transaction_count} tx)
              </p>
              <p>
                <strong>{comparison.period2.month}:</strong> {formatCurrency(comparison.period2.total_spent)} ({comparison.period2.transaction_count} tx)
              </p>
            </div>
          </div>

          {/* Category Delta Table */}
          <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900/60">
            <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <span>Category</span>
              <span>{comparison.period1.month} vs {comparison.period2.month}</span>
              <span>Variance</span>
            </div>

            <div className="divide-y divide-slate-800/60 text-xs">
              {comparison.category_deltas.map((cat, idx) => (
                <div key={idx} className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-slate-800/30 transition-colors">
                  <div className="min-w-[120px]">
                    <span className="font-semibold text-white">{cat.category}</span>
                  </div>

                  <div className="text-slate-300 font-mono text-center flex-1 max-w-xs">
                    <span>{formatCurrency(cat.period1_spent)}</span>
                    <span className="text-slate-500 mx-2">&bull;</span>
                    <span className="text-slate-400">{formatCurrency(cat.period2_spent)}</span>
                  </div>

                  <div className="text-right min-w-[100px]">
                    <span className={`font-bold px-2 py-0.5 rounded-md ${
                      cat.difference > 0
                        ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                        : cat.difference < 0
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {cat.difference > 0 ? '+' : ''}{formatCurrency(cat.difference)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </GlassCard>
  );
};

export default SpendingComparison;
