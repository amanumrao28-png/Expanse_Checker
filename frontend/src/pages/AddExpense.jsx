import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/GlassCard';
import Button from '../components/Button';
import CategoryIcon from '../components/CategoryIcon';
import NaturalExpenseInput from '../components/NaturalExpenseInput';
import ReceiptScannerModal from '../components/ReceiptScannerModal';
import { CATEGORIES, PAYMENT_METHODS } from '../utils/categories';
import { aiService } from '../services/aiService';
import { useExpenses } from '../context/ExpenseContext';
import { formatCurrency } from '../utils/formatters';
import {
  Plus,
  Sparkles,
  ArrowLeft,
  Calendar,
  CreditCard,
  FileText,
  AlertCircle,
  AlertTriangle,
  Check,
  Bot,
  Loader2,
  Info,
  Layers,
  Wand2,
  Repeat,
  Scan
} from 'lucide-react';

const AddExpense = ({ onComplete, isModal = false }) => {
  const navigate = useNavigate();
  const { addExpense, expenses, budgets, showToast, refreshData } = useExpenses();

  // Mode: 'ai' (Natural Language) or 'manual' (Detailed Form)
  const [activeTab, setActiveTab] = useState('ai');
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'Food',
    date: new Date().toISOString().split('T')[0],
    payment_method: 'Card',
    notes: '',
    is_recurring: false,
    recurring_frequency: 'monthly'
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPredictingCategory, setIsPredictingCategory] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiNotice, setAiNotice] = useState(null);

  // Real-time category budget tracking
  const categoryBudget = useMemo(() => {
    return budgets?.categories?.[formData.category] || 0;
  }, [budgets, formData.category]);

  const currentCategorySpent = useMemo(() => {
    const currentMonthStr = new Date().toISOString().slice(0, 7);
    return (expenses || [])
      .filter(
        (e) =>
          (e.category || '').toLowerCase() === (formData.category || '').toLowerCase() &&
          (e.date || '').startsWith(currentMonthStr)
      )
      .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  }, [expenses, formData.category]);

  const pendingAmount = parseFloat(formData.amount) || 0;
  const projectedTotal = currentCategorySpent + pendingAmount;
  const isOverBudget = categoryBudget > 0 && projectedTotal > categoryBudget;
  const isNearBudget = categoryBudget > 0 && !isOverBudget && projectedTotal >= categoryBudget * 0.8;

  // Trigger AI Categorization using Ollama + Gemma Model
  const handleTriggerAICategorize = async () => {
    if (!formData.description || formData.description.trim().length < 2) {
      setErrors((prev) => ({ ...prev, description: 'Enter a description first for AI to analyze' }));
      return;
    }

    setIsPredictingCategory(true);
    setAiNotice(null);

    try {
      const res = await aiService.categorizeExpense(formData.description, formData.amount);

      // Normalize category
      const matched = CATEGORIES.find(
        (c) =>
          c.id.toLowerCase() === (res.category || '').toLowerCase() ||
          c.name.toLowerCase() === (res.category || '').toLowerCase()
      );

      const resolvedCategory = matched ? matched.name : res.category || 'Other';

      setAiResult({
        category: resolvedCategory,
        cleanedTitle: res.description || formData.description,
        reason: res.reason,
        source: res.source,
        success: res.success,
        error: res.error
      });

      // Automatically preselect the AI category
      setFormData((prev) => ({
        ...prev,
        category: resolvedCategory
      }));

      if (res.error) {
        setAiNotice(`Local Ollama note: ${res.error}. Manual selection is enabled.`);
      } else {
        showToast(`AI categorized as ${resolvedCategory}!`, 'info');
      }
    } catch (err) {
      console.warn('AI Category prediction error:', err);
      setAiNotice('AI service offline. You can select your category manually below.');
    } finally {
      setIsPredictingCategory(false);
    }
  };

  const handleDescriptionBlur = () => {
    if (formData.description.trim().length > 3 && !aiResult) {
      handleTriggerAICategorize();
    }
  };

  const handleApplyCleanedTitle = () => {
    if (aiResult?.cleanedTitle) {
      setFormData((prev) => ({ ...prev, description: aiResult.cleanedTitle }));
    }
  };

  // Field validation
  const validate = () => {
    const newErrors = {};

    if (!formData.description || !formData.description.trim()) {
      newErrors.description = 'Description cannot be empty';
    }

    const numAmount = parseFloat(formData.amount);
    if (!formData.amount || isNaN(numAmount) || numAmount <= 0) {
      newErrors.amount = 'Amount must be positive';
    }

    if (!formData.date || isNaN(new Date(formData.date).getTime())) {
      newErrors.date = 'Date must be valid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await addExpense({
        description: formData.description.trim(),
        title: formData.description.trim(),
        amount: parseFloat(formData.amount),
        category: formData.category,
        date: formData.date,
        payment_method: formData.payment_method,
        notes: formData.notes ? formData.notes.trim() : null,
        is_recurring: formData.is_recurring,
        recurring_frequency: formData.is_recurring ? formData.recurring_frequency : null
      });

      // Reset form
      setFormData({
        description: '',
        amount: '',
        category: 'Food',
        date: new Date().toISOString().split('T')[0],
        payment_method: 'Card',
        notes: '',
        is_recurring: false,
        recurring_frequency: 'monthly'
      });
      setErrors({});
      setAiResult(null);
      setAiNotice(null);

      if (onComplete) {
        onComplete();
      } else {
        navigate('/expenses');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNaturalExpenseDone = () => {
    if (onComplete) {
      onComplete();
    } else {
      navigate('/expenses');
    }
  };

  const manualFormContent = (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* AI Intelligence Result Banner */}
      {aiResult && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/50 via-slate-900/60 to-cyan-950/40 border border-purple-500/30 text-white text-xs animate-slide-up shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">
                    Gemma AI Classified: <span className="text-cyan-400">{aiResult.category}</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {aiResult.source === 'ollama-gemma' ? 'Local Ollama' : 'Heuristic Assistant'}
                  </span>
                </div>
                <p className="text-slate-300 mt-1 leading-relaxed">
                  <strong>Reason:</strong> {aiResult.reason}
                </p>
                {aiResult.cleanedTitle && aiResult.cleanedTitle !== formData.description && (
                  <p className="text-slate-400 mt-1 flex items-center gap-1.5">
                    <span>
                      Suggested Title: <em>"{aiResult.cleanedTitle}"</em>
                    </span>
                    <button
                      type="button"
                      onClick={handleApplyCleanedTitle}
                      className="text-cyan-400 hover:text-cyan-300 underline font-semibold cursor-pointer"
                    >
                      Use Title
                    </button>
                  </p>
                )}
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold">
                <Check className="w-3.5 h-3.5" />
                <span>Selected</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Graceful Fallback Notice */}
      {aiNotice && !aiResult && (
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs animate-fade-in">
          <Info className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{aiNotice}</span>
        </div>
      )}

      {/* Description Field with AI Action Button */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Description *
          </label>
          <button
            type="button"
            onClick={handleTriggerAICategorize}
            disabled={isPredictingCategory || !formData.description.trim()}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-300 hover:text-purple-200 bg-purple-500/15 hover:bg-purple-500/25 px-2.5 py-1 rounded-lg border border-purple-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {isPredictingCategory ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin text-purple-400" />
                <span>Gemma Categorizing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>Auto-Categorize with AI</span>
              </>
            )}
          </button>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="e.g. Had pizza with friends, Semester textbook, Subway pass"
            value={formData.description}
            onChange={(e) => {
              setFormData({ ...formData, description: e.target.value });
              if (errors.description) setErrors({ ...errors, description: null });
            }}
            onBlur={handleDescriptionBlur}
            className={`w-full px-4 py-3 rounded-xl glass-input text-white placeholder-slate-500 text-sm transition-all ${
              errors.description ? 'border-rose-500/80 focus:border-rose-400' : 'focus:border-cyan-400'
            }`}
          />
          {isPredictingCategory && (
            <div className="absolute right-3 top-3 text-xs text-purple-400 flex items-center gap-1 animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Gemma analyzing...</span>
            </div>
          )}
        </div>
        {errors.description && (
          <p className="flex items-center gap-1 text-xs text-rose-400 mt-1.5 animate-slide-up">
            <AlertCircle className="w-3.5 h-3.5" />
            {errors.description}
          </p>
        )}
      </div>

      {/* Amount and Date Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Amount */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Amount (₹ / Currency) *
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="e.g. 250"
              value={formData.amount}
              onChange={(e) => {
                setFormData({ ...formData, amount: e.target.value });
                if (errors.amount) setErrors({ ...errors, amount: null });
              }}
              className={`w-full px-4 py-3 rounded-xl glass-input text-white font-semibold text-sm transition-all ${
                errors.amount ? 'border-rose-500/80 focus:border-rose-400' : 'focus:border-cyan-400'
              }`}
            />
          </div>
          {errors.amount && (
            <p className="flex items-center gap-1 text-xs text-rose-400 mt-1.5 animate-slide-up">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.amount}
            </p>
          )}
        </div>

        {/* Date */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Date *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Calendar className="w-4 h-4" />
            </div>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => {
                setFormData({ ...formData, date: e.target.value });
                if (errors.date) setErrors({ ...errors, date: null });
              }}
              className={`w-full pl-10 pr-4 py-3 rounded-xl glass-input text-white text-sm transition-all ${
                errors.date ? 'border-rose-500/80 focus:border-rose-400' : 'focus:border-cyan-400'
              }`}
            />
          </div>
          {errors.date && (
            <p className="flex items-center gap-1 text-xs text-rose-400 mt-1.5 animate-slide-up">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.date}
            </p>
          )}
        </div>
      </div>

      {/* Category Selection (Always manually selectable) */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Category *
          </label>
          <span className="text-[11px] text-slate-400">
            Select or click to override AI prediction
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {CATEGORIES.map((cat) => {
            const isSelected = formData.category.toLowerCase() === cat.name.toLowerCase();
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setFormData({ ...formData, category: cat.name })}
                className={`
                  flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer
                  ${
                    isSelected
                      ? 'bg-slate-800/90 border-cyan-400 shadow-md shadow-cyan-500/10 scale-[1.02]'
                      : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 text-slate-400'
                  }
                `}
              >
                <CategoryIcon categoryId={cat.id} size="sm" />
                <span className={`text-xs font-medium truncate ${isSelected ? 'text-white font-semibold' : 'text-slate-300'}`}>
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Real-time Category Budget Alert */}
        {categoryBudget > 0 && (
          <div
            className={`p-3.5 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-all animate-fade-in ${
              isOverBudget
                ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                : isNearBudget
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {isOverBudget ? (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              ) : isNearBudget ? (
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              ) : (
                <Info className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <span>
                {isOverBudget
                  ? `Over Budget Alert: This expense will exceed your ${formData.category} monthly budget of ${formatCurrency(categoryBudget)}!`
                  : isNearBudget
                  ? `Caution: Near limit! This will use ${Math.round((projectedTotal / categoryBudget) * 100)}% of your ${formData.category} limit.`
                  : `${formData.category} Budget: ${formatCurrency(currentCategorySpent)} spent of ${formatCurrency(categoryBudget)}`}
              </span>
            </div>
            <div className="font-bold text-xs shrink-0 self-end sm:self-auto">
              {isOverBudget ? (
                <span className="text-rose-400">Exceeds by +{formatCurrency(projectedTotal - categoryBudget)}</span>
              ) : (
                <span className="text-slate-300">{formatCurrency(categoryBudget - projectedTotal)} remaining</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Payment Method and Notes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Payment Method */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Payment Method
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <CreditCard className="w-4 h-4" />
            </div>
            <select
              value={formData.payment_method}
              onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              className="w-full pl-10 pr-4 py-3 rounded-xl glass-input text-white text-sm cursor-pointer"
            >
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method} className="bg-slate-900 text-white">
                  {method}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Optional Notes */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Optional Notes
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <FileText className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="e.g. Split with roommates, reimbursement"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full pl-10 pr-4 py-3 rounded-xl glass-input text-white text-sm"
            />
          </div>
        </div>
      </div>

      {/* Recurring Expense Settings */}
      <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
        <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-200">
          <input
            type="checkbox"
            checked={formData.is_recurring}
            onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
            className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
          />
          <Repeat className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-semibold">Mark as Recurring Subscription / Expense</span>
        </label>
        {formData.is_recurring && (
          <div className="flex items-center gap-3 pl-6 pt-1 text-xs text-slate-300">
            <span className="text-[10px] uppercase font-bold text-slate-400">Frequency:</span>
            <select
              value={formData.recurring_frequency}
              onChange={(e) => setFormData({ ...formData, recurring_frequency: e.target.value })}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:border-cyan-400"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
            <span className="text-[11px] text-slate-400">
              (e.g. rent, gym, Netflix, Wi-Fi)
            </span>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="pt-2 flex items-center justify-end gap-3">
        {!isModal && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/expenses')}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          icon={Plus}
          loading={isSubmitting}
          className="w-full sm:w-auto"
        >
          Add Expense to PostgreSQL
        </Button>
      </div>
    </form>
  );

  const mainContent = (
    <div className="space-y-6">
      {/* Mode Switcher Tabs */}
      <div className="flex items-center justify-center sm:justify-start">
        <div className="inline-flex items-center p-1 rounded-2xl bg-slate-950/80 border border-slate-800 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'ai'
                ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-md shadow-purple-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>AI Natural Language</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'manual'
                ? 'bg-slate-800 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Standard Form</span>
          </button>

          <button
            type="button"
            onClick={() => setIsScanModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-indigo-300 hover:text-white hover:bg-indigo-500/10 transition-all cursor-pointer"
          >
            <Scan className="w-3.5 h-3.5 text-indigo-400" />
            <span>Scan Receipt</span>
          </button>
        </div>
      </div>

      {/* Render Active Mode */}
      {activeTab === 'ai' ? (
        <div className="animate-fade-in">
          <NaturalExpenseInput
            onExpenseAdded={handleNaturalExpenseDone}
            onCancel={() => (onComplete ? onComplete() : navigate('/expenses'))}
          />
        </div>
      ) : (
        <div className="animate-fade-in">
          {manualFormContent}
        </div>
      )}

      {/* Receipt Scanner Modal */}
      <ReceiptScannerModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onExpenseAdded={() => {
          refreshData();
          setIsScanModalOpen(false);
          if (onComplete) onComplete();
          else navigate('/expenses');
        }}
      />
    </div>
  );

  if (isModal) {
    return mainContent;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <span>Add Expense</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
              Gemma AI Assisted
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Record expenses naturally in plain English or use the comprehensive manual form with PostgreSQL persistence.
          </p>
        </div>
      </div>

      {/* Container */}
      <GlassCard className="p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        {mainContent}
      </GlassCard>
    </div>
  );
};

export default AddExpense;
