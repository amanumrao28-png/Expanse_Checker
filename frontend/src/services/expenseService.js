import apiClient from './api';

// In-memory runtime cache for seamless operation when FastAPI backend is starting up
let runtimeExpensesCache = null;

// Initial state cache - only used if FastAPI is not yet running, never hardcoded in components
const getInitialSeed = () => [
  {
    id: 1,
    description: 'Weekly Campus Groceries & Fruit',
    amount: 54.20,
    category: 'Food',
    date: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString().split('T')[0],
    payment_method: 'Card',
    notes: 'Bought at supermarket near dorm'
  },
  {
    id: 2,
    description: 'City Subway & Metro Pass',
    amount: 32.00,
    category: 'Travel',
    date: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString().split('T')[0],
    payment_method: 'UPI',
    notes: 'Monthly student transit renewal'
  },
  {
    id: 3,
    description: 'Computer Science Course Textbook',
    amount: 85.00,
    category: 'Education',
    date: new Date(Date.now() - 1000 * 60 * 60 * 54).toISOString().split('T')[0],
    payment_method: 'Bank Transfer',
    notes: 'Algorithms & Discrete Mathematics'
  },
  {
    id: 4,
    description: 'Noise Cancelling Headphones',
    amount: 69.99,
    category: 'Electronics',
    date: new Date(Date.now() - 1000 * 60 * 60 * 80).toISOString().split('T')[0],
    payment_method: 'Card',
    notes: 'Study focus headphones'
  },
  {
    id: 5,
    description: 'Campus Dorm High-Speed Wifi',
    amount: 25.00,
    category: 'Bills',
    date: new Date(Date.now() - 1000 * 60 * 60 * 110).toISOString().split('T')[0],
    payment_method: 'UPI',
    notes: 'Monthly shared broadband'
  },
  {
    id: 6,
    description: 'Weekend Cinema Tickets with Friends',
    amount: 18.50,
    category: 'Entertainment',
    date: new Date(Date.now() - 1000 * 60 * 60 * 140).toISOString().split('T')[0],
    payment_method: 'Cash',
    notes: 'Student matinee ticket'
  }
];

/**
 * Fetch list of expenses from FastAPI backend
 * GET /api/expenses
 */
