import React, { useState } from 'react';
import GlassCard from '../components/GlassCard';
import Button from '../components/Button';
import { useExpenses } from '../context/ExpenseContext';
import {
  GraduationCap,
  Shield,
  Save,
  RotateCcw,
  Download
} from 'lucide-react';

const Settings = () => {
  const { expenses, budgets, showToast, refreshData } = useExpenses();

  const [studentProfile, setStudentProfile] = useState(() => {
    const saved = localStorage.getItem('student_profile');
    return saved ? JSON.parse(saved) : {
      university: 'State University',
      major: 'Computer Science',
      year: 'Junior Year (Class of 2027)',
      currency: 'INR (₹)',
    };
  });

  const handleSaveProfile = (e) => {
    e.preventDefault();
    localStorage.setItem('student_profile', JSON.stringify(studentProfile));
    window.dispatchEvent(new Event('currencyChange'));
    window.dispatchEvent(new Event('storage'));
    showToast(`Currency updated to ${studentProfile.currency}!`, 'success');
  };

  const handleExportData = () => {
    const backup = {
      expenses,
      budgets,
      studentProfile,
      exportedAt: new Date().toISOString()
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `student-expense-backup-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Financial backup downloaded', 'success');
  };

  const handleResetData = () => {
    if (window.confirm('Reset all expenses and budgets to original sample data?')) {
      localStorage.removeItem('student_expense_data');
      localStorage.removeItem('student_budget_data');
      refreshData();
      showToast('Reset to original sample data', 'info');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          System & Account Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Configure academic preferences and manage financial data
        </p>
      </div>

      {/* 1. Student Academic Profile */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Student Academic Profile</h2>
            <p className="text-xs text-slate-400">Personalize expense recommendations to your college lifecycle</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                University / College
              </label>
              <input
                type="text"
                value={studentProfile.university}
                onChange={(e) => setStudentProfile({ ...studentProfile, university: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                Degree / Major
              </label>
              <input
                type="text"
                value={studentProfile.major}
                onChange={(e) => setStudentProfile({ ...studentProfile, major: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                Academic Standing
              </label>
              <input
                type="text"
                value={studentProfile.year}
                onChange={(e) => setStudentProfile({ ...studentProfile, year: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                Preferred Currency
              </label>
              <select
                value={studentProfile.currency}
                onChange={(e) => setStudentProfile({ ...studentProfile, currency: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-white text-sm cursor-pointer"
              >
                <option value="USD ($)" className="bg-slate-900">USD ($)</option>
                <option value="EUR (€)" className="bg-slate-900">EUR (€)</option>
                <option value="GBP (£)" className="bg-slate-900">GBP (£)</option>
                <option value="CAD ($)" className="bg-slate-900">CAD ($)</option>
                <option value="INR (₹)" className="bg-slate-900">INR (₹)</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button type="submit" icon={Save} size="sm">
              Save Academic Profile
            </Button>
          </div>
        </form>
      </GlassCard>

      {/* 2. Data Management & Backup */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Data Privacy & Portability</h2>
            <p className="text-xs text-slate-400">Export your complete financial records or restore seed data</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={handleExportData}
            variant="secondary"
            icon={Download}
            size="sm"
          >
            Export JSON Backup
          </Button>

          <Button
            onClick={handleResetData}
            variant="danger"
            icon={RotateCcw}
            size="sm"
          >
            Reset to Sample Data
          </Button>
        </div>
      </GlassCard>
    </div>
  );
};

export default Settings;
