import React, { useState } from 'react';
import GlassCard from '../components/GlassCard';
import Button from '../components/Button';
import { useExpenses } from '../context/ExpenseContext';
import { formatCurrency } from '../utils/formatters';
import { CATEGORIES } from '../utils/categories';
import {
  GraduationCap,
  Shield,
  Save,
  RotateCcw,
  FileText
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

  const handleExportPdf = () => {
    const totalBudget = budgets?.total_budget ?? budgets?.monthlyTotal ?? 10000;
    const categoryBudgetsMap = budgets?.category_budgets ?? budgets?.categories ?? {};

    const categorySpentMap = {};
    expenses.forEach((e) => {
      const cat = (e.category || 'Other').trim();
      categorySpentMap[cat] = (categorySpentMap[cat] || 0) + (parseFloat(e.amount) || 0);
    });

    const totalSpent = Math.round(
      Object.values(categorySpentMap).reduce((s, a) => s + a, 0) * 100
    ) / 100;
    const remaining = Math.round((totalBudget - totalSpent) * 100) / 100;
    const percentageUsed = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 1000) / 10 : 0;

    const reportDate = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    // Category breakdown rows
    const categoryRows = CATEGORIES.map((cat) => {
      const limit = categoryBudgetsMap[cat.name] ?? categoryBudgetsMap[cat.id] ?? cat.defaultBudget ?? 1000;
      const spent = categorySpentMap[cat.name] ?? categorySpentMap[cat.id] ?? 0;
      const rem = Math.max(0, limit - spent);
      const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
      const statusColor = pct > 100 ? '#ef4444' : pct >= 80 ? '#f59e0b' : '#10b981';
      const statusText = pct > 100 ? 'Over Limit' : pct >= 80 ? 'Near Limit' : 'Safe';

      return `
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #1e293b;">${cat.name}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #334155;">${formatCurrency(limit)}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600; color: #0f172a;">${formatCurrency(spent)}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; color: ${rem >= 0 ? '#166534' : '#991b1b'};">${formatCurrency(rem)}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">
            <span style="display: inline-block; padding: 3px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; color: white; background-color: ${statusColor};">
              ${statusText} (${pct}%)
            </span>
          </td>
        </tr>
      `;
    }).join('');

    // Itemized transactions rows
    const transactionRows = expenses && expenses.length > 0
      ? expenses.map((e, idx) => {
          const formattedDate = e.date ? new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
          return `
            <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
              <td style="padding: 9px 12px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 12px;">${formattedDate}</td>
              <td style="padding: 9px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #0f172a; font-size: 13px;">${e.title || 'Untitled Expense'}</td>
              <td style="padding: 9px 12px; border-bottom: 1px solid #e2e8f0; color: #475569; font-size: 12px;">
                <span style="background: #f1f5f9; padding: 2px 8px; border-radius: 4px; font-weight: 500;">${e.category || 'Other'}</span>
              </td>
              <td style="padding: 9px 12px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 12px;">${e.payment_method || 'UPI / Cash'}</td>
              <td style="padding: 9px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700; color: #0f172a; font-size: 13px;">${formatCurrency(e.amount)}</td>
            </tr>
          `;
        }).join('')
      : `
        <tr>
          <td colspan="5" style="padding: 24px; text-align: center; color: #94a3b8; font-style: italic;">
            No transactions recorded yet in this account.
          </td>
        </tr>
      `;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Student Financial Statement - ${reportDate}</title>
        <style>
          @page {
            size: A4;
            margin: 15mm;
          }
          * {
            box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          }
          body {
            margin: 0;
            padding: 0;
            color: #0f172a;
            background: #ffffff;
            font-size: 13px;
            line-height: 1.5;
          }
          .header-box {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 3px solid #0284c7;
            padding-bottom: 16px;
            margin-bottom: 20px;
          }
          .title-area h1 {
            margin: 0;
            font-size: 24px;
            color: #0369a1;
            font-weight: 800;
            letter-spacing: -0.5px;
          }
          .title-area p {
            margin: 4px 0 0;
            color: #64748b;
            font-size: 12px;
          }
          .meta-area {
            text-align: right;
            font-size: 12px;
            color: #475569;
          }
          .profile-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px 16px;
            margin-bottom: 24px;
          }
          .profile-item label {
            display: block;
            font-size: 10px;
            text-transform: uppercase;
            color: #64748b;
            font-weight: 700;
            margin-bottom: 2px;
          }
          .profile-item span {
            font-size: 13px;
            font-weight: 600;
            color: #0f172a;
          }
          .summary-cards {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 28px;
          }
          .summary-card {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px;
            background: #ffffff;
          }
          .summary-card.primary {
            background: #f0f9ff;
            border-color: #bae6fd;
          }
          .summary-card label {
            display: block;
            font-size: 11px;
            color: #64748b;
            font-weight: 600;
            text-transform: uppercase;
          }
          .summary-card .value {
            font-size: 18px;
            font-weight: 800;
            color: #0f172a;
            margin-top: 4px;
          }
          .section-title {
            font-size: 14px;
            font-weight: 700;
            color: #0f172a;
            margin: 24px 0 10px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
            margin-bottom: 20px;
          }
          th {
            background-color: #f1f5f9;
            color: #334155;
            font-weight: 700;
            text-transform: uppercase;
            font-size: 11px;
            padding: 9px 12px;
            border-bottom: 2px solid #cbd5e1;
            text-align: left;
          }
          th.text-right { text-align: right; }
          th.text-center { text-align: center; }
          .footer-note {
            margin-top: 30px;
            padding-top: 12px;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            color: #94a3b8;
            font-size: 11px;
          }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header-box">
          <div class="title-area">
            <h1>STUDENT EXPENSE AI</h1>
            <p>Official Monthly Financial Statement & Expense Audit</p>
          </div>
          <div class="meta-area">
            <strong>Statement Date:</strong> ${reportDate}<br>
            <strong>Status:</strong> PostgreSQL Cloud Verified
          </div>
        </div>

        <div class="profile-grid">
          <div class="profile-item">
            <label>Institution</label>
            <span>${studentProfile.university || 'State University'}</span>
          </div>
          <div class="profile-item">
            <label>Major / Degree</label>
            <span>${studentProfile.major || 'Computer Science'}</span>
          </div>
          <div class="profile-item">
            <label>Academic Standing</label>
            <span>${studentProfile.year || 'Student'}</span>
          </div>
          <div class="profile-item">
            <label>Preferred Currency</label>
            <span>${studentProfile.currency || 'INR (₹)'}</span>
          </div>
        </div>

        <div class="summary-cards">
          <div class="summary-card primary">
            <label>Monthly Budget</label>
            <div class="value" style="color: #0284c7;">${formatCurrency(totalBudget)}</div>
          </div>
          <div class="summary-card">
            <label>Total Spent</label>
            <div class="value" style="color: #0f172a;">${formatCurrency(totalSpent)}</div>
          </div>
          <div class="summary-card">
            <label>Remaining Balance</label>
            <div class="value" style="color: ${remaining >= 0 ? '#16a34a' : '#dc2626'};">${formatCurrency(remaining)}</div>
          </div>
          <div class="summary-card">
            <label>Budget Used</label>
            <div class="value" style="color: ${percentageUsed > 100 ? '#dc2626' : '#4f46e5'};">${percentageUsed}%</div>
          </div>
        </div>

        <div class="section-title">
          <span>Category Quotas & Spending Breakdown</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th class="text-right">Budget Quota</th>
              <th class="text-right">Spent Amount</th>
              <th class="text-right">Remaining</th>
              <th class="text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            ${categoryRows}
          </tbody>
        </table>

        <div class="section-title">
          <span>Itemized Transactions History (${expenses.length} Records)</span>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 15%;">Date</th>
              <th style="width: 40%;">Expense Title</th>
              <th style="width: 15%;">Category</th>
              <th style="width: 15%;">Method</th>
              <th style="width: 15%; text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${transactionRows}
          </tbody>
        </table>

        <div class="footer-note">
          <span>Student Expense AI • Real-Time Financial Intelligence</span>
          <span>Confidential Personal Student Record</span>
        </div>
      </body>
      </html>
    `;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(htmlContent);
    doc.close();

    showToast('Generating official PDF statement...', 'info');

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 400);
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
            <p className="text-xs text-slate-400">Download complete financial statement in PDF format or restore seed data</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={handleExportPdf}
            variant="primary"
            icon={FileText}
            size="sm"
          >
            Download Financial Statement (PDF)
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
