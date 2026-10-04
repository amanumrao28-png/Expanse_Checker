import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  Sun,
  Moon,
  GraduationCap,
  Sparkles,
  Wallet,
  Settings,
  Receipt,
  LayoutDashboard,
  PieChart,
  ShieldCheck,
  Bot,
  Database,
  User,
  LogOut,
  LogIn
} from 'lucide-react';
import { useExpenses } from '../context/ExpenseContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const DRAWER_LINKS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/expenses', label: 'Expenses', icon: Receipt },
  { to: '/analytics', label: 'Analytics', icon: PieChart },
  { to: '/budget', label: 'Budget Management', icon: Wallet },
  { to: '/ai-assistant', label: 'AI Assistant', icon: Sparkles, badge: 'Gemma 3' },
  { to: '/settings', label: 'Settings', icon: Settings },
];

const TopHeader = ({ onOpenAddExpense }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();
  const { dataSource } = useExpenses();
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();
  const location = useLocation();

  // Route title mapping
  const routeTitles = {
    '/': 'Financial Overview',
    '/expenses': 'Expenses & Transactions',
    '/analytics': 'Analytics & Reporting',
    '/budget': 'Budget Management',
    '/ai-assistant': 'Gemma AI Financial Assistant',
    '/settings': 'Application Settings',
    '/add-expense': 'Record New Expense'
  };

  const currentTitle = routeTitles[location.pathname] || 'Student Expense AI';

  return (
    <>
      <header
        className={`
          sticky top-0 z-30 w-full border-b backdrop-blur-xl transition-all duration-300
          ${
            isDark
              ? 'bg-[#070b14]/85 border-white/[0.08]'
              : 'bg-white/85 border-slate-200/80 shadow-sm'
          }
        `}
      >
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-18">
            
            {/* Left: Mobile Brand OR Desktop Page Title */}
            <div className="flex items-center gap-3">
              {/* Mobile Brand */}
              <div className="flex md:hidden items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 p-[1px] shadow-sm">
                  <div className="w-full h-full bg-[#080d1a] rounded-[11px] flex items-center justify-center">
                    <GraduationCap className="w-4 h-4 text-cyan-400" />
                  </div>
                </div>
                <span className={`text-base font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Student <span className="text-gradient-cyan-blue">AI</span>
                </span>
              </div>

              {/* Desktop & Tablet Title */}
              <div className="hidden md:block">
                <h1 className={`text-base lg:text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {currentTitle}
                </h1>
              </div>
            </div>

            {/* Right: Telemetry & Quick Controls */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* User Authentication Pill / Sign In button */}
              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <div
                    title={`Logged in as ${user?.email}`}
                    className={`
                      flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium
                      ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-100 border-slate-200 text-slate-800'}
                    `}
                  >
                    <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                      {(user?.full_name || user?.email || 'U')[0]}
                    </div>
                    <span className="hidden sm:inline font-semibold max-w-[100px] truncate">
                      {user?.full_name || user?.email?.split('@')[0]}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={logout}
                    title="Log Out"
                    aria-label="Log Out"
                    className={`
                      p-2 rounded-xl border transition-all duration-200 cursor-pointer
                      ${
                        isDark
                          ? 'bg-slate-900/80 border-slate-700/80 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10'
                          : 'bg-white border-slate-200 text-rose-600 hover:bg-rose-50'
                      }
                    `}
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => openAuthModal('login')}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              )}

              {/* Mobile Drawer Menu Toggle */}
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                aria-label="Open navigation menu"
                className={`
                  md:hidden p-2 rounded-xl border transition-all duration-200 cursor-pointer
                  ${
                    isDark
                      ? 'bg-slate-900/80 border-slate-700/80 text-slate-300 hover:text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                  }
                `}
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Slide-Over Drawer */}
      {isDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex animate-fade-in">
          {/* Backdrop */}
          <div
            onClick={() => setIsDrawerOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
          />

          {/* Drawer Content */}
          <div
            className={`
              relative w-4/5 max-w-xs h-full flex flex-col p-6 z-10 shadow-2xl transition-transform animate-slide-up
              ${
                isDark
                  ? 'bg-[#080d1b] border-r border-white/10 text-white'
                  : 'bg-white border-r border-slate-200 text-slate-900'
              }
            `}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-inherit">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 p-[1px]">
                  <div className="w-full h-full bg-[#080d1b] rounded-[11px] flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-cyan-400" />
                  </div>
                </div>
                <div>
                  <h3 className="font-extrabold text-sm tracking-tight">Student Expense AI</h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                aria-label="Close navigation menu"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Profile in Drawer */}
            <div className="py-3 border-b border-inherit">
              {isAuthenticated ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center text-xs font-bold text-white">
                      {(user?.full_name || user?.email || 'U')[0]}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{user?.full_name || 'Student'}</p>
                      <p className="text-[10px] text-slate-400 truncate max-w-[140px]">{user?.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={logout}
                    className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 text-xs font-semibold flex items-center gap-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Exit</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    openAuthModal('login');
                  }}
                  className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-2"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In / Register</span>
                </button>
              )}
            </div>

            {/* Nav Links */}
            <nav className="flex-1 py-4 space-y-1.5 overflow-y-auto">
              {DRAWER_LINKS.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.to;

                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => setIsDrawerOpen(false)}
                    className={`
                      flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all
                      ${
                        isActive
                          ? isDark
                            ? 'text-cyan-300 bg-cyan-500/10 border border-cyan-500/30'
                            : 'text-cyan-800 bg-cyan-50 border border-cyan-300/80 font-semibold'
                          : isDark
                            ? 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-cyan-400" />
                      <span>{link.label}</span>
                    </div>
                    {link.badge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {link.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>

            {/* Drawer Footer Status */}
            <div className="pt-4 border-t border-inherit text-xs space-y-2 text-slate-400">
              <div className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span>Supabase PostgreSQL Cloud</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TopHeader;
