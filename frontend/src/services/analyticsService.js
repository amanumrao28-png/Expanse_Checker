import apiClient from './api';

export const analyticsService = {
  // GET /api/analytics/summary
  async getSummary() {
    const response = await apiClient.get('/analytics/summary');
    return response.data;
  },

  // GET /api/analytics/categories
  async getCategories() {
    const response = await apiClient.get('/analytics/categories');
    return response.data;
  },

  // GET /api/analytics/daily
  async getDaily() {
    const response = await apiClient.get('/analytics/daily');
    return response.data;
  },

  // GET /api/analytics/weekly
  async getWeekly() {
    const response = await apiClient.get('/analytics/weekly');
    return response.data;
  },

  // GET /api/analytics/monthly
  async getMonthly() {
    const response = await apiClient.get('/analytics/monthly');
    return response.data;
  },

  // Unified real dashboard analytics
  async getDashboardAnalytics() {
    try {
      const [summary, categories, daily, weekly, monthly] = await Promise.all([
        this.getSummary(),
        this.getCategories(),
        this.getDaily(),
        this.getWeekly(),
        this.getMonthly()
      ]);

      const categoryData = (categories || [])
        .filter(c => c && c.amount > 0)
        .map(c => {
          const catName = c.name || c.category || 'Other';
          return {
            id: String(catName).toLowerCase(),
            name: catName,
            category: catName,
            amount: Number(c.amount || 0),
            count: Number(c.count || 0),
            percentage: Number(c.percentage || 0),
            budget: Number(c.budget || 0),
            color: c.color || '#38bdf8'
          };
        });

      // Monthly Trend Line Chart data
      const monthlyTrend = monthly.map(m => ({
        month: m.month_name || m.month,
        spent: m.amount,
        budget: m.budget,
        count: m.count
      }));

      // Weekly Spending Bar Chart data
      const weeklyData = weekly.map(w => ({
        day: w.week_label || w.week,
        amount: w.amount,
        count: w.count
      }));

      return {
        data: {
          totalSpent: summary.total_spent,
          monthlyBudget: summary.monthly_budget,
          remainingBudget: summary.remaining_budget,
          dailyAverage: summary.daily_average,
          percentOfBudget: summary.percentage_used,
          previousMonthSpending: summary.previous_month_spending,
          spendingChange: summary.spending_change_percentage,
          totalTransactions: summary.total_transactions,
          allTimeTransactions: summary.all_time_transactions,
          summary,
          categories,
          categoryData,
          monthlyTrend,
          weeklyData,
          daily
        },
        source: 'backend'
      };
    } catch (err) {
      console.warn('[Analytics API Error]:', err.message);
      throw err;
    }
  },

  // Alias for compatibility
  async getDashboardStats() {
    return this.getDashboardAnalytics();
  }
};

export default analyticsService;
