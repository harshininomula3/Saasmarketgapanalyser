import React, { useEffect, useState } from 'react';
import api from '../api';

const gapBadge = { 'Complete gap': 'badge-rose', 'Partial gap': 'badge-amber', 'Competitive gap': 'badge-cyan' };

export default function Gaps() {
  const [data, setData]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    api.gaps()
      .then(r => setData(r.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-overlay"><div className="spinner" /><span>Loading gaps…</span></div>;
  if (error)   return <div className="alert alert-error"><span>⚠️ {error}</span></div>;

  return (
    <div className="fade-in">
      <div className="section-header">
        <div>
          <div className="section-title">🔍 Market Gaps</div>
          <div className="section-desc">{data.length} gaps identified by Claude semantic analysis</div>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="alert alert-info">
          <span>No gaps yet. Run the Analysis Pipeline first.</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {data.map((gap, i) => (
            <div key={gap.id} className="card" style={{ padding: '18px 22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 700 }}>#{i + 1}</span>
                    <span className={`badge ${gapBadge[gap.gap_type] || 'badge-purple'}`}>{gap.gap_type}</span>
                  </div>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '0.97rem', marginBottom: 6 }}>
                    {gap.name}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 10 }}>
                    {gap.description}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Related pain point: <span style={{ color: 'var(--purple-light)' }}>{gap.pain_point_theme}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 160 }}>
                  <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                      Severity
                    </div>
                    <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: '1.4rem', color: gap.severity_score >= 8 ? 'var(--rose-light)' : gap.severity_score >= 6 ? 'var(--amber-light)' : 'var(--emerald-light)' }}>
                      {gap.severity_score.toFixed(1)}/10
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                      Market Coverage
                    </div>
                    <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: '1.2rem', color: 'var(--cyan-light)' }}>
                      {gap.coverage_percentage.toFixed(0)}%
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>addressed by competitors</div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                      Frequency
                    </div>
                    <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: '1.2rem', color: 'var(--purple-light)' }}>
                      {gap.market_frequency}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>mentions</div>
                  </div>
                </div>
              </div>

              {/* Coverage bar */}
              <div style={{ marginTop: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  <span>Competitor coverage</span>
                  <span>{gap.coverage_percentage.toFixed(0)}%</span>
                </div>
                <div className="score-bar-track">
                  <div
                    className="score-bar-fill cyan"
                    style={{ width: `${gap.coverage_percentage}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
