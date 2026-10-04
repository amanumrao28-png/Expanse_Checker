import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet,
  DollarSign,
  TrendingDown,
  CalendarDays,
  Plus,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Receipt
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import GlassCard from '../components/GlassCard';
import StatCard from '../components/StatCard';
import ChartCard from '../components/ChartCard';
import ExpenseCard from '../components/ExpenseCard';
import AIInsight from '../components/AIInsight';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import { StatCardSkeleton, ChartCardSkeleton } from '../components/Skeleton';
import { useExpenses } from '../context/ExpenseContext';
import { formatCurrency, formatPercent, getCurrencySymbol } from '../utils/formatters';

// Custom sleek glass tooltip for Recharts
const CustomTooltip = ({ active, payload, label, prefix = null }) => {
  const sym = prefix || getCurrencySymbol();
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/90 border border-slate-700/80 backdrop-blur-xl p-3 rounded-xl shadow-2xl">
        <p className="text-xs font-semibold text-slate-400 mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm font-bold text-white flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: entry.color || entry.fill }}
            />
            <span>{entry.name || 'Amount'}:</span>
            <span className="text-cyan-300">
              {sym}{typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
            </span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const Dashboard = ({ onOpenAddExpense }) => {
  const navigate = useNavigate();
  const { expenses, analytics, insights, insightsMetadata, isLoading, apiError, refreshData, deleteExpense } = useExpenses();

  // Loading Skeletons
  if (isLoading && !analytics) {
    return (
      <div className="space-y-8 animate-fade-in pb-12">
        <div className="h-44 rounded-3xl bg-slate-800/40 animate-pulse border border-slate-800/80" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChartCardSkeleton className="lg:col-span-2" />
          <ChartCardSkeleton />
        </div>
      </div>
    );
  }

  // Error State
  if (apiError && !analytics) {
    return (
      <ErrorState
        title="Could not connect to PostgreSQL Backend"
        message={apiError}
        onRetry={refreshData}
      />
    );
  }

  const {
    totalSpent = 0,
    monthlyBudget = 1500,
    remainingBudget = 1500,
    dailyAverage = 0,
    spendingChange = 0,
    categoryData = [],
    monthlyTrend = [],
    weeklyData = []
  } = analytics || {};

  const recentExpenses = expenses.slice(0, 5);
  const hasExpenses = expenses && expenses.length > 0;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl p-6 sm:p-10 border border-cyan-500/20 bg-gradient-to-r from-slate-900/90 via-[#0d162a]/80 to-purple-950/40 backdrop-blur-xl shadow-2xl">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-3">
            Your money, <span className="text-gradient-cyan-blue">understood.</span>
          </h1>

          <p className="text-sm sm:text-lg text-slate-300 mb-8 max-w-2xl leading-relaxed">
            Track your spending and let AI help you make smarter decisions. Balance tuition, dorm rent, meal plans, and campus life with ease.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={onOpenAddExpense || (() => navigate('/add-expense'))}
              icon={Plus}
              size="md"
            >
              Add Expense
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Cards Section (Calculated strictly from PostgreSQL) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* 1. Total Spent */}
        <StatCard
          title="Total Spent"
          value={formatCurrency(totalSpent)}
          subtitle="this billing cycle"
          change={spendingChange !== 0 ? formatPercent(spendingChange) : (hasExpenses ? "Live" : undefined)}
          changeType={spendingChange > 0 ? "negative" : spendingChange < 0 ? "positive" : "neutral"}
          icon={DollarSign}
          accentColor="cyan"
          onClick={() => navigate('/expenses')}
        />

        {/* 2. Monthly Budget */}
        <StatCard
          title="Monthly Budget"
          value={formatCurrency(monthlyBudget)}
          subtitle="target limit"
          change="PostgreSQL"
          changeType="neutral"
          icon={Wallet}
          accentColor="purple"
          onClick={() => navigate('/budget')}
        />

        {/* 3. Remaining Budget */}
        <StatCard
          title="Remaining Budget"
          value={formatCurrency(remainingBudget)}
          subtitle={remainingBudget >= 0 ? "healthy buffer" : "budget exceeded"}
          change={remainingBudget >= 0 ? "On Track" : "Attention"}
          changeType={remainingBudget >= 0 ? "positive" : "negative"}
          icon={TrendingDown}
          accentColor={remainingBudget >= 0 ? "emerald" : "amber"}
          onClick={() => navigate('/budget')}
        />

        {/* 4. Daily Average */}
        <StatCard
          title="Daily Average"
          value={formatCurrency(dailyAverage)}
          subtitle="per day this month"
          change="Calculated"
          changeType="neutral"
          icon={CalendarDays}
          accentColor="amber"
          onClick={() => navigate('/analytics')}
        />
      </section>

      {/* AI Insights Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-sm">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                AI Financial Insights
              </h2>
              <p className="text-xs text-slate-400 hidden sm:block">
                Automated spending analysis grounded in your PostgreSQL records
              </p>
            </div>
          </div>
        </div>

        {insights && insights.length > 0 && (insightsMetadata?.hasSufficientData ?? true) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insights.map((insight) => (
              <AIInsight key={insight.id} insight={insight} />
            ))}
          </div>
        ) : (
          <GlassCard className="p-8 border border-slate-800/80 text-center flex flex-col items-center justify-center space-y-3 relative overflow-hidden">
            <div className="absolute top-0 right-1/3 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500/20 to-cyan-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 shadow-md">
              <Sparkles className="w-6 h-6 text-cyan-400 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">AI Financial Insights</h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md">
                Add more expenses to unlock personalized insights.
              </p>
            </div>
            <Button
              size="sm"
              icon={Plus}
              onClick={onOpenAddExpense || (() => navigate('/add-expense'))}
              className="mt-2"
            >
              Add Expense
            </Button>
          </GlassCard>
        )}
      </section>

      {/* Charts Section: Connected to real PostgreSQL APIs */}
      {hasExpenses ? (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 1. Monthly Spending Line Chart */}
          <ChartCard
            title="Monthly Spending Trend"
            subtitle="Actual monthly expenses from PostgreSQL database"
            className="lg:col-span-2"
            height="h-80"
            action={
              <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-medium">
                Live Data
              </span>
            }
          >
            {monthlyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrend} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="spentGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#38bdf8" />
                      <stop offset="100%" stopColor="#818cf8" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                  <XAxis dataKey="month" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(val) => `${getCurrencySymbol()}${val}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="spent"
                    name="Spent"
                    stroke="url(#spentGradient)"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#38bdf8', stroke: '#070b14', strokeWidth: 2 }}
                    activeDot={{ r: 7, fill: '#38bdf8', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="budget"
                    name="Budget Target"
                    stroke="#64748b"
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                No monthly data yet
              </div>
            )}
          </ChartCard>

          {/* 2. Category Spending Donut Chart */}
          <ChartCard
            title="Category Distribution"
            subtitle="Breakdown of recorded spending"
            height="h-80"
          >
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="amount"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#070b14" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                No category data yet
              </div>
            )}
          </ChartCard>

          {/* 3. Weekly Spending Bar Chart */}
          <ChartCard
            title="Weekly Spending Cadence"
            subtitle="Spending grouped by week from PostgreSQL"
            className="lg:col-span-3"
            height="h-72"
          >
            {weeklyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38bdf8" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                  <XAxis dataKey="day" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(val) => `${getCurrencySymbol()}${val}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="amount"
                    name="Week Spend"
                    fill="url(#barGradient)"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                No weekly data recorded yet
              </div>
            )}
          </ChartCard>
        </section>
      ) : (
        /* Empty State when no data exists (no fake numbers) */
        <EmptyState
          title="No expenses yet"
          description="Start tracking your spending."
          actionLabel="Add Expense"
          onAction={onOpenAddExpense || (() => navigate('/add-expense'))}
        />
      )}

      {/* Recent Expenses Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Recent Transactions
            </h2>
          </div>
          <button
            onClick={() => navigate('/expenses')}
            className="text-xs sm:text-sm text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>View All ({expenses.length})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {recentExpenses.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {recentExpenses.map((expense) => (
              <ExpenseCard
                key={expense.id}
                expense={expense}
                onDelete={deleteExpense}
                onEdit={() => navigate('/expenses', { state: { editExpenseId: expense.id } })}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No expenses yet"
            description="Start tracking your spending."
            actionLabel="Add Expense"
            onAction={onOpenAddExpense || (() => navigate('/add-expense'))}
          />
        )}
      </section>
    </div>
  );
};

export default Dashboard;
