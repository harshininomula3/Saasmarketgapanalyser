import React from 'react';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

export default function TopBar({ domainConfig, stage, toast }) {
  const stageTitles = {
    configure: 'Configure Your Domain',
    analyze: 'Gap Identification',
    score: 'Opportunity Scoring',
    results: 'Analysis Results',
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center px-8 flex-shrink-0">
      <div className="flex-1">
        <h1 className="text-slate-800 font-semibold text-base">{stageTitles[stage]}</h1>
        {domainConfig && (
          <p className="text-slate-400 text-xs mt-0.5">{domainConfig.domain} · {domainConfig.target_market}</p>
        )}
      </div>

      {/* Toast notification */}
      {toast && (
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
          ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : toast.type === 'loading' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
            : 'bg-rose-50 text-rose-700 border border-rose-200'}`}
        >
          {toast.type === 'success' && <CheckCircle size={15} />}
          {toast.type === 'error'   && <XCircle size={15} />}
          {toast.type === 'loading' && <Loader size={15} className="animate-spin" />}
          {toast.msg}
        </div>
      )}
    </header>
  );
}
