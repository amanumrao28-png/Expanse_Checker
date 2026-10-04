import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getExpenses, createExpense, updateExpense, deleteExpense } from '../services/expenseService';
import { budgetService } from '../services/budgetService';
import { analyticsService } from '../services/analyticsService';
import { aiService } from '../services/aiService';
import { useAuth } from './AuthContext';

const ExpenseContext = createContext(null);

export const ExpenseProvider = ({ children }) => {
  const { token } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [budgets, setBudgets] = useState({ monthlyTotal: 1500, categories: {} });
  const [analytics, setAnalytics] = useState(null);
  const [insights, setInsights] = useState([]);
  const [insightsMetadata, setInsightsMetadata] = useState({
    hasSufficientData: true,
    message: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [dataSource, setDataSource] = useState('backend');
  const [toasts, setToasts] = useState([]);
  const [currencyVersion, setCurrencyVersion] = useState(0);

  useEffect(() => {
    const handleCurrencyChange = () => {
      setCurrencyVersion((prev) => prev + 1);
    };
    window.addEventListener('currencyChange', handleCurrencyChange);
    window.addEventListener('storage', handleCurrencyChange);
    return () => {
      window.removeEventListener('currencyChange', handleCurrencyChange);
      window.removeEventListener('storage', handleCurrencyChange);
    };
  }, []);

  // Toast notification helper
  const showToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch all core data from PostgreSQL backend
  const fetchData = useCallback(async (params = {}) => {
    setIsLoading(true);
    setApiError(null);
    try {
      const [expRes, budRes, statsRes, insRes] = await Promise.all([
        getExpenses(params),
        budgetService.getBudgets(),
        analyticsService.getDashboardAnalytics(),
        aiService.getInsights()
      ]);

      setExpenses(expRes.data || []);
      setBudgets(budRes.data || { monthlyTotal: 10000, categories: {} });
      setAnalytics(statsRes.data);
      setInsights(insRes.data || []);
      setInsightsMetadata({
        hasSufficientData: insRes.has_sufficient_data ?? ((insRes.data || []).length > 0),
        message: insRes.message || null
      });
      setDataSource(expRes.source);
    } catch (err) {
      console.error('Failed to load financial data:', err);
      setApiError(err.message || 'Failed to connect to backend');
      showToast('Could not sync with PostgreSQL backend', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData, token]);

  // Add Expense
  const handleAddExpense = async (expenseData) => {
    try {
      const res = await createExpense(expenseData);
      setExpenses((prev) => [res.data, ...prev]);

      // Refresh real analytics and AI insights from PostgreSQL
      const [statsRes, insRes] = await Promise.all([
        analyticsService.getDashboardAnalytics(),
        aiService.getInsights()
      ]);
      setAnalytics(statsRes.data);
      setInsights(insRes.data || []);
      setInsightsMetadata({
        hasSufficientData: insRes.has_sufficient_data ?? ((insRes.data || []).length > 0),
        message: insRes.message || null
      });

      showToast('Expense recorded in PostgreSQL!', 'success');
      return res.data;
    } catch (err) {
      showToast('Failed to add expense', 'error');
      throw err;
    }
  };

  // Edit Expense
  const handleEditExpense = async (id, expenseData) => {
    try {
      const res = await updateExpense(id, expenseData);
      const updatedList = expenses.map((e) => (String(e.id) === String(id) ? res.data : e));
      setExpenses(updatedList);

      // Refresh real analytics and AI insights from PostgreSQL
      const [statsRes, insRes] = await Promise.all([
        analyticsService.getDashboardAnalytics(),
        aiService.getInsights()
      ]);
      setAnalytics(statsRes.data);
      setInsights(insRes.data || []);
      setInsightsMetadata({
        hasSufficientData: insRes.has_sufficient_data ?? ((insRes.data || []).length > 0),
        message: insRes.message || null
      });

      showToast('Expense updated successfully', 'success');
      return res.data;
    } catch (err) {
      showToast('Failed to update expense', 'error');
      throw err;
    }
  };

  // Delete Expense
  const handleDeleteExpense = async (id) => {
    try {
      await deleteExpense(id);
      const updatedList = expenses.filter((e) => String(e.id) !== String(id));
      setExpenses(updatedList);

      // Refresh real analytics and AI insights from PostgreSQL
      const [statsRes, insRes] = await Promise.all([
        analyticsService.getDashboardAnalytics(),
        aiService.getInsights()
      ]);
      setAnalytics(statsRes.data);
      setInsights(insRes.data || []);
      setInsightsMetadata({
        hasSufficientData: insRes.has_sufficient_data ?? ((insRes.data || []).length > 0),
        message: insRes.message || null
      });

      showToast('Expense deleted from PostgreSQL', 'info');
    } catch (err) {
      showToast('Failed to delete expense', 'error');
      throw err;
    }
  };

  // Update budget
  const updateBudget = async (newBudgets) => {
    try {
      const res = await budgetService.updateBudgets(newBudgets);
      setBudgets(res.data);
      const [statsRes, insRes] = await Promise.all([
        analyticsService.getDashboardAnalytics(),
        aiService.getInsights()
      ]);
      setAnalytics(statsRes.data);
      setInsights(insRes.data || []);
      setInsightsMetadata({
        hasSufficientData: insRes.has_sufficient_data ?? ((insRes.data || []).length > 0),
        message: insRes.message || null
      });
      showToast('Budget preferences saved in PostgreSQL!', 'success');
      return res.data;
    } catch (err) {
      const errMsg = err.response?.data?.detail || err.message || 'Failed to update budget';
      showToast(errMsg, 'error', 5000);
      throw err;
    }
  };

  // Update specific category budget
  const updateCategoryBudget = async (categoryId, amount) => {
    try {
      const res = await budgetService.updateCategoryBudget(categoryId, amount);
      setBudgets(res.data);
      const [statsRes, insRes] = await Promise.all([
        analyticsService.getDashboardAnalytics(),
        aiService.getInsights()
      ]);
      setAnalytics(statsRes.data);
      setInsights(insRes.data || []);
      setInsightsMetadata({
        hasSufficientData: insRes.has_sufficient_data ?? ((insRes.data || []).length > 0),
        message: insRes.message || null
      });
      showToast(`${categoryId} budget updated in PostgreSQL!`, 'success');
      return res.data;
    } catch (err) {
      const errMsg = err.response?.data?.detail || err.message || 'Failed to update category budget';
      showToast(errMsg, 'error', 5000);
      throw err;
    }
  };

  return (
    <ExpenseContext.Provider
      value={{
        expenses,
        budgets,
        analytics,
        insights,
        insightsMetadata,
        isLoading,
        apiError,
        dataSource,
        currencyVersion,
        toasts,
        showToast,
        removeToast,
        addExpense: handleAddExpense,
        editExpense: handleEditExpense,
        deleteExpense: handleDeleteExpense,
        updateBudget,
        updateCategoryBudget,
        refreshData: fetchData
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpenses = () => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpenses must be used within an ExpenseProvider');
  }
  return context;
};
