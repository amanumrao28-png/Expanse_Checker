import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  Plus,
  PieChart,
  Sparkles
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const BottomNav = ({ onOpenAddExpense }) => {
  const { isDark } = useTheme();
  const location = useLocation();

  const navItems = [
    { to: '/', label: 'Overview', icon: LayoutDashboard },
    { to: '/expenses', label: 'Expenses', icon: Receipt },
    { to: '/analytics', label: 'Analytics', icon: PieChart },
    { to: '/ai-assistant', label: 'Assistant', icon: Sparkles, isAi: true }
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className={`
        md:hidden fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-2xl transition-all pb-safe
        ${
          isDark
            ? 'bg-[#070b14]/90 border-white/[0.08] shadow-[0_-8px_24px_rgba(0,0,0,0.5)]'
            : 'bg-white/95 border-slate-200/80 shadow-[0_-8px_24px_rgba(15,23,42,0.06)]'
        }
      `}
    >
      <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto relative">
        {/* Tab 1: Dashboard */}
        <NavLink
          to="/"
          className={({ isActive }) => `
            flex flex-col items-center justify-center w-14 h-full gap-1 transition-all touch-manipulation
            ${
              isActive
                ? 'text-cyan-400 font-semibold'
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
            }
          `}
        >
          <LayoutDashboard className="w-5 h-5 shrink-0" />
          <span className="text-[10px] tracking-tight">Overview</span>
          {location.pathname === '/' && (
            <span className="w-1 h-1 rounded-full bg-cyan-400" />
          )}
        </NavLink>

        {/* Tab 2: Expenses */}
        <NavLink
          to="/expenses"
          className={({ isActive }) => `
            flex flex-col items-center justify-center w-14 h-full gap-1 transition-all touch-manipulation
            ${
              isActive
                ? 'text-cyan-400 font-semibold'
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
            }
          `}
        >
          <Receipt className="w-5 h-5 shrink-0" />
          <span className="text-[10px] tracking-tight">Expenses</span>
          {location.pathname === '/expenses' && (
            <span className="w-1 h-1 rounded-full bg-cyan-400" />
          )}
        </NavLink>

        {/* Center Floating Plus Button for Add Expense */}
        <div className="relative -top-3 flex items-center justify-center">
          <button
            type="button"
            onClick={onOpenAddExpense}
            aria-label="Add new expense"
            className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-cyan-500 via-sky-500 to-blue-600 text-white shadow-lg shadow-cyan-500/35 hover:shadow-cyan-500/50 active:scale-95 transition-all flex items-center justify-center border-2 border-[#070b14] cursor-pointer touch-manipulation"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Tab 3: Analytics */}
        <NavLink
          to="/analytics"
          className={({ isActive }) => `
            flex flex-col items-center justify-center w-14 h-full gap-1 transition-all touch-manipulation
            ${
              isActive
                ? 'text-cyan-400 font-semibold'
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
            }
          `}
        >
          <PieChart className="w-5 h-5 shrink-0" />
          <span className="text-[10px] tracking-tight">Analytics</span>
          {location.pathname === '/analytics' && (
            <span className="w-1 h-1 rounded-full bg-cyan-400" />
          )}
        </NavLink>

        {/* Tab 4: AI Assistant */}
        <NavLink
          to="/ai-assistant"
          className={({ isActive }) => `
            flex flex-col items-center justify-center w-14 h-full gap-1 transition-all touch-manipulation
            ${
              isActive
                ? 'text-purple-400 font-semibold'
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
            }
          `}
        >
          <div className="relative">
            <Sparkles className="w-5 h-5 shrink-0 text-purple-400" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
          </div>
          <span className="text-[10px] tracking-tight">Gemma AI</span>
          {location.pathname === '/ai-assistant' && (
            <span className="w-1 h-1 rounded-full bg-purple-400" />
          )}
        </NavLink>
      </div>
    </nav>
  );
};

export default BottomNav;
