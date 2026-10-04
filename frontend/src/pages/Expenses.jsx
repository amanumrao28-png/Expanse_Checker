import React, { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import GlassCard from '../components/GlassCard';
import ExpenseCard from '../components/ExpenseCard';
import ExpenseTable from '../components/ExpenseTable';
import EmptyState from '../components/EmptyState';
import Button from '../components/Button';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import CsvImportModal from '../components/CsvImportModal';
import ReceiptScannerModal from '../components/ReceiptScannerModal';
import CategoryIcon from '../components/CategoryIcon';
import { useExpenses } from '../context/ExpenseContext';
import { expenseService } from '../services/expenseService';
import { CATEGORIES, PAYMENT_METHODS } from '../utils/categories';
import { formatCurrency, getCurrencySymbol } from '../utils/formatters';
import {
  Search,
  Plus,
  LayoutGrid,
  List,
  ArrowUpDown,
  Download,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
  Trash2,
  AlertTriangle,
  RotateCcw,
  Upload,
  Scan,
  SlidersHorizontal,
  Sparkles,
  Repeat
} from 'lucide-react';

const Expenses = ({ onOpenAddExpense }) => {
  const { expenses, deleteExpense, editExpense, refreshData, showToast, currencyVersion } = useExpenses();
  const location = useLocation();

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [recurringFilter, setRecurringFilter] = useState('all'); // 'all', 'recurring', 'one_time'
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sortBy, setSortBy] = useState('date-desc');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

  // Modal states for advanced features
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Edit Modal State
  const [editingExpense, setEditingExpense] = useState(null);
  const [editFormData, setEditFormData] = useState({
    description: '',
    amount: '',
    category: 'Food',
    date: '',
    payment_method: 'Card',
    notes: '',
    is_recurring: false,
    recurring_frequency: 'monthly'
  });
  const [editErrors, setEditErrors] = useState({});

  // Delete Confirmation Modal State
  const [deletingExpense, setDeletingExpense] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Open Edit Modal
  const handleStartEdit = (expense) => {
    setEditingExpense(expense);
    setEditFormData({
      description: expense.description || expense.title || '',
      amount: expense.amount,
      category: expense.category || 'Food',
      date: expense.date,
      payment_method: expense.payment_method || expense.paymentMethod || 'Card',
      notes: expense.notes || '',
      is_recurring: Boolean(expense.is_recurring),
      recurring_frequency: expense.recurring_frequency || 'monthly'
    });
    setEditErrors({});
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingExpense) return;

    // Validation
    const errors = {};
    if (!editFormData.description || !editFormData.description.trim()) {
      errors.description = 'Description cannot be empty';
    }
    const num = parseFloat(editFormData.amount);
    if (!editFormData.amount || isNaN(num) || num <= 0) {
      errors.amount = 'Amount must be positive';
    }
    if (!editFormData.date || isNaN(new Date(editFormData.date).getTime())) {
      errors.date = 'Date must be valid';
    }

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }

    await editExpense(editingExpense.id, {
      description: editFormData.description.trim(),
      title: editFormData.description.trim(),
      amount: parseFloat(editFormData.amount),
      category: editFormData.category,
      date: editFormData.date,
      payment_method: editFormData.payment_method,
      notes: editFormData.notes ? editFormData.notes.trim() : null,
      is_recurring: editFormData.is_recurring,
      recurring_frequency: editFormData.is_recurring ? editFormData.recurring_frequency : null
    });

    setEditingExpense(null);
  };

  // Delete Action
  const handleConfirmDelete = async () => {
    if (!deletingExpense) return;
    setIsDeleting(true);
    try {
      await deleteExpense(deletingExpense.id);
      setDeletingExpense(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Date Presets
  const applyDatePreset = (preset) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (preset === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'week') {
      const lastWeek = new Date(today);
      lastWeek.setDate(today.getDate() - 7);
      setStartDate(lastWeek.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === 'month') {
      const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(firstOfMonth.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else {
      setStartDate('');
      setEndDate('');
    }
    setCurrentPage(1);
  };

  // Filtered & Sorted Expenses
  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((exp) => {
        // Category Filter
        const matchesCategory =
          selectedCategory === 'all' ||
          exp.category.toLowerCase() === selectedCategory.toLowerCase();

        // Search Filter
        const titleStr = (exp.description || exp.title || '').toLowerCase();
        const notesStr = (exp.notes || '').toLowerCase();
        const q = searchQuery.toLowerCase();
        const matchesSearch = !q || titleStr.includes(q) || notesStr.includes(q);

        // Date Range Filter
        const expDate = exp.date;
        const matchesStart = !startDate || expDate >= startDate;
        const matchesEnd = !endDate || expDate <= endDate;

        // Payment Method Filter
        const expPm = (exp.payment_method || exp.paymentMethod || '').toLowerCase();
        const matchesPayment =
          paymentMethodFilter === 'all' || expPm === paymentMethodFilter.toLowerCase();

        // Amount Range Filter
        const amt = parseFloat(exp.amount) || 0;
        const matchesMinAmount = !minAmount || amt >= parseFloat(minAmount);
        const matchesMaxAmount = !maxAmount || amt <= parseFloat(maxAmount);

        // Recurring Filter
        const isRec = Boolean(exp.is_recurring);
        const matchesRecurring =
          recurringFilter === 'all' ||
          (recurringFilter === 'recurring' ? isRec : !isRec);

        return (
          matchesCategory &&
          matchesSearch &&
          matchesStart &&
          matchesEnd &&
          matchesPayment &&
          matchesMinAmount &&
          matchesMaxAmount &&
          matchesRecurring
        );
      })
      .sort((a, b) => {
        if (sortBy === 'date-desc') return new Date(b.date) - new Date(a.date);
        if (sortBy === 'date-asc') return new Date(a.date) - new Date(b.date);
        if (sortBy === 'amount-desc') return b.amount - a.amount;
        if (sortBy === 'amount-asc') return a.amount - b.amount;
        return 0;
      });
  }, [
    expenses,
    selectedCategory,
    searchQuery,
    startDate,
    endDate,
    paymentMethodFilter,
    minAmount,
    maxAmount,
    recurringFilter,
    sortBy
  ]);

  // Total filtered amount
  const totalFilteredAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  }, [filteredExpenses]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredExpenses.length / itemsPerPage));
  const paginatedExpenses = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredExpenses.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredExpenses, currentPage, itemsPerPage]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const hasActiveFilters =
    searchQuery ||
    selectedCategory !== 'all' ||
    startDate ||
    endDate ||
    paymentMethodFilter !== 'all' ||
    minAmount ||
    maxAmount ||
    recurringFilter !== 'all';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setStartDate('');
    setEndDate('');
    setPaymentMethodFilter('all');
    setMinAmount('');
    setMaxAmount('');
    setRecurringFilter('all');
    setCurrentPage(1);
  };

  // Export CSV via Backend API or fallback
  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      if (!hasActiveFilters && expenses.length > 0) {
        await expenseService.exportExpensesCsv();
        showToast('All expenses exported to CSV!', 'success');
        return;
      }

      if (filteredExpenses.length === 0) {
        showToast('No expenses match the current filter to export', 'info');
        return;
      }
      const headers = ['ID,Description,Amount,Category,Date,PaymentMethod,IsRecurring,RecurringFrequency,Notes'];
      const rows = filteredExpenses.map(e =>
        `"${e.id}","${(e.description || e.title || '').replace(/"/g, '""')}","${e.amount}","${e.category}","${e.date}","${e.payment_method || e.paymentMethod || ''}","${e.is_recurring ? 'true' : 'false'}","${e.recurring_frequency || ''}","${(e.notes || '').replace(/"/g, '""')}"`
      );
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `student_expenses_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast(`Exported ${filteredExpenses.length} filtered expenses!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to export CSV', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            All Expenses
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Browse, filter, search, and manage your college expenditures
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <Button
            onClick={() => setIsScanModalOpen(true)}
            variant="secondary"
            icon={Scan}
            size="sm"
            className="border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10"
          >
            Scan Receipt
          </Button>

          <Button
            onClick={() => setIsImportModalOpen(true)}
            variant="secondary"
            icon={Upload}
            size="sm"
          >
            Import CSV
          </Button>

          <Button
            onClick={handleExportCSV}
            variant="secondary"
            icon={Download}
            size="sm"
            loading={isExporting}
            disabled={filteredExpenses.length === 0}
          >
            Export CSV
          </Button>

          <Button
            onClick={onOpenAddExpense}
            icon={Plus}
            size="sm"
          >
            Add Expense
          </Button>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <GlassCard className="p-4 sm:p-5 space-y-4">
        {/* Row 1: Search, Sort, Filters Toggle and View Mode */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search description, groceries, notes..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl glass-input text-white placeholder-slate-500 focus:border-cyan-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end flex-wrap">
            {/* Advanced Filters Button */}
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                showAdvancedFilters || paymentMethodFilter !== 'all' || minAmount || maxAmount || recurringFilter !== 'all'
                  ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                  : 'bg-slate-900/80 border-slate-700/80 text-slate-300 hover:text-white'
              }`}
              title="Toggle advanced filters"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
              <span>Filters</span>
              {(paymentMethodFilter !== 'all' || minAmount || maxAmount || recurringFilter !== 'all') && (
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              )}
            </button>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-900/80 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white cursor-pointer focus:border-cyan-400"
              >
                <option value="date-desc">Date: Newest First</option>
                <option value="date-asc">Date: Oldest First</option>
                <option value="amount-desc">Amount: High to Low</option>
                <option value="amount-asc">Amount: Low to High</option>
              </select>
            </div>

            {/* View Mode Toggle (Table / Grid) */}
            <div className="flex items-center p-1 rounded-xl bg-slate-900/80 border border-slate-800">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
                }`}
                title="Table view"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
                }`}
                title="Cards view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Date Filters & Presets */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-slate-400 flex items-center gap-1 font-semibold uppercase text-[10px] tracking-wider">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              Date Filter:
            </span>

            {/* Start Date */}
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
              className="bg-slate-900/80 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-white"
              title="Start date"
            />
            <span className="text-slate-500">to</span>
            {/* End Date */}
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
              className="bg-slate-900/80 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-white"
              title="End date"
            />

            {/* Quick Presets */}
            <div className="flex items-center gap-1 ml-1">
              <button
                type="button"
                onClick={() => applyDatePreset('today')}
                className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => applyDatePreset('week')}
                className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                7 Days
              </button>
              <button
                type="button"
                onClick={() => applyDatePreset('month')}
                className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                This Month
              </button>
            </div>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-rose-400 hover:text-rose-300 text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {/* Advanced Filters Panel */}
        {showAdvancedFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800/80 text-xs animate-fade-in">
            {/* Payment Method */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethodFilter}
                onChange={(e) => { setPaymentMethodFilter(e.target.value); setCurrentPage(1); }}
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-cyan-400 cursor-pointer"
              >
                <option value="all">All Payment Methods</option>
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm} value={pm}>{pm}</option>
                ))}
              </select>
            </div>

            {/* Amount Range */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                Amount Range ({getCurrencySymbol()})
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder={`Min ${getCurrencySymbol()}`}
                  value={minAmount}
                  onChange={(e) => { setMinAmount(e.target.value); setCurrentPage(1); }}
                  className="w-1/2 bg-slate-900/90 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400"
                />
                <span className="text-slate-500">-</span>
                <input
                  type="number"
                  placeholder={`Max ${getCurrencySymbol()}`}
                  value={maxAmount}
                  onChange={(e) => { setMaxAmount(e.target.value); setCurrentPage(1); }}
                  className="w-1/2 bg-slate-900/90 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400"
                />
              </div>
            </div>

            {/* Expense Type (Recurring vs One-time) */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                Expense Type
              </label>
              <select
                value={recurringFilter}
                onChange={(e) => { setRecurringFilter(e.target.value); setCurrentPage(1); }}
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-cyan-400 cursor-pointer"
              >
                <option value="all">All Expenses</option>
                <option value="recurring">Recurring Subscriptions Only</option>
                <option value="one_time">One-Time Only</option>
              </select>
            </div>
          </div>
        )}

        {/* Row 3: Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
          <button
            type="button"
            onClick={() => { setSelectedCategory('all'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
            }`}
          >
            All Categories ({expenses.length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = expenses.filter(e => e.category.toLowerCase() === cat.name.toLowerCase()).length;
            const isSelected = selectedCategory.toLowerCase() === cat.name.toLowerCase();
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => { setSelectedCategory(cat.name); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'border text-white shadow-md'
                    : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800/80 hover:text-white border border-slate-800/80'
                }`}
                style={isSelected ? {
                  backgroundColor: cat.badgeBg,
                  borderColor: cat.borderColor,
                  color: cat.color
                } : {}}
              >
                <span>{cat.name}</span>
                <span className="text-[10px] opacity-75">({count})</span>
              </button>
            );
          })}
        </div>
      </GlassCard>

      {/* Summary Row */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>
          Showing <strong>{paginatedExpenses.length}</strong> of <strong>{filteredExpenses.length}</strong> matching expenses
        </span>
        <span>
          Total Filtered: <strong className="text-white font-bold">{formatCurrency(totalFilteredAmount)}</strong>
        </span>
      </div>

      {/* Listing Content */}
      {filteredExpenses.length === 0 ? (
        <EmptyState
          title="No expenses yet"
          description="Start tracking your spending."
          actionLabel="Add Expense"
          onAction={onOpenAddExpense}
        />
      ) : (
        <div className="space-y-4">
          {/* Desktop & Tablet Table View */}
          {viewMode === 'table' ? (
            <div>
              <div className="hidden md:block">
                <ExpenseTable
                  expenses={paginatedExpenses}
                  onEdit={handleStartEdit}
                  onDelete={(id) => {
                    const target = expenses.find(e => e.id === id);
                    setDeletingExpense(target);
                  }}
                />
              </div>
              {/* Mobile View converts table into responsive cards */}
              <div className="md:hidden space-y-3">
                {paginatedExpenses.map((expense) => (
                  <ExpenseCard
                    key={expense.id}
                    expense={expense}
                    onEdit={handleStartEdit}
                    onDelete={(id) => {
                      const target = expenses.find(e => e.id === id);
                      setDeletingExpense(target);
                    }}
                  />
                ))}
              </div>
            </div>
          ) : (
            /* Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paginatedExpenses.map((expense) => (
                <ExpenseCard
                  key={expense.id}
                  expense={expense}
                  onEdit={handleStartEdit}
                  onDelete={(id) => {
                    const target = expenses.find(e => e.id === id);
                    setDeletingExpense(target);
                  }}
                />
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800/80 px-2">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Items per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-slate-900 border border-slate-700/80 rounded px-2 py-1 text-white text-xs cursor-pointer"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span>
                  Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-700/80 bg-slate-900 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all ${
                      currentPage === pageNum
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                        : 'border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-700/80 bg-slate-900 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Expense Modal */}
      <Modal
        isOpen={!!editingExpense}
        onClose={() => setEditingExpense(null)}
        title="Edit Expense"
        subtitle="Modify spending record details"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
              Description *
            </label>
            <input
              type="text"
              required
              value={editFormData.description}
              onChange={(e) => {
                setEditFormData({ ...editFormData, description: e.target.value });
                if (editErrors.description) setEditErrors({ ...editErrors, description: null });
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl glass-input text-white text-sm ${
                editErrors.description ? 'border-rose-500' : ''
              }`}
            />
            {editErrors.description && (
              <p className="text-xs text-rose-400 mt-1">{editErrors.description}</p>
            )}
          </div>

          {/* Amount and Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                Amount ({getCurrencySymbol()}) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={editFormData.amount}
                onChange={(e) => {
                  setEditFormData({ ...editFormData, amount: e.target.value });
                  if (editErrors.amount) setEditErrors({ ...editErrors, amount: null });
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl glass-input text-white text-sm font-semibold ${
                  editErrors.amount ? 'border-rose-500' : ''
                }`}
              />
              {editErrors.amount && (
                <p className="text-xs text-rose-400 mt-1">{editErrors.amount}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                Date *
              </label>
              <input
                type="date"
                required
                value={editFormData.date}
                onChange={(e) => {
                  setEditFormData({ ...editFormData, date: e.target.value });
                  if (editErrors.date) setEditErrors({ ...editErrors, date: null });
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl glass-input text-white text-sm ${
                  editErrors.date ? 'border-rose-500' : ''
                }`}
              />
              {editErrors.date && (
                <p className="text-xs text-rose-400 mt-1">{editErrors.date}</p>
              )}
            </div>
          </div>

          {/* Category & Payment Method */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                Category
              </label>
              <select
                value={editFormData.category}
                onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-white text-sm cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.name} className="bg-slate-900 text-white">
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                Payment Method
              </label>
              <select
                value={editFormData.payment_method}
                onChange={(e) => setEditFormData({ ...editFormData, payment_method: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-white text-sm cursor-pointer"
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method} className="bg-slate-900 text-white">
                    {method}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
              Notes
            </label>
            <input
              type="text"
              value={editFormData.notes}
              onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-white text-sm"
              placeholder="Optional notes"
            />
          </div>

          {/* Recurring Expense Settings */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-200">
              <input
                type="checkbox"
                checked={editFormData.is_recurring}
                onChange={(e) => setEditFormData({ ...editFormData, is_recurring: e.target.checked })}
                className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
              />
              <Repeat className="w-3.5 h-3.5 text-cyan-400" />
              <span>Mark as Recurring Subscription</span>
            </label>
            {editFormData.is_recurring && (
              <div className="flex items-center gap-2 pl-6">
                <span className="text-[10px] uppercase font-bold text-slate-400">Frequency:</span>
                <select
                  value={editFormData.recurring_frequency}
                  onChange={(e) => setEditFormData({ ...editFormData, recurring_frequency: e.target.value })}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            )}
          </div>

          <div className="pt-3 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setEditingExpense(null)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingExpense}
        onClose={() => setDeletingExpense(null)}
        title="Confirm Deletion"
        subtitle="Are you sure you want to remove this expense record?"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          {deletingExpense && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-slate-200 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">
                  {deletingExpense.description || deletingExpense.title}
                </span>
                <span className="font-bold text-rose-400">
                  {formatCurrency(deletingExpense.amount)}
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Category: {deletingExpense.category} • Date: {deletingExpense.date}
              </div>
            </div>
          )}

          <p className="text-xs text-slate-400">
            This transaction will be permanently deleted from the database. This action cannot be undone.
          </p>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDeletingExpense(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              icon={Trash2}
              isLoading={isDeleting}
              onClick={handleConfirmDelete}
            >
              Delete Expense
            </Button>
          </div>
        </div>
      </Modal>

      {/* CSV Import Modal */}
      <CsvImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={() => {
          refreshData();
          setIsImportModalOpen(false);
        }}
      />

      {/* Receipt Scanner Modal */}
      <ReceiptScannerModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onExpenseAdded={() => {
          refreshData();
          setIsScanModalOpen(false);
        }}
      />
    </div>
  );
};

export default Expenses;
