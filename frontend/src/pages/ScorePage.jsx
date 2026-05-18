import React from 'react';
import axios from 'axios';
import { BarChart2, ChevronRight } from 'lucide-react';

export default function ScorePage({
  API_BASE, loading, setLoading, setError, showToast,
  gaps, opportunities, setOpportunities, setSummary, setStage
}) {
  const handleScore = async () => {
    setLoading(true);
    setError(null);
    showToast('Scoring opportunities...', 'loading');
    try {
      const res = await axios.post(`${API_BASE}/agents/opportunities/score`);
      const oppRes = await axios.get(`${API_BASE}/api/opportunities/ranked?limit=10`);
      const sumRes = await axios.get(`${API_BASE}/api/dashboard/summary`);
      setOpportunities(oppRes.data);
      setSummary(sumRes.data);
      showToast(`✓ Ranked ${res.data.opportunities_created} opportunities`);
      setTimeout(() => setStage('results'), 600);
    } catch (err) {
      setError(err.response?.data?.detail || 'Scoring failed');
      showToast('Scoring failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800">Opportunity Scoring</h2>
        <p className="text-slate-500 text-sm mt-1">
          Scoring {gaps.length} gaps across Market Potential, Execution Ease, Defensibility, and Timing.
        </p>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          {[
            { label: 'Market Potential', weight: '40%', desc: 'Frequency, personas, competitive intensity' },
            { label: 'Execution Ease',   weight: '30%', desc: 'Technical complexity, regulatory burden' },
            { label: 'Defensibility',    weight: '20%', desc: 'Data moat, patents, switching costs' },
            { label: 'Timing',           weight: '10%', desc: 'Market growth trend, competitor momentum' },
          ].map(d => (
            <div key={d.label} className="bg-slate-50 rounded-lg p-3">
              <div className="flex justify-between items-center mb-1">
                <p className="text-xs font-semibold text-slate-700">{d.label}</p>
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">{d.weight}</span>
              </div>
              <p className="text-xs text-slate-400">{d.desc}</p>
            </div>
          ))}
        </div>
        <button
          onClick={handleScore}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700
                     disabled:bg-slate-200 disabled:text-slate-400 text-white py-3
                     rounded-lg font-semibold text-sm transition-colors"
        >
          {loading ? '⟳ Scoring...' : <><BarChart2 size={15} /> Score All Opportunities <ChevronRight size={15} /></>}
        </button>
      </div>
    </div>
  );
}
