import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  PieChart,
  Wallet,
  Sparkles,
  Settings,
  Plus,
  GraduationCap,
  Activity,
  Sun,
  Moon,
  Bot,
  User,
  LogIn,
  LogOut
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/expenses', label: 'Expenses', icon: Receipt },
  { to: '/analytics', label: 'Analytics', icon: PieChart },
  { to: '/budget', label: 'Budget', icon: Wallet },
  { to: '/ai-assistant', label: 'AI Assistant', icon: Sparkles, badge: 'Gemma' },
  { to: '/settings', label: 'Settings', icon: Settings },
];

const Sidebar = ({ onOpenAddExpense }) => {
  const { isDark, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();
  const location = useLocation();

  return (
    <aside
      className={`
        hidden md:flex flex-col shrink-0 border-r transition-all duration-300 z-30 select-none
        w-20 lg:w-64 h-screen sticky top-0
        ${
          isDark
            ? 'bg-[#070b14]/95 border-white/[0.08] text-slate-200'
            : 'bg-white/95 border-slate-200/80 text-slate-800 shadow-sm'
        }
      `}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-18 px-4 lg:px-6 border-b border-inherit">
        <NavLink to="/" className="flex items-center gap-3 group focus:outline-none">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-500 to-purple-600 p-[1.5px] shadow-lg shadow-cyan-500/10 transition-transform duration-300 group-hover:scale-105">
            <div className="w-full h-full bg-[#080d1a] rounded-[14px] flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-white">Student</span>
              <span className="text-gradient-cyan-blue font-extrabold text-base">AI</span>
            </div>
          </div>
        </NavLink>
      </div>

      {/* Quick Add CTA Button */}
      <div className="p-3 lg:p-4">
        <button
          type="button"
          onClick={onOpenAddExpense}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white font-semibold text-xs shadow-md shadow-blue-500/20 hover:shadow-blue-500/35 transition-all duration-200 cursor-pointer active:scale-95 group focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          <Plus className="w-4 h-4 transition-transform duration-300 group-hover:rotate-90" />
          <span className="hidden lg:inline">Add Expense</span>
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-2.5 lg:px-3 py-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              title={item.label}
              className={`
                relative flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group
                ${
                  isActive
                    ? isDark
                      ? 'text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                      : 'text-cyan-800 bg-cyan-50 border border-cyan-300 font-bold shadow-xs'
                    : isDark
                      ? 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }
              `}
            >
              <Icon
                className={`
                  w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110
                  ${isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'}
                `}
              />
              <span className="hidden lg:inline truncate">{item.label}</span>

              {/* Badge if present */}
              {item.badge && (
                <span className="hidden lg:inline-block ml-auto text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {item.badge}
                </span>
              )}

              {/* Active Left Indicator Bar on Desktop */}
              {isActive && (
                <span className="hidden lg:block absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-cyan-400" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Footer Section */}
      <div className="p-3 lg:p-4 border-t border-inherit space-y-2.5">
        {/* User Profile Card */}
        {isAuthenticated ? (
          <div
            className={`
              flex items-center justify-between p-2 rounded-xl border text-[11px]
              ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'}
            `}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center text-[10px] font-bold text-white uppercase shrink-0">
                {(user?.full_name || user?.email || 'U')[0]}
              </div>
              <div className="hidden lg:block truncate">
                <p className="font-bold text-white truncate text-xs">{user?.full_name || 'Student'}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Log Out"
              className="p-1 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => openAuthModal('login')}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Sign In / Register</span>
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
