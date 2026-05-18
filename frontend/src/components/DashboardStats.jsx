import React from 'react';
import { AlertTriangle, GitBranch, Zap, TrendingUp } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-start gap-4">
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
      <Icon size={18} className="text-white" />
    </div>
    <div>
      <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">{label}</p>
      <p className="text-2xl font-bold text-slate-800 mt-0.5">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

export default function DashboardStats({ summary }) {
  if (!summary) return null;
  return (
    <div className="grid grid-cols-4 gap-4 mb-8">
      <StatCard icon={AlertTriangle} label="Pain Points"
        value={summary.total_pain_points} sub="from domain analysis"
        color="bg-rose-500" />
      <StatCard icon={GitBranch} label="Market Gaps"
        value={summary.total_gaps_identified} sub="identified by AI"
        color="bg-amber-500" />
      <StatCard icon={Zap} label="Competitors"
        value={summary.total_competitors} sub="benchmarked"
        color="bg-violet-500" />
      <StatCard icon={TrendingUp} label="Avg Opp Score"
        value={`${(summary.average_opportunity_score || 0).toFixed(1)}`}
        sub="out of 100"
        color="bg-indigo-600" />
    </div>
  );
}
