import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ExpenseProvider } from './context/ExpenseContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import BottomNav from './components/BottomNav';
import Toast from './components/Toast';
import Modal from './components/Modal';
import AuthModal from './components/AuthModal';

// Pages
import Dashboard from './pages/Dashboard';
import AddExpense from './pages/AddExpense';
import Expenses from './pages/Expenses';
import Analytics from './pages/Analytics';
import Budget from './pages/Budget';
import AIAssistant from './pages/AIAssistant';
import Settings from './pages/Settings';

function MainLayout() {
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const { isDark } = useTheme();

  return (
    <div
      className={`min-h-screen flex flex-row relative transition-colors duration-300 ${
        isDark
          ? 'bg-[#050811] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200'
          : 'bg-[#f8fafc] text-slate-900 selection:bg-cyan-500/30 selection:text-cyan-900'
      }`}
    >
      {/* Ambient Background Mesh Lights */}
      {isDark ? (
        <>
          <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-600/10 blur-[140px] pointer-events-none -z-10" />
          <div className="fixed top-[30%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/10 blur-[140px] pointer-events-none -z-10" />
          <div className="fixed bottom-[-10%] left-[20%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[150px] pointer-events-none -z-10" />
        </>
      ) : (
        <>
          <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-200/40 blur-[120px] pointer-events-none -z-10" />
          <div className="fixed top-[30%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-200/30 blur-[120px] pointer-events-none -z-10" />
          <div className="fixed bottom-[-10%] left-[20%] w-[500px] h-[500px] rounded-full bg-blue-200/30 blur-[120px] pointer-events-none -z-10" />
        </>
      )}

      {/* Responsive Sidebar: Full on Desktop (w-64), Compact on Tablet (w-20), Hidden on Mobile */}
      <Sidebar onOpenAddExpense={() => setIsAddExpenseModalOpen(true)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Top Header */}
        <TopHeader onOpenAddExpense={() => setIsAddExpenseModalOpen(true)} />

        {/* Viewport content */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-28 md:pb-12 page-transition">
          <Routes>
            <Route
              path="/"
              element={<Dashboard onOpenAddExpense={() => setIsAddExpenseModalOpen(true)} />}
            />
            <Route
              path="/add-expense"
              element={<AddExpense onComplete={() => {}} />}
            />
            <Route
              path="/expenses"
              element={<Expenses onOpenAddExpense={() => setIsAddExpenseModalOpen(true)} />}
            />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/budget" element={<Budget />} />
            <Route path="/ai-assistant" element={<AIAssistant />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer
          className={`border-t py-6 backdrop-blur-md transition-colors hidden sm:block ${
            isDark
              ? 'border-white/5 bg-[#04060c]/80 text-slate-500'
              : 'border-slate-200 bg-white/80 text-slate-500'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <p>
              Student Expense AI &copy; 2026 &mdash; Cloud edition connected to Supabase PostgreSQL.
            </p>
            <div className="flex items-center gap-4">
              <span className="hover:text-cyan-400 transition-colors">FastAPI Backend</span>
              <span>&bull;</span>
              <span className="hover:text-cyan-400 transition-colors">Supabase Cloud DB</span>
              <span>&bull;</span>
              <span className="hover:text-cyan-400 transition-colors">Ollama Gemma 3</span>
            </div>
          </div>
        </footer>

        {/* Mobile Sticky Bottom Navigation Bar */}
        <BottomNav onOpenAddExpense={() => setIsAddExpenseModalOpen(true)} />
      </div>

      {/* Global Quick Add Expense Modal */}
      <Modal
        isOpen={isAddExpenseModalOpen}
        onClose={() => setIsAddExpenseModalOpen(false)}
        title="Quick Add Expense"
        subtitle="Record an expenditure instantly with AI auto-categorization"
      >
        <AddExpense
          isModal={true}
          onComplete={() => setIsAddExpenseModalOpen(false)}
        />
      </Modal>

      {/* Global Auth Modal */}
      <AuthModal />

      {/* Global Toast Container */}
      <Toast />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ExpenseProvider>
          <BrowserRouter>
            <MainLayout />
          </BrowserRouter>
        </ExpenseProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
