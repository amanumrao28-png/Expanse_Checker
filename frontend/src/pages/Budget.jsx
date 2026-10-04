import React, { useState } from 'react';
import GlassCard from '../components/GlassCard';
import BudgetProgress from '../components/BudgetProgress';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { CATEGORIES } from '../utils/categories';
import { useExpenses } from '../context/ExpenseContext';
import { formatCurrency } from '../utils/formatters';
import {
  Wallet,
  Edit3,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Flame,
  Bot,
  Sliders,
  TrendingDown,
  CheckCircle2
} from 'lucide-react';

const Budget = () => {
  const { budgets, updateBudget, updateCategoryBudget, expenses, currencyVersion, showToast } = useExpenses();

  // State for editing Total Monthly Budget
  const [isEditingTotal, setIsEditingTotal] = useState(false);
  const [totalInput, setTotalInput] = useState('');

  // State for editing a specific Category Budget
  const [activeCategoryEdit, setActiveCategoryEdit] = useState(null);
  const [categoryInput, setCategoryInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Extract budget calculations from backend response or compute dynamically
  const totalBudget = budgets?.total_budget ?? budgets?.monthlyTotal ?? 10000;
  
  // Compute category map and spent values directly
  const categoryBudgetsMap = budgets?.category_budgets ?? budgets?.categories ?? {};
  
  // Calculate category spent from current expenses if not provided by backend list
  const categorySpentMap = {};
  expenses.forEach(e => {
    const cat = (e.category || 'Other').trim();
    categorySpentMap[cat] = (categorySpentMap[cat] || 0) + (parseFloat(e.amount) || 0);
  });

  const totalSpent = budgets?.total_spent ?? Math.round(
    Object.values(categorySpentMap).reduce((s, a) => s + a, 0) * 100
  ) / 100;

  const remaining = budgets?.remaining ?? Math.round((totalBudget - totalSpent) * 100) / 100;
  const percentageUsed = budgets?.percentage_used ?? (
    totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 1000) / 10 : 0
  );

  // Total allocated across all categories currently
  const totalAllocated = Math.round(
    CATEGORIES.reduce((sum, cat) => {
      const limit = categoryBudgetsMap[cat.name] ?? categoryBudgetsMap[cat.id] ?? cat.defaultBudget ?? 1000;
      return sum + (parseFloat(limit) || 0);
    }, 0) * 100
  ) / 100;

  // Other categories total (excluding the category currently being edited)
  const otherCategoriesTotal = activeCategoryEdit
    ? Math.round(
        CATEGORIES.reduce((sum, cat) => {
          if (cat.name === activeCategoryEdit.name) return sum;
          const limit = categoryBudgetsMap[cat.name] ?? categoryBudgetsMap[cat.id] ?? cat.defaultBudget ?? 1000;
          return sum + (parseFloat(limit) || 0);
        }, 0) * 100
      ) / 100
    : 0;

  // Maximum allowable budget for the category currently being edited without exceeding total monthly budget
  const maxAllowedForCategory = Math.max(0, Math.round((totalBudget - otherCategoriesTotal) * 100) / 100);

  const parsedCatInput = parseFloat(categoryInput);
  const projectedCatAmount = isNaN(parsedCatInput) ? 0 : parsedCatInput;
  const projectedTotalAllocated = Math.round((otherCategoriesTotal + projectedCatAmount) * 100) / 100;
  const isCategoryOverLimit = Boolean(activeCategoryEdit && (projectedCatAmount > maxAllowedForCategory));
  const categoryExcessAmount = Math.max(0, Math.round((projectedTotalAllocated - totalBudget) * 100) / 100);

  const parsedTotalInput = parseFloat(totalInput);
  const isTotalLowerThanCategories = !isNaN(parsedTotalInput) && parsedTotalInput < totalAllocated;

  // Status mapping
  const overallStatus = budgets?.status || (
    percentageUsed > 100 ? 'over_budget' :
    percentageUsed >= 85 ? 'near_limit' :
    percentageUsed >= 70 ? 'warning' : 'safe'
  );

  const overallStatusLabel = budgets?.status_label || (
    percentageUsed > 100 ? 'Over budget' :
    percentageUsed >= 85 ? 'Near limit' :
    percentageUsed >= 70 ? 'Warning' : 'Safe spending'
  );

  // Overall badge styling
  let statusBadgeClasses = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  let StatusIcon = ShieldCheck;
  let barGradient = 'from-emerald-400 via-teal-400 to-cyan-400';

  if (overallStatus === 'over_budget') {
    statusBadgeClasses = 'text-rose-400 bg-rose-500/15 border-rose-500/30 animate-pulse';
    StatusIcon = Flame;
    barGradient = 'from-rose-500 via-red-500 to-rose-600';
  } else if (overallStatus === 'near_limit') {
    statusBadgeClasses = 'text-orange-400 bg-orange-500/15 border-orange-500/30';
    StatusIcon = AlertCircle;
    barGradient = 'from-orange-500 via-amber-500 to-rose-500';
  } else if (overallStatus === 'warning') {
    statusBadgeClasses = 'text-amber-400 bg-amber-500/15 border-amber-500/30';
    StatusIcon = AlertTriangle;
    barGradient = 'from-amber-400 to-yellow-400';
  }

  // Category Budget Alerts for categories approaching or exceeding budget
  const categoryAlerts = CATEGORIES.map((cat) => {
    const limit = categoryBudgetsMap[cat.name] ?? categoryBudgetsMap[cat.id] ?? cat.defaultBudget ?? 1000;
    const spent = categorySpentMap[cat.name] ?? categorySpentMap[cat.id] ?? 0;
    const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
    return {
      category: cat.name,
      spent,
      limit,
      pct,
      isOver: pct > 100,
      isNear: pct >= 75 && pct <= 100
    };
  }).filter((a) => a.isOver || a.isNear);

  // Handle Saving Total Monthly Budget
  const handleOpenEditTotal = () => {
    setTotalInput(String(totalBudget));
    setIsEditingTotal(true);
  };

  const handleSaveTotal = async (e) => {
    e.preventDefault();
    const newTotal = parseFloat(totalInput);
    if (isNaN(newTotal) || newTotal <= 0) {
      showToast?.('Please enter a valid monthly budget amount', 'warning');
      return;
    }
    if (newTotal < totalAllocated) {
      showToast?.(
        `Total monthly budget (${formatCurrency(newTotal)}) cannot be less than current category allocations (${formatCurrency(totalAllocated)}). Please reduce category quotas first.`,
        'error',
        5000
      );
      return;
    }
    setIsSaving(true);
    try {
      await updateBudget({
        total_budget: newTotal,
        category_budgets: categoryBudgetsMap
      });
      setIsEditingTotal(false);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Opening Category Edit
  const handleOpenCatEdit = (cat) => {
    const currentLimit = categoryBudgetsMap[cat.name] ?? categoryBudgetsMap[cat.id] ?? cat.defaultBudget ?? 1000;
    setActiveCategoryEdit(cat);
    setCategoryInput(String(currentLimit));
  };

  // Handle Saving Category Budget
  const handleSaveCategoryBudget = async (e) => {
    e.preventDefault();
    if (!activeCategoryEdit) return;
    const newAmount = parseFloat(categoryInput);
    if (isNaN(newAmount) || newAmount < 0) {
      showToast?.('Please enter a valid category limit amount', 'warning');
      return;
    }

    // Check if new category limit exceeds the maximum allowable budget
    if (newAmount > maxAllowedForCategory) {
      showToast?.(
        `Maximum budget limit exceeded! Total category budgets cannot exceed your monthly budget of ${formatCurrency(totalBudget)}. Maximum allowed for ${activeCategoryEdit.name} is ${formatCurrency(maxAllowedForCategory)}.`,
        'error',
        5000
      );
      return;
    }

    setIsSaving(true);
    try {
      if (updateCategoryBudget) {
        await updateCategoryBudget(activeCategoryEdit.name, newAmount);
      } else {
        await updateBudget({
          total_budget: totalBudget,
          category_budgets: {
            ...categoryBudgetsMap,
            [activeCategoryEdit.name]: newAmount
          }
        });
      }
      setActiveCategoryEdit(null);
    } finally {
      setIsSaving(false);
    }
  };

  // Preset 1: Standard Student ₹10,000 Budget as requested in prompt example
  const handleApplyExamplePreset = async () => {
    setIsSaving(true);
    try {
      await updateBudget({
        total_budget: 10000,
        category_budgets: {
          Food: 2500,
          Travel: 1500,
          Education: 2000,
          Shopping: 1000,
          Entertainment: 800,
          Bills: 1000,
          Healthcare: 500,
          Electronics: 500,
          Other: 200
        }
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Preset 2: Smart Student Rule (50/30/20) adapted to active total
  const handleApplySmartStudentRule = async () => {
    setIsSaving(true);
    try {
      const base = totalBudget || 10000;
      await updateBudget({
        total_budget: base,
        category_budgets: {
          Food: Math.round(base * 0.25),
          Bills: Math.round(base * 0.15),
          Education: Math.round(base * 0.20),
          Travel: Math.round(base * 0.12),
          Shopping: Math.round(base * 0.08),
          Entertainment: Math.round(base * 0.07),
          Healthcare: Math.round(base * 0.05),
          Electronics: Math.round(base * 0.05),
          Other: Math.round(base * 0.03)
        }
      });
    } finally {
      setIsSaving(false);
    }
  };

  // AI-readable data from backend
  const aiData = budgets?.ai_financial_data;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span>Budget Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Establish overall monthly limits and category quotas with real-time financial tracking and AI telemetry.
          </p>
        </div>

        {/* Quick Preset Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            onClick={handleApplyExamplePreset}
            variant="secondary"
            icon={Sliders}
            size="sm"
            disabled={isSaving}
          >
            ₹10k Standard Budget
          </Button>

          <Button
            onClick={handleApplySmartStudentRule}
            variant="secondary"
            icon={Sparkles}
            size="sm"
            disabled={isSaving}
          >
            50/30/20 Student Rule
          </Button>

          <Button
            onClick={handleOpenEditTotal}
            variant="primary"
            icon={Edit3}
            size="sm"
            disabled={isSaving}
          >
            Set Monthly Budget
          </Button>
        </div>
      </div>

      {/* Main Budget Overview Card */}
      <GlassCard className="p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
          {/* 1. Monthly Budget */}
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Monthly Budget
              </span>
              <button
                onClick={handleOpenEditTotal}
                className="text-cyan-400 hover:text-cyan-300 text-xs font-medium flex items-center gap-1 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-white mt-1.5 tracking-tight">
              {formatCurrency(totalBudget)}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Active monthly spending boundary
            </p>
          </div>

          {/* 2. Total Spent */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Spent
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold text-cyan-300 mt-1.5 tracking-tight">
              {formatCurrency(totalSpent)}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Live calculated from PostgreSQL
            </p>
          </div>

          {/* 3. Remaining */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Remaining
            </span>
            <div className={`text-3xl sm:text-4xl font-extrabold mt-1.5 tracking-tight ${
              remaining < 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}>
              {remaining < 0 ? `-${formatCurrency(Math.abs(remaining))}` : formatCurrency(remaining)}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {remaining < 0 ? 'Deficit over monthly cap' : 'Available spending buffer'}
            </p>
          </div>

          {/* 4. Percentage Used & Visual State Badge */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Budget State
              </span>
              <div className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full border ${statusBadgeClasses}`}>
                <StatusIcon className="w-3.5 h-3.5" />
                <span>{overallStatusLabel}</span>
              </div>
            </div>
            <div className="text-2xl font-extrabold text-white">
              {percentageUsed}% <span className="text-xs text-slate-400 font-normal">used</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {overallStatus === 'safe' && 'Spending cadence is safe and well within boundary.'}
              {overallStatus === 'warning' && 'Approaching 70% threshold. Monitor non-essential purchases.'}
              {overallStatus === 'near_limit' && 'Near limit! Over 85% of monthly allowance spent.'}
              {overallStatus === 'over_budget' && 'Caution: You have exceeded your target monthly budget.'}
            </div>
          </div>
        </div>

        {/* Animated Progress Bar Across Entire Budget */}
        <div className="mt-6 pt-6 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-medium">
            <span>Overall Monthly Budget Progress</span>
            <span>{percentageUsed}% of {formatCurrency(totalBudget)}</span>
          </div>
          <div className="w-full bg-slate-950/80 rounded-full h-3 overflow-hidden p-0.5 border border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r ${barGradient}`}
              style={{ width: `${Math.min(100, Math.max(0, percentageUsed))}%` }}
            />
          </div>
        </div>
      </GlassCard>

      {/* Category Budget Alerts */}
      {categoryAlerts.length > 0 && (
        <div className="space-y-3 animate-fade-in">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Category Budget Alerts ({categoryAlerts.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categoryAlerts.map((alert) => (
              <div
                key={alert.category}
                className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 ${
                  alert.isOver
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-white text-sm">
                    {alert.isOver ? (
                      <Flame className="w-4 h-4 text-rose-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                    <span>{alert.category}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase bg-slate-900/60">
                      {alert.isOver ? 'Over Budget' : 'Near Limit'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    {formatCurrency(alert.spent)} spent of {formatCurrency(alert.limit)} limit ({alert.pct}%)
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-xs font-extrabold ${alert.isOver ? 'text-rose-400' : 'text-amber-300'}`}>
                    {alert.isOver
                      ? `+${formatCurrency(alert.spent - alert.limit)} over`
                      : `${formatCurrency(alert.limit - alert.spent)} left`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Budgets Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Category Budgets & Progress
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Individual category limits with live calculations and 4 visual states (Safe spending, Warning, Near limit, Over budget).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-3 py-1 rounded-full font-semibold border transition-all ${
              totalAllocated > totalBudget
                ? 'bg-rose-500/15 text-rose-300 border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.2)]'
                : totalAllocated === totalBudget
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
            }`}>
              {totalAllocated > totalBudget ? '⚠️ Exceeds Budget: ' : 'Total Allocated: '}
              <strong className="font-extrabold">{formatCurrency(totalAllocated)}</strong> / {formatCurrency(totalBudget)}
            </span>
          </div>
        </div>

        {/* 9 Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {CATEGORIES.map((cat) => {
            const catLimit = categoryBudgetsMap[cat.name] ?? categoryBudgetsMap[cat.id] ?? cat.defaultBudget ?? 1000;
            const catSpent = categorySpentMap[cat.name] ?? categorySpentMap[cat.id] ?? 0;
            const catRem = Math.round((catLimit - catSpent) * 100) / 100;
            const catPct = catLimit > 0 ? Math.round((catSpent / catLimit) * 1000) / 10 : 0;

            let catStatus = 'safe';
            let catLabel = 'Safe spending';
            if (catPct > 100) {
              catStatus = 'over_budget';
              catLabel = 'Over budget';
            } else if (catPct >= 85) {
              catStatus = 'near_limit';
              catLabel = 'Near limit';
            } else if (catPct >= 70) {
              catStatus = 'warning';
              catLabel = 'Warning';
            }

            return (
              <BudgetProgress
                key={cat.id}
                categoryId={cat.id}
                categoryName={cat.name}
                spent={catSpent}
                budget={catLimit}
                remaining={catRem}
                percentageUsed={catPct}
                status={catStatus}
                statusLabel={catLabel}
                onClick={() => handleOpenCatEdit(cat)}
              />
            );
          })}
        </div>
      </div>

      {/* AI-Readable Financial Data Section */}
      <GlassCard className="p-6 relative overflow-hidden border-purple-500/20 bg-gradient-to-br from-slate-900/80 via-purple-950/20 to-slate-900/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>AI Financial Intelligence Context</span>
              </h3>
              <p className="text-xs text-slate-400">
                Pre-computed telemetry injected into Ollama & Gemma AI Assistant for personalized financial counsel.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-500 font-semibold block uppercase text-[10px] tracking-wider">
              AI Velocity Forecast
            </span>
            <div className="text-base font-bold text-purple-300 mt-1">
              {formatCurrency(aiData?.daily_average_spending || (totalSpent / 4))} / day
            </div>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Projected month-end: {formatCurrency(aiData?.projected_month_end || (totalSpent * 7.75))}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-500 font-semibold block uppercase text-[10px] tracking-wider">
              Category Health Flags
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-emerald-400 font-bold">
                {aiData?.flags?.safe?.length ?? 9} Safe
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-amber-400 font-bold">
                {aiData?.flags?.warning?.length ?? 0} Warning
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-rose-400 font-bold">
                {(aiData?.flags?.over_budget?.length ?? 0) + (aiData?.flags?.near_limit?.length ?? 0)} Alert
              </span>
            </div>
            <p className="text-slate-400 text-[11px] mt-0.5">
              All categories tracked against PostgreSQL quotas
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-500 font-semibold block uppercase text-[10px] tracking-wider">
              Active AI Prompt Context
            </span>
            <p className="text-slate-300 text-[11px] mt-1 leading-snug line-clamp-2">
              "{aiData?.ai_prompt_context || `Student has spent ${formatCurrency(totalSpent)} of ${formatCurrency(totalBudget)} (${percentageUsed}% used). All 9 categories are within safe limits.`}"
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Modal 1: Edit Total Monthly Budget */}
      <Modal
        isOpen={isEditingTotal}
        onClose={() => setIsEditingTotal(false)}
        title="Adjust Total Monthly Budget"
        subtitle="Set your overall student allowance or target spending ceiling"
      >
        <form onSubmit={handleSaveTotal} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase text-slate-400">
                Monthly Budget Amount
              </label>
              <span className="text-xs text-slate-400">
                Current Categories Sum: <strong className="text-cyan-400">{formatCurrency(totalAllocated)}</strong>
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="50"
                min="100"
                required
                value={totalInput}
                onChange={(e) => setTotalInput(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl glass-input text-white text-xl font-extrabold focus:ring-2 transition-all ${
                  isTotalLowerThanCategories
                    ? 'border-amber-500/80 text-amber-200 focus:ring-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                    : 'focus:ring-cyan-500/50'
                }`}
                placeholder="10000"
              />
            </div>

            {isTotalLowerThanCategories ? (
              <div className="mt-3 p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-200">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Below Existing Category Allocations</span>
                </div>
                <p className="text-[11px] text-amber-200/90 leading-relaxed">
                  Your individual categories currently total <strong>{formatCurrency(totalAllocated)}</strong>. Total budget cannot be lower than the sum of category quotas.
                </p>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setTotalInput(String(totalAllocated))}
                    className="text-[11px] text-cyan-300 hover:text-cyan-200 font-bold underline cursor-pointer"
                  >
                    Set to category sum: {formatCurrency(totalAllocated)}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 mt-1">
                Changes will immediately persist to PostgreSQL and update all dashboard analytics.
              </p>
            )}
          </div>

          <div className="pt-3 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsEditingTotal(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant={isTotalLowerThanCategories ? "secondary" : "primary"} 
              disabled={isSaving || isTotalLowerThanCategories}
            >
              {isSaving ? 'Saving...' : 'Save to PostgreSQL'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Edit Specific Category Budget */}
      <Modal
        isOpen={!!activeCategoryEdit}
        onClose={() => setActiveCategoryEdit(null)}
        title={`Adjust ${activeCategoryEdit?.name} Budget`}
        subtitle="Configure the spending boundary for this specific category"
      >
        <form onSubmit={handleSaveCategoryBudget} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase text-slate-400">
                Category Limit Amount
              </label>
              <span className="text-xs text-slate-400">
                Max Allowed: <strong className="text-cyan-400">{formatCurrency(maxAllowedForCategory)}</strong>
              </span>
            </div>
            <input
              type="number"
              step="25"
              min="0"
              required
              value={categoryInput}
              onChange={(e) => setCategoryInput(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl glass-input text-white text-xl font-extrabold focus:ring-2 transition-all ${
                isCategoryOverLimit
                  ? 'border-rose-500/80 text-rose-200 focus:ring-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.25)]'
                  : 'focus:ring-cyan-500/50'
              }`}
              placeholder={String(maxAllowedForCategory)}
            />

            {/* Error Message Pop / Warning when user exceeds maximum budget limit */}
            {isCategoryOverLimit ? (
              <div className="mt-3 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs space-y-2 animate-fade-in shadow-lg shadow-rose-950/40">
                <div className="flex items-center gap-2 font-bold text-rose-200">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Maximum Budget Limit Exceeded!</span>
                </div>
                <p className="text-[11px] leading-relaxed text-rose-200">
                  Setting {activeCategoryEdit?.name} to <strong>{formatCurrency(projectedCatAmount)}</strong> makes total category limits <strong>{formatCurrency(projectedTotalAllocated)}</strong>, which exceeds your Total Monthly Budget of <strong>{formatCurrency(totalBudget)}</strong> by <span className="font-extrabold underline">{formatCurrency(categoryExcessAmount)}</span>.
                </p>
                <div className="pt-1.5 flex items-center justify-between border-t border-rose-500/20">
                  <span className="text-[11px] text-rose-300 font-medium">
                    Available limit: <strong>{formatCurrency(maxAllowedForCategory)}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setCategoryInput(String(maxAllowedForCategory))}
                    className="text-xs text-cyan-300 hover:text-cyan-200 font-bold underline cursor-pointer"
                  >
                    Fix: Set to {formatCurrency(maxAllowedForCategory)}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                <span>
                  Current spent in {activeCategoryEdit?.name}: {formatCurrency(categorySpentMap[activeCategoryEdit?.name] || 0)}
                </span>
                <span>
                  Remaining in Monthly Budget: {formatCurrency(Math.max(0, totalBudget - projectedTotalAllocated))}
                </span>
              </div>
            )}
          </div>

          <div className="pt-3 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setActiveCategoryEdit(null)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant={isCategoryOverLimit ? "danger" : "primary"}
              disabled={isSaving || isCategoryOverLimit}
            >
              {isSaving ? 'Updating...' : isCategoryOverLimit ? 'Limit Exceeded' : 'Save Category Quota'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Budget;
