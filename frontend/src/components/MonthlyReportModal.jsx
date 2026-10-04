import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';
import { expenseService } from '../services/expenseService';
import { formatCurrency } from '../utils/formatters';
import {
  FileText,
  Printer,
  Sparkles,
  TrendingDown,
  TrendingUp,
  DollarSign,
  PieChart,
  Calendar,
  CreditCard,
  Repeat,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

const MonthlyReportModal = ({ isOpen, onClose }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReport = async (month) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await expenseService.getMonthlyReport(month);
      setReport(data);
    } catch (err) {
      console.error('Failed to load report:', err);
      setError('Failed to generate report from PostgreSQL database');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchReport(selectedMonth);
    }
  }, [isOpen, selectedMonth]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Monthly Financial Report"
      subtitle="Comprehensive fiscal assessment generated from PostgreSQL records"
      maxWidth="max-w-3xl"
    >
      <div className="space-y-6">
        {/* Month Selector & Print Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <label className="text-xs font-semibold text-slate-300">Reporting Period:</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 rounded-lg glass-input text-xs text-white bg-slate-800 border-slate-700"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="xs"
              variant="secondary"
              icon={Printer}
              onClick={handlePrint}
            >
              Print / Save PDF
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="py-16 text-center">
            <LoadingSpinner size="lg" text="Computing monthly financial report..." />
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Report Content */}
        {report && !isLoading && (
          <div className="space-y-6 print:text-black">
            {/* Executive AI Assessment Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900/90 to-cyan-950/40 border border-purple-500/30 relative overflow-hidden">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                      Executive AI Assessment &bull; {report.month_name}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-white leading-relaxed">
                    {report.ai_verdict}
                  </p>
                </div>
              </div>
            </div>

            {/* Key KPI Metric Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <p className="text-[10px] uppercase font-semibold text-slate-400">Total Spent</p>
                <p className="text-lg font-bold text-white mt-0.5">{formatCurrency(report.total_spent)}</p>
                <span className="text-[10px] text-slate-400">{report.total_transactions} transactions</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <p className="text-[10px] uppercase font-semibold text-slate-400">Monthly Budget</p>
                <p className="text-lg font-bold text-white mt-0.5">{formatCurrency(report.total_budget)}</p>
                <span className="text-[10px] text-purple-400">{report.budget_used_percentage}% utilized</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <p className="text-[10px] uppercase font-semibold text-slate-400">Remaining Buffer</p>
                <p className="text-lg font-bold text-emerald-400 mt-0.5">{formatCurrency(report.remaining_budget)}</p>
                <span className="text-[10px] text-emerald-400">{report.savings_rate_percentage}% unspent</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <p className="text-[10px] uppercase font-semibold text-slate-400">Daily Average</p>
                <p className="text-lg font-bold text-cyan-400 mt-0.5">{formatCurrency(report.daily_average)}</p>
                <span className="text-[10px] text-slate-400">per day this month</span>
              </div>
            </div>

            {/* Category Breakdown Table */}
            <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900/60">
              <div className="p-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <PieChart className="w-3.5 h-3.5 text-cyan-400" />
                  Category Breakdown
                </h4>
                <span className="text-[11px] text-slate-400">Ranked by spending</span>
              </div>

              <div className="divide-y divide-slate-800/60">
                {report.category_breakdown.map((cat, idx) => (
                  <div key={idx} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-800/30 transition-colors">
                    <div className="min-w-[140px]">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{cat.category}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                          cat.status === 'Over Budget'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : cat.status === 'Near Limit'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/10 text-emerald-400'
                        }`}>
                          {cat.status}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">{cat.percent_of_total}% of monthly spend</span>
                    </div>

                    <div className="flex-1 max-w-xs mx-0 sm:mx-4">
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full ${
                            cat.percent_of_budget > 100
                              ? 'bg-rose-500'
                              : cat.percent_of_budget >= 80
                              ? 'bg-amber-500'
                              : 'bg-cyan-500'
                          }`}
                          style={{ width: `${Math.min(100, cat.percent_of_budget)}%` }}
                        />
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-bold text-white">{formatCurrency(cat.spent)}</p>
                      <p className="text-[11px] text-slate-400">
                        Budget: {formatCurrency(cat.budget)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Highlights: Payment Method & Recurring & Largest Expense */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Payment Methods */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                  Payment Channels
                </h5>
                <div className="space-y-1.5 text-xs">
                  {report.payment_methods.map((pm, i) => (
                    <div key={i} className="flex justify-between py-1 border-b border-slate-800/40 text-slate-300">
                      <span>{pm.method} ({pm.count})</span>
                      <span className="font-semibold text-white">{formatCurrency(pm.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recurring & Highest Single */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div>
                  <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Repeat className="w-3.5 h-3.5 text-purple-400" />
                    Recurring Commitments
                  </h5>
                  <p className="text-sm font-bold text-white">
                    {formatCurrency(report.recurring_total)}{' '}
                    <span className="text-xs font-normal text-slate-400">per month</span>
                  </p>
                </div>

                {report.highest_expense && (
                  <div className="pt-2 border-t border-slate-800">
                    <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-1">
                      Largest Single Transaction
                    </h5>
                    <p className="text-xs text-white font-medium">
                      {report.highest_expense.description} &bull;{' '}
                      <span className="text-amber-400 font-bold">
                        {formatCurrency(report.highest_expense.amount)}
                      </span>
                    </p>
                    <span className="text-[10px] text-slate-400">
                      {report.highest_expense.category} on {report.highest_expense.date}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default MonthlyReportModal;
