import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useExpenses } from '../context/ExpenseContext';
import { LogIn, UserPlus, X, Mail, Lock, User, Sparkles, CheckCircle2, AlertCircle, Eye, EyeOff, KeyRound } from 'lucide-react';
import Button from './Button';

const AuthModal = () => {
  const { isAuthModalOpen, closeAuthModal, authMode, setAuthMode, login, register, resetPassword, loading, authError } = useAuth();
  const { refreshData, showToast } = useExpenses();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return;
    }

    if (authMode === 'login') {
      const res = await login(email, password);
      if (res.success) {
        showToast(`Welcome back, ${res.user.full_name || 'Student'}!`, 'success');
        refreshData();
      }
    } else if (authMode === 'register') {
      const res = await register(email, password, fullName);
      if (res.success) {
        showToast(`Account created successfully! Welcome, ${res.user.full_name || 'Student'}!`, 'success');
        refreshData();
      }
    } else if (authMode === 'reset') {
      const res = await resetPassword(email, password);
      if (res.success) {
        showToast(`Password updated successfully! Welcome, ${res.user.full_name || 'Student'}!`, 'success');
        refreshData();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-md overflow-hidden rounded-2xl glass-card border border-white/20 shadow-2xl p-6 md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Close auth dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {authMode === 'login' && 'Sign In to Your Account'}
            {authMode === 'register' && 'Create Student Account'}
            {authMode === 'reset' && 'Reset Password'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {authMode === 'login' && 'Access your personal expenses, budgets, and AI assistant.'}
            {authMode === 'register' && 'Start tracking your real campus spending securely.'}
            {authMode === 'reset' && 'Set a fresh password and sign in immediately.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-white/5 rounded-xl border border-white/10 mb-6">
          <button
            type="button"
            onClick={() => setAuthMode('login')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
              authMode === 'login'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('register')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
              authMode === 'register'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Register</span>
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('reset')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
              authMode === 'reset'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>

        {/* Error message banner */}
        {authError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
            {authError.toLowerCase().includes('already exists') && (
              <div className="mt-2 pt-2 border-t border-rose-500/20 flex gap-3 text-[11px]">
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="text-cyan-400 hover:underline font-semibold"
                >
                  &rarr; Click here to Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('reset')}
                  className="text-amber-400 hover:underline font-semibold"
                >
                  &rarr; Or Reset Password
                </button>
              </div>
            )}
            {authError.toLowerCase().includes('incorrect') && (
              <div className="mt-2 pt-2 border-t border-rose-500/20 text-[11px]">
                <button
                  type="button"
                  onClick={() => setAuthMode('reset')}
                  className="text-amber-400 hover:underline font-semibold"
                >
                  &rarr; Forgot or mistyped password? Click to Reset Password
                </button>
              </div>
            )}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {authMode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. Aman Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                placeholder="student@campus.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-slate-300">
                {authMode === 'reset' ? 'New Password' : 'Password'}
              </label>
              {authMode === 'login' && (
                <button
                  type="button"
                  onClick={() => setAuthMode('reset')}
                  className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full py-2.5 font-medium mt-2"
            isLoading={loading}
          >
            {authMode === 'login' && 'Sign In'}
            {authMode === 'register' && 'Create Account'}
            {authMode === 'reset' && 'Update Password & Sign In'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;
