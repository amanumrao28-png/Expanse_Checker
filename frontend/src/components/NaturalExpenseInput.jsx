import React, { useState } from 'react';
import { aiService } from '../services/aiService';
import { useExpenses } from '../context/ExpenseContext';
import { CATEGORIES, PAYMENT_METHODS } from '../utils/categories';
import CategoryIcon from './CategoryIcon';
import Button from './Button';
import { formatCurrency, getCurrencySymbol } from '../utils/formatters';
import {
  Sparkles,
  Bot,
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Calendar,
  CreditCard,
  Tag,
  ArrowRight,
  HelpCircle,
  Check
} from 'lucide-react';

const SUGGESTIONS = [
  '₹120 on lunch',
  'Spent ₹500 on books',
  'Paid ₹80 for metro',
  'Bought a new keyboard for 1200 using UPI',
  'Yesterday I paid 60 for metro'
];

const NaturalExpenseInput = ({ onExpenseAdded, onCancel }) => {
  const { addExpense, showToast } = useExpenses();

  const [inputText, setInputText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [extractedExpense, setExtractedExpense] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Editable fields in the confirmation preview
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('Food');
  const [editDescription, setEditDescription] = useState('');
  const [editDate, setEditDate] = useState(new Date().toISOString().split('T')[0]);
  const [editPaymentMethod, setEditPaymentMethod] = useState('Card');
  const [clarificationNeeded, setClarificationNeeded] = useState(false);

  // Trigger Natural Language Extraction via FastAPI & Ollama Gemma
  const handleParse = async (textToParse) => {
    const query = (textToParse || inputText).trim();
    if (!query) return;

    setIsParsing(true);
    setExtractedExpense(null);
    setClarificationNeeded(false);

    try {
      const res = await aiService.parseNaturalExpense(query);

      // Match category
      const matched = CATEGORIES.find(
        (c) =>
          c.id.toLowerCase() === (res.category || '').toLowerCase() ||
          c.name.toLowerCase() === (res.category || '').toLowerCase()
      );
      const categoryName = matched ? matched.name : (res.category || 'Other');

      const amountVal = res.amount !== null && res.amount !== undefined ? String(res.amount) : '';
      const isMissingAmount = res.needs_clarification || !res.amount || res.amount <= 0;

      setEditAmount(amountVal);
      setEditCategory(categoryName);
      setEditDescription(res.description || query);
      setEditDate(res.date || new Date().toISOString().split('T')[0]);
      setEditPaymentMethod(res.payment_method || 'UPI');
      setClarificationNeeded(isMissingAmount);

      setExtractedExpense(res);

      if (isMissingAmount) {
        showToast('Please clarify or enter the expense amount.', 'warning');
      } else {
        showToast('Expense details extracted with Gemma AI!', 'success');
      }
    } catch (err) {
      console.error('Failed to parse natural expense:', err);
      showToast('Could not parse expense automatically. Please enter details manually.', 'error');
    } finally {
      setIsParsing(false);
    }
  };

  const handleApplySuggestion = (text) => {
    setInputText(text);
    handleParse(text);
  };

  // User explicitly clicks "Confirm Expense" to save to PostgreSQL
  const handleConfirmSave = async () => {
    const numAmount = parseFloat(editAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setClarificationNeeded(true);
      showToast('Please enter a valid positive amount before confirming.', 'error');
      return;
    }

    if (!editDescription || !editDescription.trim()) {
      showToast('Please enter an expense description.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      await addExpense({
        description: editDescription.trim(),
        title: editDescription.trim(),
        amount: numAmount,
        category: editCategory,
        date: editDate,
        payment_method: editPaymentMethod,
        notes: `AI natural input: "${extractedExpense?.raw_text || inputText}"`
      });

      // Clear input and state
      setInputText('');
      setExtractedExpense(null);
      if (onExpenseAdded) {
        onExpenseAdded();
      }
    } catch (err) {
      console.error('Failed to save confirmed expense:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setExtractedExpense(null);
    setClarificationNeeded(false);
    setInputText('');
  };

  return (
    <div className="relative group">
      {/* Outer Glow Animated Border */}
      <div className="absolute -inset-[1.5px] rounded-3xl bg-gradient-to-r from-purple-500/50 via-cyan-400/50 to-blue-500/50 blur-sm opacity-75 group-hover:opacity-100 transition-all duration-700 animate-pulse pointer-events-none" />

      {/* Main Glassmorphic Container */}
      <div className="relative rounded-3xl bg-slate-900/90 backdrop-blur-2xl border border-slate-700/60 p-5 sm:p-7 shadow-2xl">
        {/* Header with Animated AI Icon */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center p-2.5 rounded-2xl bg-gradient-to-tr from-purple-600/30 to-cyan-500/30 border border-purple-500/40 text-cyan-300 shadow-md shadow-purple-500/20">
              <Sparkles className="w-5 h-5 animate-spin-slow text-cyan-300" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                  Natural Language AI Expense Input
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Gemma AI
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Type naturally in everyday English. Gemma will structure the amount, category, date, and payment method.
              </p>
            </div>
          </div>
        </div>

        {/* Input Field Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleParse();
          }}
          className="space-y-4"
        >
          <div className="relative">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="e.g. I spent 180 rupees on lunch today or Bought keyboard for 1200 using UPI..."
              disabled={isParsing}
              className="w-full pl-4 pr-28 py-3.5 rounded-2xl bg-slate-950/70 border border-slate-700/80 text-white placeholder-slate-500 text-sm font-medium focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all"
            />

            <div className="absolute right-2 top-2 bottom-2 flex items-center">
              <button
                type="submit"
                disabled={isParsing || !inputText.trim()}
                className="h-full px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-purple-500/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {isParsing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Extract</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Example Suggestions */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              <Bot className="w-3 h-3 text-cyan-400" />
              <span>Try asking:</span>
            </span>
            {SUGGESTIONS.map((sug, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplySuggestion(sug)}
                className="text-[11px] px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-750 border border-slate-700 hover:border-cyan-500/40 text-slate-300 hover:text-white transition-all cursor-pointer font-medium"
              >
                "{sug}"
              </button>
            ))}
          </div>
        </form>

        {/* Typing / Loading Animation State */}
        {isParsing && (
          <div className="mt-5 p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 flex items-center gap-3 animate-pulse">
            <Loader2 className="w-5 h-5 text-cyan-400 animate-spin shrink-0" />
            <div>
              <p className="text-xs font-bold text-white">
                Gemma AI is analyzing your natural statement...
              </p>
              <p className="text-[11px] text-slate-400">
                Extracting amount, category, date, and payment method into strict JSON.
              </p>
            </div>
          </div>
        )}

        {/* Extracted Information Confirmation Card (Displayed before saving) */}
        {extractedExpense && !isParsing && (
          <div className="mt-6 pt-5 border-t border-slate-800 animate-slide-up space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Extracted Expense Review
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {extractedExpense.source === 'ollama-gemma' ? 'Ollama Gemma Model' : 'Heuristic Assistant'}
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                ⚠️ Review details below before confirming to save.
              </span>
            </div>

            {/* Clarification Alert if Amount is Missing */}
            {clarificationNeeded && (
              <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-start gap-2.5 text-xs text-amber-200 animate-pulse">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Clarification Needed:</span>
                  <span>{extractedExpense.clarification_prompt || 'Could not detect the expense amount. Please enter the amount below to continue.'}</span>
                </div>
              </div>
            )}

            {/* Extracted Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {/* 1. Amount */}
              <div className={`p-3 rounded-xl bg-slate-950/60 border ${
                clarificationNeeded ? 'border-amber-500/80 ring-2 ring-amber-500/20' : 'border-slate-800'
              }`}>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Amount ({getCurrencySymbol()}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={editAmount}
                  onChange={(e) => {
                    setEditAmount(e.target.value);
                    if (clarificationNeeded && parseFloat(e.target.value) > 0) {
                      setClarificationNeeded(false);
                    }
                  }}
                  placeholder="Enter amount"
                  className="w-full bg-transparent text-white font-extrabold text-base focus:outline-none"
                />
              </div>

              {/* 2. Category */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Category
                </label>
                <div className="flex items-center gap-2">
                  <CategoryIcon categoryId={editCategory} size="sm" />
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.name} className="bg-slate-900 text-white">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 3. Description */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Expense description"
                  className="w-full bg-transparent text-white text-xs font-semibold focus:outline-none"
                />
              </div>

              {/* 4. Date & Payment Method */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Date & Payment
                </label>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="bg-transparent text-white text-[11px] focus:outline-none w-full"
                  />
                  <select
                    value={editPaymentMethod || 'UPI'}
                    onChange={(e) => setEditPaymentMethod(e.target.value)}
                    className="bg-transparent text-slate-300 text-[11px] font-semibold focus:outline-none cursor-pointer"
                  >
                    {PAYMENT_METHODS.map((pm) => (
                      <option key={pm} value={pm} className="bg-slate-900 text-white">
                        {pm}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Action Buttons: Confirm Expense & Discard */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Discard & Try Another</span>
              </button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="primary"
                  icon={Check}
                  loading={isSaving}
                  disabled={clarificationNeeded || !editAmount}
                  onClick={handleConfirmSave}
                  className="w-full sm:w-auto shadow-lg shadow-cyan-500/20"
                >
                  Confirm Expense
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NaturalExpenseInput;
