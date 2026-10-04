import React from 'react';
import GlassCard from './GlassCard';

export const StatCardSkeleton = () => (
  <GlassCard className="p-5 md:p-6 animate-pulse border border-slate-800/80">
    <div className="flex items-center justify-between mb-4">
      <div className="h-3 w-24 bg-slate-800 rounded-full" />
      <div className="w-10 h-10 rounded-xl bg-slate-800/80" />
    </div>
    <div className="h-8 w-32 bg-slate-700/60 rounded-lg mb-3" />
    <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2">
      <div className="h-4 w-16 bg-slate-800/80 rounded" />
      <div className="h-3 w-20 bg-slate-800/60 rounded" />
    </div>
  </GlassCard>
);

export const ChartCardSkeleton = ({ height = 'h-80', className = '' }) => (
  <GlassCard className={`p-5 md:p-6 animate-pulse ${className} border border-slate-800/80`}>
    <div className="flex items-start justify-between mb-4">
      <div>
        <div className="h-4 w-36 bg-slate-700/60 rounded mb-2" />
        <div className="h-3 w-48 bg-slate-800/80 rounded" />
      </div>
      <div className="h-5 w-20 bg-slate-800 rounded-full" />
    </div>
    <div className={`w-full ${height} bg-slate-800/30 rounded-xl flex items-end p-4 gap-3`}>
      <div className="w-1/6 h-1/3 bg-slate-800/60 rounded-t" />
      <div className="w-1/6 h-2/3 bg-slate-800/60 rounded-t" />
      <div className="w-1/6 h-1/2 bg-slate-800/60 rounded-t" />
      <div className="w-1/6 h-4/5 bg-slate-800/60 rounded-t" />
      <div className="w-1/6 h-3/5 bg-slate-800/60 rounded-t" />
      <div className="w-1/6 h-2/5 bg-slate-800/60 rounded-t" />
    </div>
  </GlassCard>
);

export const TableRowSkeleton = () => (
  <div className="flex items-center justify-between p-4 border-b border-slate-800/50 animate-pulse">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-slate-800/80" />
      <div>
        <div className="h-4 w-32 bg-slate-700/60 rounded mb-1.5" />
        <div className="h-3 w-20 bg-slate-800/80 rounded" />
      </div>
    </div>
    <div className="h-4 w-20 bg-slate-800 rounded" />
    <div className="h-4 w-16 bg-slate-800 rounded" />
    <div className="h-5 w-20 bg-slate-700/60 rounded" />
  </div>
);

export default {
  StatCardSkeleton,
  ChartCardSkeleton,
  TableRowSkeleton
};
