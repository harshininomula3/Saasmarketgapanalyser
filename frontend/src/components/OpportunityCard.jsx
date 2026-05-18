import React, { useState } from 'react';
import { ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

const SCORE_COLOR = (s) =>
  s >= 75 ? 'bg-emerald-500' : s >= 55 ? 'bg-amber-400' : 'bg-rose-400';

const SCORE_TEXT = (s) =>
  s >= 75 ? 'text-emerald-600' : s >= 55 ? 'text-amber-600' : 'text-rose-600';

const THREAT_BADGE = {
  Low:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200',
  High:   'bg-rose-50 text-rose-700 border-rose-200',
};

const ScoreBar = ({ label, value, color }) => (
  <div className="space-y-1">
    <div className="flex justify-between items-center">
      <span className="text-xs text-slate-400 font-medium">{label}</span>
      <span className={`text-xs font-bold ${color}`}>{value?.toFixed(0)}</span>
    </div>
    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full ${SCORE_COLOR(value)}`}
        style={{ width: `${Math.min(value, 100)}%`, transition: 'width 0.6s ease' }}
      />
    </div>
  </div>
);

export default function OpportunityCard({ opportunity: opp, rank }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
      {/* Card Header */}
      <div className="flex items-start gap-4 p-5">
        {/* Rank + Score badge */}
        <div className="flex-shrink-0 text-center">
          <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center">
            <span className="text-slate-400 text-xs font-bold">#{rank}</span>
          </div>
        </div>

        {/* Title + key metrics */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-slate-800 text-base leading-snug truncate">{opp.name}</h3>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${THREAT_BADGE[opp.threat_level] || THREAT_BADGE.Medium}`}>
              {opp.threat_level} Threat
            </span>
            <span className="text-xs text-slate-400">TAM <strong className="text-slate-700">{opp.tam_estimate}</strong></span>
            <span className="text-xs text-slate-400">Y3 ARR <strong className="text-slate-700">{opp.year3_arr_estimate}</strong></span>
          </div>
        </div>

        {/* Overall score */}
        <div className="flex-shrink-0 text-right">
          <div className={`text-3xl font-black ${SCORE_TEXT(opp.overall_score)}`}>
            {opp.overall_score?.toFixed(1)}
          </div>
          <p className="text-xs text-slate-400">/ 100</p>
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-shrink-0 p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
        >
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {/* Score bars (always visible) */}
      <div className="px-5 pb-4 grid grid-cols-4 gap-4">
        <ScoreBar label="Market Potential" value={opp.market_potential_score} color={SCORE_TEXT(opp.market_potential_score)} />
        <ScoreBar label="Execution Ease" value={opp.execution_ease_score} color={SCORE_TEXT(opp.execution_ease_score)} />
        <ScoreBar label="Defensibility" value={opp.defensibility_score} color={SCORE_TEXT(opp.defensibility_score)} />
        <ScoreBar label="Timing" value={opp.timing_score} color={SCORE_TEXT(opp.timing_score)} />
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-slate-100 px-5 py-4 bg-slate-50 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-2">Implementation</p>
            <p className="text-slate-700"><span className="text-slate-400">Timeline:</span> {opp.estimated_effort_months} months</p>
            <p className="text-slate-700 mt-1"><span className="text-slate-400">Team:</span> {opp.estimated_team_size} engineers</p>
            <p className="text-slate-700 mt-1"><span className="text-slate-400">Cost:</span> ${(opp.estimated_cost_usd / 1000).toFixed(0)}K</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-2">Risk</p>
            <div className="flex gap-2 items-start">
              <AlertCircle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-slate-600 text-xs leading-relaxed">{opp.risk_summary}</p>
            </div>
          </div>
          {opp.target_personas?.length > 0 && (
            <div className="col-span-2">
              <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-2">Target Personas</p>
              <div className="flex flex-wrap gap-1.5">
                {opp.target_personas.map((p, i) => (
                  <span key={i} className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
