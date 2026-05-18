import React from 'react';
import DashboardStats from '../components/DashboardStats';
import OpportunityCard from '../components/OpportunityCard';
import DownloadReportButton from '../components/DownloadReportButton';

export default function ResultsPage({
  API_BASE, opportunities, summary, domainConfig
}) {
  return (
    <div>
      {/* Page header with download button */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Analysis Complete</h2>
          <p className="text-slate-500 text-sm mt-1">
            {opportunities.length} ranked opportunities for <strong>{domainConfig?.domain}</strong>
          </p>
        </div>
        <DownloadReportButton API_BASE={API_BASE} />
      </div>

      {/* KPI Stats */}
      <DashboardStats summary={summary} />

      {/* Opportunities */}
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-widest">
            Ranked Opportunities
          </h3>
          <p className="text-xs text-slate-400">Sorted by Overall Score</p>
        </div>
        {opportunities.map((opp, idx) => (
          <OpportunityCard key={opp.id} opportunity={opp} rank={idx + 1} />
        ))}
      </div>
    </div>
  );
}
