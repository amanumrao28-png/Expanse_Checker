import apiClient from './api';

export const aiService = {
  // Query local Ollama Gemma AI through FastAPI backend
  async queryAssistant(message, context = {}) {
    try {
      const response = await apiClient.post('/ai/chat', {
        message,
        context,
        model: 'gemma3'
      });
      return {
        reply: response.data.reply || response.data.response,
        source: response.data.source || 'ollama-gemma',
        model: response.data.model || 'gemma3'
      };
    } catch (err) {
      console.error('AI Assistant API query failed:', err);
      throw err;
    }
  },

  // Parse natural language expense statement using local Gemma AI model
  // Endpoint: POST /api/ai/parse-natural-expense
  async parseNaturalExpense(text) {
    try {
      const todayIso = new Date().toISOString().split('T')[0];
      const response = await apiClient.post('/ai/parse-natural-expense', {
        text: text.trim(),
        current_date: todayIso
      });
      return {
        amount: response.data.amount,
        category: response.data.category,
        description: response.data.description,
        date: response.data.date,
        payment_method: response.data.payment_method,
        needs_clarification: response.data.needs_clarification,
        clarification_prompt: response.data.clarification_prompt,
        raw_text: response.data.raw_text,
        source: response.data.source,
        success: response.data.success,
        error: response.data.error
      };
    } catch (err) {
      console.warn('Natural language expense parsing failed, using fallback:', err);
      return {
        amount: null,
        category: this._localFallbackCategory(text),
        description: text.trim(),
        date: new Date().toISOString().split('T')[0],
        payment_method: null,
        needs_clarification: true,
        clarification_prompt: 'Please enter the expense amount.',
        source: 'local_fallback',
        success: false,
        error: 'AI service unavailable'
      };
    }
  },

  // Categorize expense using local Ollama Gemma model with strict JSON output
  // Endpoint: POST /api/ai/categorize-expense
  async categorizeExpense(description, amount) {
    try {
      const response = await apiClient.post('/ai/categorize-expense', {
        description: description.trim(),
        amount: amount ? parseFloat(amount) : undefined
      });
      return {
        category: response.data.category,
        description: response.data.description,
        reason: response.data.reason,
        source: response.data.source || 'ollama-gemma',
        success: response.data.success ?? true,
        error: response.data.error || null
      };
    } catch (err) {
      console.warn('AI categorization request failed, using graceful fallback:', err);
      return {
        category: this._localFallbackCategory(description),
        description: description,
        reason: 'Manual selection enabled (AI service offline)',
        source: 'local_fallback',
        success: false,
        error: 'Local Ollama service unavailable. Please select category manually.'
      };
    }
  },

  // Legacy helper
  async predictCategory(title) {
    const res = await this.categorizeExpense(title);
    return res.category;
  },

  _localFallbackCategory(description) {
    const t = (description || '').toLowerCase();
    if (t.includes('food') || t.includes('cafe') || t.includes('coffee') || t.includes('burger') || t.includes('pizza') || t.includes('grocer') || t.includes('lunch') || t.includes('dinner')) {
      return 'Food';
    }
    if (t.includes('bus') || t.includes('subway') || t.includes('metro') || t.includes('transit') || t.includes('uber') || t.includes('train') || t.includes('flight') || t.includes('travel')) {
      return 'Travel';
    }
    if (t.includes('book') || t.includes('course') || t.includes('tuition') || t.includes('exam') || t.includes('pen') || t.includes('notebook') || t.includes('textbook') || t.includes('study')) {
      return 'Education';
    }
    if (t.includes('cloth') || t.includes('shoe') || t.includes('shirt') || t.includes('mall') || t.includes('amazon') || t.includes('shopping')) {
      return 'Shopping';
    }
    if (t.includes('movie') || t.includes('steam') || t.includes('game') || t.includes('concert') || t.includes('party') || t.includes('netflix') || t.includes('cinema')) {
      return 'Entertainment';
    }
    if (t.includes('rent') || t.includes('dorm') || t.includes('electric') || t.includes('water') || t.includes('wifi') || t.includes('bill') || t.includes('utility')) {
      return 'Bills';
    }
    if (t.includes('doctor') || t.includes('pharmacy') || t.includes('medicine') || t.includes('dentist') || t.includes('hospital') || t.includes('health') || t.includes('gym')) {
      return 'Healthcare';
    }
    if (t.includes('laptop') || t.includes('phone') || t.includes('headphone') || t.includes('monitor') || t.includes('tech') || t.includes('gadget') || t.includes('electronics')) {
      return 'Electronics';
    }
    return 'Other';
  },

  // Fetch dynamic AI insights grounded in real PostgreSQL records
  async getInsights() {
    try {
      const response = await apiClient.get('/ai/insights');
      const resData = response.data;
      const list = Array.isArray(resData) ? resData : (resData.insights || []);
      const hasSufficient = Array.isArray(resData)
        ? resData.length > 0
        : (resData.has_sufficient_data ?? (list.length > 0));

      return {
        data: list,
        insights: list,
        has_sufficient_data: hasSufficient,
        message: resData?.message || (hasSufficient ? null : 'Add more expenses to unlock personalized insights.'),
        source: 'backend'
      };
    } catch (err) {
      console.warn('Failed to fetch AI insights from backend:', err);
      return {
        data: [],
        insights: [],
        has_sufficient_data: false,
        message: 'Add more expenses to unlock personalized insights.',
        source: 'offline'
      };
    }
  }
};

export default aiService;
