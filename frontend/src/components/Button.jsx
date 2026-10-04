import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loading = false,
  disabled = false,
  icon: Icon,
  className = '',
  onClick,
  type = 'button',
  ariaLabel,
  ...props
}) => {
  const isBusy = isLoading || loading;

  const baseStyles = 'relative inline-flex items-center justify-center font-semibold transition-all duration-200 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070b14] disabled:opacity-40 disabled:cursor-not-allowed select-none active:scale-[0.98] cursor-pointer touch-manipulation';

  const sizeStyles = {
    xs: 'text-xs px-2.5 py-1 gap-1.5 min-h-[32px]',
    sm: 'text-xs px-3.5 py-1.5 gap-1.5 min-h-[36px]',
    md: 'text-xs sm:text-sm px-4 py-2.5 gap-2 min-h-[42px]',
    lg: 'text-sm sm:text-base px-6 py-3.5 gap-2.5 min-h-[48px]'
  };

  const variantStyles = {
    primary: 'bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/35 border border-cyan-400/30 hover:border-cyan-300/50',
    purple: 'bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/35 border border-purple-400/30',
    secondary: 'bg-slate-800/80 hover:bg-slate-700/90 text-slate-200 border border-slate-700/80 hover:border-slate-500/80 hover:text-white backdrop-blur-md shadow-sm',
    danger: 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 hover:border-rose-500/50 shadow-sm',
    ghost: 'bg-transparent hover:bg-slate-800/60 text-slate-400 hover:text-slate-100 border border-transparent'
  };

  return (
    <button
      type={type}
      disabled={disabled || isBusy}
      onClick={onClick}
      aria-label={ariaLabel}
      className={`${baseStyles} ${sizeStyles[size] || sizeStyles.md} ${variantStyles[variant] || variantStyles.primary} ${className}`}
      {...props}
    >
      {isBusy ? (
        <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />
      ) : Icon ? (
        <Icon className={`${size === 'xs' || size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} shrink-0`} />
      ) : null}
      {children}
    </button>
  );
};

export default Button;
