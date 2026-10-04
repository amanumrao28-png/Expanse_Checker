import React from 'react';
import GlassCard from './GlassCard';
import CategoryIcon from './CategoryIcon';
import { formatCurrency, formatRelativeDate } from '../utils/formatters';
import { getCategoryById } from '../utils/categories';
import { Trash2, Edit2, Calendar, CreditCard } from 'lucide-react';

const ExpenseCard = ({
  expense,
  onEdit,
  onDelete
}) => {
  const category = getCategoryById(expense.category);
  const title = expense.description || expense.title || 'Untitled Expense';
  const paymentMethod = expense.payment_method || expense.paymentMethod || 'Card';

  return (
    <GlassCard
      interactive
      className="p-4 sm:p-5 group animate-fade-in border border-slate-800/80 hover:border-cyan-500/30 transition-all duration-300"
    >
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        {/* Left: Category Icon + Title + Meta */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <CategoryIcon categoryId={expense.category} size="md" className="w-5 h-5" />
          <div className="min-w-0">
            <h4 className="text-sm sm:text-base font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors truncate">
              {title}
            </h4>
            <div className="flex items-center flex-wrap gap-2 text-xs text-slate-400 mt-1">
              <span
                className="px-2 py-0.5 rounded-md font-medium border text-[11px]"
                style={{
                  backgroundColor: category.badgeBg,
                  borderColor: category.borderColor,
                  color: category.color
                }}
              >
                {category.name}
              </span>
              <span className="flex items-center gap-1 text-slate-400 text-[11px]">
                <Calendar className="w-3 h-3 text-slate-500" />
                {formatRelativeDate(expense.date)}
              </span>
              {paymentMethod && (
                <span className="inline-flex items-center gap-1 text-slate-400 text-[11px] bg-slate-800/60 px-1.5 py-0.5 rounded border border-slate-700/60">
                  <CreditCard className="w-3 h-3 text-slate-400" />
                  {paymentMethod}
                </span>
              )}
              {expense.is_recurring && (
                <span className="inline-flex items-center gap-1 text-purple-300 text-[11px] bg-purple-500/15 px-1.5 py-0.5 rounded border border-purple-500/30 font-medium">
                  Recurring ({expense.recurring_frequency || 'monthly'})
                </span>
              )}
            </div>
            {expense.notes && (
              <p className="text-xs text-slate-400/80 mt-1.5 italic line-clamp-1">
                "{expense.notes}"
              </p>
            )}
          </div>
        </div>

        {/* Right: Amount + Actions */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <div className="text-right">
            <span className="text-base sm:text-lg font-bold text-white tracking-tight">
              -{formatCurrency(expense.amount)}
            </span>
          </div>

          {(onEdit || onDelete) && (
            <div className="flex items-center gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
              {onEdit && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onEdit(expense); }}
                  aria-label={`Edit ${title}`}
                  className="p-2 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-400"
                  title="Edit expense"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onDelete(expense.id); }}
                  aria-label={`Delete ${title}`}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-400"
                  title="Delete expense"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  );
};

export default ExpenseCard;
