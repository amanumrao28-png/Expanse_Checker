import React from 'react';
import GlassCard from './GlassCard';
import Button from './Button';
import { AlertCircle, RotateCcw } from 'lucide-react';

const ErrorState = ({
  title = 'Analytics API Connection Error',
  message = 'Failed to retrieve live financial analytics from the PostgreSQL backend.',
  onRetry
}) => {
  return (
    <GlassCard className="p-8 sm:p-10 border-rose-500/30 text-center max-w-xl mx-auto my-8 animate-fade-in shadow-xl">
      <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="w-7 h-7" />
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400 mb-6 leading-relaxed max-w-md mx-auto">{message}</p>
      {onRetry && (
        <Button
          onClick={onRetry}
          icon={RotateCcw}
          variant="secondary"
          size="sm"
        >
          Retry Connection
        </Button>
      )}
    </GlassCard>
  );
};

export default ErrorState;
