import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/GlassCard';
import ChartCard from '../components/ChartCard';
import CategoryIcon from '../components/CategoryIcon';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import Button from '../components/Button';
import MonthlyReportModal from '../components/MonthlyReportModal';
import SpendingComparison from '../components/SpendingComparison';
import { ChartCardSkeleton, StatCardSkeleton } from '../components/Skeleton';
import { useExpenses } from '../context/ExpenseContext';
import { formatCurrency, formatPercent, getCurrencySymbol } from '../utils/formatters';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import {
  Sparkles,
  Award,
  Zap,
  Calendar,
  Layers,
  TrendingUp,
  Plus,
  FileText
} from 'lucide-react';

const Analytics = () => {
  const navigate = useNavigate();
  const { expenses, analytics, isLoading, apiError, refreshData } = useExpenses();
  const [viewType, setViewType] = useState('monthly'); // 'monthly' | 'weekly' | 'daily'
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Loading Skeletons
  if (isLoading && !analytics) {
    return (
      <div className="space-y-8 animate-fade-in pb-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCardSkeleton />
          <ChartCardSkeleton />
        </div>
      </div>
    );
  }

  // Error State
  if (apiError && !analytics) {
    return (
      <ErrorState
        title="Analytics Sync Error"
        message={apiError}
        onRetry={refreshData}
      />
    );
  }

  const hasExpenses = expenses && expenses.length > 0;

  if (!hasExpenses) {
    return (
      <div className="space-y-6 animate-fade-in pb-12">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Financial Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time analytics and category breakdowns from PostgreSQL
          </p>
        </div>
        <EmptyState
          title="No expenses yet"
          description="Start tracking your spending."
          actionLabel="Add Expense"
          onAction={() => navigate('/add-expense')}
        />
      </div>
    );
  }

  const {
    totalSpent = 0,
    monthlyBudget = 1500,
    remainingBudget = 1500,
    dailyAverage = 0,
    percentOfBudget = 0,
    previousMonthSpending = 0,
    spendingChange = 0,
    categories = [],
    categoryData = [],
    monthlyTrend = [],
    weeklyData = [],
    daily = []
  } = analytics || {};

  // Find top spending category from PostgreSQL
  const activeCategories = [...(categories || [])].sort((a, b) => b.amount - a.amount);
  const topCategory = activeCategories[0] || { category: 'None', amount: 0 };

  // Prepare trend data based on viewType
  let activeTrendData = [];
  if (viewType === 'monthly') {
    activeTrendData = monthlyTrend.map(m => ({ label: m.month, amount: m.spent }));
  } else if (viewType === 'weekly') {
    activeTrendData = weeklyData.map(w => ({ label: w.day, amount: w.amount }));
  } else {
    activeTrendData = daily.map(d => ({ label: d.date, amount: d.amount }));
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Financial Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time aggregated metrics from PostgreSQL database
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            onClick={() => setIsReportModalOpen(true)}
            variant="secondary"
            icon={FileText}
            size="sm"
            className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
          >
            Monthly Report
          </Button>

          {/* View Toggle */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setViewType('monthly')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                viewType === 'monthly' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setViewType('weekly')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                viewType === 'weekly' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Weekly
            </button>
            <button
              type="button"
              onClick={() => setViewType('daily')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                viewType === 'daily' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Daily
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard className="p-5 border-l-4 border-cyan-400">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase mb-1">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>Budget Utilization</span>
          </div>
          <div className="text-2xl font-bold text-white mt-1">{percentOfBudget}%</div>
          <p className="text-xs text-slate-400 mt-1">
            {percentOfBudget <= 80 ? 'Within budget limit' : 'Pacing fast this cycle'}
          </p>
        </GlassCard>

        <GlassCard className="p-5 border-l-4 border-purple-400">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase mb-1">
            <Award className="w-4 h-4 text-purple-400" />
            <span>Top Outflow Category</span>
          </div>
          <div className="text-2xl font-bold text-white mt-1 truncate">{topCategory.category}</div>
          <p className="text-xs text-slate-400 mt-1">
            {formatCurrency(topCategory.amount)} spent in this category
          </p>
        </GlassCard>

        <GlassCard className="p-5 border-l-4 border-emerald-400">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase mb-1">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Daily Burn Average</span>
          </div>
          <div className="text-2xl font-bold text-white mt-1">
            {formatCurrency(dailyAverage)}
          </div>
          <p className="text-xs text-slate-400 mt-1">Calculated per day this month</p>
        </GlassCard>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Area Chart */}
        <ChartCard
          title={`${viewType.charAt(0).toUpperCase() + viewType.slice(1)} Spending Trajectory`}
          subtitle="Real expenditure timeline from PostgreSQL"
          height="h-80"
        >
          {activeTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activeTrendData} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                <XAxis dataKey="label" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(val) => `${getCurrencySymbol()}${val}`} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900/90 border border-slate-700/80 backdrop-blur-xl p-3 rounded-xl shadow-2xl">
                          <p className="text-xs font-semibold text-slate-400 mb-1">{label}</p>
                          <p className="text-sm font-bold text-cyan-300">
                            Spent: {formatCurrency(payload[0].value)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#38bdf8"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#areaGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 text-xs">
              No trend records available
            </div>
          )}
        </ChartCard>

        {/* Category Breakdown Horizontal Bar Chart */}
        <ChartCard
          title="Expenditure by Category"
          subtitle="Real category sum totals from PostgreSQL"
          height="h-80"
        >
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryData}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 35, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                <XAxis type="number" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(val) => `${getCurrencySymbol()}${val}`} />
                <YAxis dataKey="name" type="category" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip
                  formatter={(val) => [formatCurrency(val), 'Spent']}
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '12px' }}
                />
                <Bar dataKey="amount" fill="#818cf8" radius={[0, 6, 6, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 text-xs">
              No category spending yet
            </div>
          )}
        </ChartCard>
      </div>

      {/* Complete Category Analysis List (All 9 Categories) */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-bold text-white mb-4">Complete Category Breakdown</h3>
        <div className="space-y-3">
          {categories.map((cat) => {
            const pct = Math.round((cat.amount / (cat.budget || 1)) * 100);
            return (
              <div key={cat.category} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/80">
                <div className="flex items-center gap-3">
                  <CategoryIcon categoryId={cat.category} size="sm" />
                  <div>
                    <h4 className="text-sm font-semibold text-white">{cat.category}</h4>
                    <p className="text-xs text-slate-400">
                      Target Cap: {formatCurrency(cat.budget)} • {cat.count} transaction{cat.count === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6">
                  <div className="text-right">
                    <span className="text-sm font-bold text-white">{formatCurrency(cat.amount)}</span>
                    <div className="text-[11px] text-slate-400">{cat.percentage}% of total spend</div>
                  </div>

                  <div className="w-24 sm:w-32 bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${pct > 100 ? 'bg-rose-500' : pct > 80 ? 'bg-amber-400' : 'bg-cyan-400'}`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Spending Period Comparison */}
      <SpendingComparison />

      {/* Monthly Report Modal */}
      <MonthlyReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
    </div>
  );
};

export default Analytics;
