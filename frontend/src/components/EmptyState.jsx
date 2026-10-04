import React from 'react';
import { Sparkles, ReceiptText } from 'lucide-react';
import Button from './Button';

const EmptyState = ({
  icon: Icon = ReceiptText,
  title = 'No expenses yet',
  description = 'Start tracking your spending.',
  actionLabel,
  onAction
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 md:p-12 rounded-2xl glass-panel border border-dashed border-slate-700/60 max-w-lg mx-auto my-6 animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500/10 via-purple-500/10 to-blue-500/10 border border-cyan-500/20 flex items-center justify-center mb-4 text-cyan-400 shadow-inner">
        <Icon className="w-8 h-8 opacity-80" />
      </div>
      <h3 className="text-lg font-bold text-slate-100 mb-1">{title}</h3>
      <p className="text-sm text-slate-400 mb-6 max-w-sm">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} icon={Sparkles} size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
