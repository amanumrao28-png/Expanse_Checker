import apiClient from './api';

export const budgetService = {
  // GET /api/budget
  async getBudgets(month, year) {
    const params = {};
    if (month) params.month = month;
    if (year) params.year = year;
    const response = await apiClient.get('/budget', { params });
    return { data: response.data, source: 'backend' };
  },

  // POST /api/budget
  async createBudget(budgetData) {
    const response = await apiClient.post('/budget', budgetData);
    return { data: response.data, source: 'backend' };
  },

  // PUT /api/budget
  async updateBudgets(budgetData) {
    const payload = {
      total_budget: budgetData.total_budget ?? budgetData.monthlyTotal ?? budgetData.totalBudget,
      category_budgets: budgetData.category_budgets ?? budgetData.categories,
      month: budgetData.month,
      year: budgetData.year
    };
    const response = await apiClient.put('/budget', payload);
    return { data: response.data, source: 'backend' };
  },

  // PUT /api/budget/category/{categoryId}
  async updateCategoryBudget(categoryId, amount) {
    const response = await apiClient.put(`/budget/category/${categoryId}`, {
      amount: parseFloat(amount)
    });
    return { data: response.data, source: 'backend' };
  }
};

export default budgetService;
