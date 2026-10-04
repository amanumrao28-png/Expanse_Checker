import apiClient from './api';

export const authService = {
  async register(email, password, fullName = '') {
    const res = await apiClient.post('/auth/register', {
      email,
      password,
      full_name: fullName,
    });
    if (res.data && res.data.access_token) {
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  async login(email, password) {
    const res = await apiClient.post('/auth/login', {
      email,
      password,
    });
    if (res.data && res.data.access_token) {
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  async resetPassword(email, newPassword) {
    const res = await apiClient.post('/auth/reset-password', {
      email,
      new_password: newPassword,
    });
    if (res.data && res.data.access_token) {
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  async getProfile() {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  getToken() {
    return localStorage.getItem('token');
  }
};

export default authService;
