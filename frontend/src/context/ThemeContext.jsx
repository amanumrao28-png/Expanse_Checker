import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  useEffect(() => {
    try {
      localStorage.setItem('student_expense_theme', 'dark');
    } catch (e) {
      console.warn('Failed to save theme preference', e);
    }

    const root = document.documentElement;
    root.classList.remove('light-theme');
    root.classList.add('dark');
  }, []);

  const toggleTheme = () => {};

  return (
    <ThemeContext.Provider value={{ theme: 'dark', isDark: true, toggleTheme, setTheme: () => {} }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
