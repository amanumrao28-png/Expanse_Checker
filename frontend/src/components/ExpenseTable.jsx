import React from 'react';
import CategoryIcon from './CategoryIcon';
import { formatCurrency, formatDate } from '../utils/formatters';
import { getCategoryById } from '../utils/categories';
import { Trash2, Edit2, Calendar, CreditCard } from 'lucide-react';

const ExpenseTable = ({
  expenses = [],
  onEdit,
  onDelete
}) => {
  return (
    <div className="w-full overflow-x-auto rounded-2xl glass-panel border border-slate-800">
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-800/80 bg-slate-900/60 text-slate-400 font-semibold uppercase text-xs tracking-wider">
            <th className="py-4 px-5">Description</th>
            <th className="py-4 px-5">Category</th>
            <th className="py-4 px-5">Date</th>
            <th className="py-4 px-5">Payment Method</th>
            <th className="py-4 px-5 text-right">Amount</th>
            <th className="py-4 px-5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/50">
          {expenses.map((expense) => {
            const category = getCategoryById(expense.category);
            const title = expense.description || expense.title || 'Untitled Expense';
            const paymentMethod = expense.payment_method || expense.paymentMethod || 'Card';

            return (
              <tr
                key={expense.id}
                className="hover:bg-slate-800/40 transition-colors duration-150 group"
              >
                {/* Expense Description & Note */}
                <td className="py-4 px-5">
                  <div className="flex items-center gap-3">
                    <CategoryIcon categoryId={expense.category} size="sm" className="w-4 h-4" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors">
                          {title}
                        </span>
                        {expense.is_recurring && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center gap-1 font-semibold">
                            Recurring
                          </span>
                        )}
                      </div>
                      {expense.notes && (
                        <div className="text-xs text-slate-400/80 truncate max-w-xs mt-0.5">
                          {expense.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </td>

                {/* Category Badge */}
                <td className="py-4 px-5 whitespace-nowrap">
                  <span
                    className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border"
                    style={{
                      backgroundColor: category.badgeBg,
                      borderColor: category.borderColor,
                      color: category.color
                    }}
                  >
                    {category.name}
                  </span>
                </td>

                {/* Date */}
                <td className="py-4 px-5 whitespace-nowrap text-slate-300 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    {formatDate(expense.date)}
                  </div>
                </td>

                {/* Payment Method */}
                <td className="py-4 px-5 whitespace-nowrap text-slate-300 text-xs">
                  <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800/60 border border-slate-700/60">
                    <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{paymentMethod}</span>
                  </div>
                </td>

                {/* Amount */}
                <td className="py-4 px-5 whitespace-nowrap text-right font-bold text-white text-sm">
                  -{formatCurrency(expense.amount)}
                </td>

                {/* Actions */}
                <td className="py-4 px-5 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {onEdit && (
                      <button
                        type="button"
                        onClick={() => onEdit(expense)}
                        aria-label={`Edit ${title}`}
                        className="p-2 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-400"
                        title="Edit expense"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete(expense.id)}
                        aria-label={`Delete ${title}`}
                        className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-400"
                        title="Delete expense"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ExpenseTable;