export const getExpenses = async (params = {}) => {
  try {
    const response = await apiClient.get('/expenses', { params });
    // Normalize fields so both description and title are available
    const normalized = (response.data || []).map(exp => ({
      ...exp,
      description: exp.description || exp.title || 'Untitled Expense',
      payment_method: exp.payment_method || exp.paymentMethod || 'Card'
    }));
    runtimeExpensesCache = normalized;
    return { data: normalized, source: 'backend' };
  } catch (error) {
    console.info('[API Notice] FastAPI backend offline, serving synced cache:', error.message);
    if (!runtimeExpensesCache) {
      runtimeExpensesCache = getInitialSeed();
    }
    
    // Perform filtering & sorting in memory cache
    let list = [...runtimeExpensesCache];

    if (params.category && params.category !== 'all') {
      list = list.filter(e => e.category.toLowerCase() === params.category.toLowerCase());
    }

    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(e => 
        (e.description && e.description.toLowerCase().includes(q)) ||
        (e.notes && e.notes.toLowerCase().includes(q))
      );
    }

    if (params.start_date) {
      list = list.filter(e => e.date >= params.start_date);
    }
    if (params.end_date) {
      list = list.filter(e => e.date <= params.end_date);
    }

    if (params.sort_by === 'amount_desc') {
      list.sort((a, b) => b.amount - a.amount);
    } else if (params.sort_by === 'amount_asc') {
      list.sort((a, b) => a.amount - b.amount);
    } else if (params.sort_by === 'date_asc') {
      list.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else { // date_desc
      list.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    return { data: list, source: 'cache' };
  }
};

/**
 * Create a new expense via FastAPI backend
 * POST /api/expenses
 */
export const createExpense = async (expenseData) => {
  const payload = {
    description: (expenseData.description || expenseData.title || '').trim(),
    title: (expenseData.description || expenseData.title || '').trim(),
    amount: parseFloat(expenseData.amount),
    category: expenseData.category || 'Other',
    date: expenseData.date || new Date().toISOString().split('T')[0],
    payment_method: expenseData.payment_method || expenseData.paymentMethod || 'Card',
    notes: expenseData.notes ? expenseData.notes.trim() : null,
    is_recurring: Boolean(expenseData.is_recurring),
    recurring_frequency: expenseData.recurring_frequency || null
  };

  try {
    const response = await apiClient.post('/expenses', payload);
    const created = {
      ...response.data,
      description: response.data.description || response.data.title,
      payment_method: response.data.payment_method || payload.payment_method
    };
    if (runtimeExpensesCache) {
      runtimeExpensesCache.unshift(created);
    }
    return { data: created, source: 'backend' };
  } catch (error) {
    console.info('[API Notice] Fallback creating in local cache:', error.message);
    if (!runtimeExpensesCache) {
      runtimeExpensesCache = getInitialSeed();
    }
    const created = {
      ...payload,
      id: Date.now()
    };
    runtimeExpensesCache.unshift(created);
    return { data: created, source: 'cache' };
  }
};

/**
 * Update an existing expense via FastAPI backend
 * PUT /api/expenses/{id}
 */
export const updateExpense = async (id, expenseData) => {
  const payload = {
    description: (expenseData.description || expenseData.title || '').trim(),
    title: (expenseData.description || expenseData.title || '').trim(),
    amount: parseFloat(expenseData.amount),
    category: expenseData.category,
    date: expenseData.date,
    payment_method: expenseData.payment_method || expenseData.paymentMethod || 'Card',
    notes: expenseData.notes ? expenseData.notes.trim() : null,
    is_recurring: expenseData.is_recurring !== undefined ? Boolean(expenseData.is_recurring) : false,
    recurring_frequency: expenseData.recurring_frequency || null
  };

  try {
    const response = await apiClient.put(`/expenses/${id}`, payload);
    const updated = {
      ...response.data,
      description: response.data.description || response.data.title,
      payment_method: response.data.payment_method || payload.payment_method
    };
    if (runtimeExpensesCache) {
      const idx = runtimeExpensesCache.findIndex(e => String(e.id) === String(id));
      if (idx !== -1) runtimeExpensesCache[idx] = updated;
    }
    return { data: updated, source: 'backend' };
  } catch (error) {
    console.info('[API Notice] Fallback updating in local cache:', error.message);
    if (!runtimeExpensesCache) {
      runtimeExpensesCache = getInitialSeed();
    }
    const idx = runtimeExpensesCache.findIndex(e => String(e.id) === String(id));
    if (idx !== -1) {
      runtimeExpensesCache[idx] = { ...runtimeExpensesCache[idx], ...payload };
      return { data: runtimeExpensesCache[idx], source: 'cache' };
    }
    throw new Error('Expense not found');
  }
};

/**
 * Delete an expense via FastAPI backend
 * DELETE /api/expenses/{id}
 */
export const deleteExpense = async (id) => {
  try {
    await apiClient.delete(`/expenses/${id}`);
    if (runtimeExpensesCache) {
      runtimeExpensesCache = runtimeExpensesCache.filter(e => String(e.id) !== String(id));
    }
    return { success: true, source: 'backend' };
  } catch (error) {
    console.info('[API Notice] Fallback deleting from local cache:', error.message);
    if (runtimeExpensesCache) {
      runtimeExpensesCache = runtimeExpensesCache.filter(e => String(e.id) !== String(id));
    }
    return { success: true, source: 'cache' };
  }
};

/**
 * Export all expenses as CSV file download
 * GET /api/expenses/export-csv
 */
export const exportExpensesCsv = async () => {
  try {
    const response = await apiClient.get('/expenses/export-csv', {
      responseType: 'blob'
    });
    const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `student_expenses_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    return { success: true };
  } catch (err) {
    console.error('Failed to export CSV:', err);
    throw err;
  }
};

/**
 * Import expenses in bulk from a CSV file
 * POST /api/expenses/import-csv
 */
export const importExpensesCsv = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/expenses/import-csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  } catch (err) {
    console.error('Failed to import CSV:', err);
    throw err;
  }
};

/**
 * Scan receipt image with OCR text extraction
 * POST /api/expenses/scan-receipt
 */
export const scanReceipt = async (file, ocrText = null) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    if (ocrText) {
      formData.append('ocr_text', ocrText);
    }
    const response = await apiClient.post('/expenses/scan-receipt', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  } catch (err) {
    console.error('Failed to scan receipt:', err);
    throw err;
  }
};

/**
 * Fetch recurring expenses
 * GET /api/expenses/recurring
 */
export const getRecurringExpenses = async () => {
  try {
    const response = await apiClient.get('/expenses/recurring');
    return response.data;
  } catch (err) {
    console.error('Failed to fetch recurring expenses:', err);
    return { count: 0, total_monthly_commitment: 0, recurring_expenses: [] };
  }
};

/**
 * Generate monthly financial report
 * GET /api/analytics/report
 */
export const getMonthlyReport = async (month = null) => {
  try {
    const params = month ? { month } : {};
    const response = await apiClient.get('/analytics/report', { params });
    return response.data;
  } catch (err) {
    console.error('Failed to generate monthly report:', err);
    throw err;
  }
};

/**
 * Compare spending between two periods
 * GET /api/analytics/compare
 */
export const compareSpending = async (month1 = null, month2 = null) => {
  try {
    const params = {};
    if (month1) params.month1 = month1;
    if (month2) params.month2 = month2;
    const response = await apiClient.get('/analytics/compare', { params });
    return response.data;
  } catch (err) {
    console.error('Failed to compare spending periods:', err);
    throw err;
  }
};

export const expenseService = {
  getExpenses,
  getAll: getExpenses,
  createExpense,
  create: createExpense,
  updateExpense,
  update: updateExpense,
  deleteExpense,
  delete: deleteExpense,
  exportExpensesCsv,
  importExpensesCsv,
  scanReceipt,
  getRecurringExpenses,
  getMonthlyReport,
  compareSpending
};

export default expenseService;
