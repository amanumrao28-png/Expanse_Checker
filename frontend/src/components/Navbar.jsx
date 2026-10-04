import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  PieChart,
  Wallet,
  Sparkles,
  Settings,
  Plus,
  Menu,
  X,
  GraduationCap,
  Activity,
  Sun,
  Moon
} from 'lucide-react';
import Button from './Button';
import { useExpenses } from '../context/ExpenseContext';
import { useTheme } from '../context/ThemeContext';

const Navbar = ({ onOpenAddExpense }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { dataSource } = useExpenses();
  const { isDark, toggleTheme } = useTheme();

  const navLinks = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/expenses', label: 'Expenses', icon: Receipt },
    { to: '/analytics', label: 'Analytics', icon: PieChart },
    { to: '/budget', label: 'Budget', icon: Wallet },
    { to: '/ai-assistant', label: 'AI Assistant', icon: Sparkles, badge: 'Gemma' },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/8 bg-[#070b14]/80 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          
          {/* Brand Logo */}
          <NavLink to="/" className="flex items-center gap-3 group">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-purple-600 p-[1px] shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all duration-300 group-hover:scale-105">
              <div className="w-full h-full bg-[#090d1a] rounded-[11px] flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-cyan-400 group-hover:rotate-6 transition-transform" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg md:text-xl font-extrabold tracking-tight text-white">
                  Student Expense <span className="text-gradient-cyan-blue">AI</span>
                </span>
              </div>
              <span className="hidden sm:block text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                Financial Intelligence
              </span>
            </div>
          </NavLink>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) => `
                    relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs md:text-sm font-medium transition-all duration-200
                    ${isActive
                      ? 'text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 shadow-[0_0_15px_-3px_rgba(56,189,248,0.2)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {link.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Right Action Area */}
          <div className="flex items-center gap-3">
            {/* Backend connection indicator */}
            <div
              title={dataSource === 'backend' ? 'Connected to FastAPI PostgreSQL Backend' : 'Centralized API Layer: Ready to sync with FastAPI'}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-700/80 text-[11px] text-slate-400 font-medium"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{dataSource === 'backend' ? 'FastAPI Live' : 'API Ready'}</span>
            </div>

            {/* Quick Add Expense button */}
            <Button
              onClick={onOpenAddExpense || (() => navigate('/add-expense'))}
              icon={Plus}
              size="sm"
              className="hidden sm:inline-flex"
            >
              Add Expense
            </Button>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-800 bg-[#070b14]/95 backdrop-blur-2xl px-4 py-4 space-y-2 animate-fade-in">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) => `
                  flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all
                  ${isActive
                    ? 'text-cyan-300 bg-cyan-500/15 border border-cyan-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-cyan-400" />
                  <span>{link.label}</span>
                </div>
                {link.badge && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {link.badge}
                  </span>
                )}
              </NavLink>
            );
          })}

          <div className="pt-2">
            <Button
              onClick={() => {
                setMobileMenuOpen(false);
                if (onOpenAddExpense) onOpenAddExpense();
                else navigate('/add-expense');
              }}
              icon={Plus}
              className="w-full"
            >
              Add New Expense
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
