import React from 'react';
import axios from 'axios';
import { Search, ChevronRight } from 'lucide-react';

export default function AnalyzePage({
  API_BASE, loading, setLoading, setError, showToast,
  painPoints, gaps, setGaps, setStage
}) {
  const handleIdentifyGaps = async () => {
    setLoading(true);
    setError(null);
    showToast('Running gap analysis via Groq...', 'loading');
    try {
      const res = await axios.post(`${API_BASE}/agents/gaps/identify`);
      const gapsRes = await axios.get(`${API_BASE}/api/gaps?limit=100`);
      setGaps(gapsRes.data);
      showToast(`✓ Identified ${res.data.gaps_identified} market gaps`);
      setTimeout(() => setStage('score'), 600);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to identify gaps');
      showToast('Gap identification failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const GAP_TYPE_COLORS = {
    'Complete gap':    'bg-rose-50 text-rose-700 border-rose-200',
    'Partial gap':     'bg-amber-50 text-amber-700 border-amber-200',
    'Competitive gap': 'bg-violet-50 text-violet-700 border-violet-200',
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800">Gap Identification</h2>
        <p className="text-slate-500 text-sm mt-1">
          Analyzing {painPoints.length} pain points against {5} competitor feature sets using Groq.
        </p>
      </div>

      {/* Action card */}
      {gaps.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
              <Search size={18} className="text-indigo-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-800">Ready to identify gaps</h3>
              <p className="text-slate-500 text-sm mt-1">
                Groq will cross-reference each pain point against competitor features and classify
                each as a Complete, Partial, or Competitive gap.
              </p>
            </div>
          </div>
          <button
            onClick={handleIdentifyGaps}
            disabled={loading}
            className="mt-5 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700
                       disabled:bg-slate-200 disabled:text-slate-400 text-white px-5 py-2.5
                       rounded-lg font-semibold text-sm transition-colors"
          >
            {loading ? '⟳ Analyzing...' : <><Search size={15} /> Identify Gaps</>}
            {!loading && <ChevronRight size={15} />}
          </button>
        </div>
      )}

      {/* Gaps table */}
      {gaps.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-700 text-sm">{gaps.length} Gaps Identified</h3>
          </div>
          {gaps.map((gap, i) => (
            <div key={gap.id} className={`px-5 py-3.5 flex items-start gap-3 ${i > 0 ? 'border-t border-slate-50' : ''}`}>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded border flex-shrink-0 mt-0.5
                ${GAP_TYPE_COLORS[gap.gap_type] || 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                {gap.gap_type}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800">{gap.name}</p>
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{gap.description}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-slate-700">{gap.severity_score?.toFixed(1)}</p>
                <p className="text-xs text-slate-400">severity</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
