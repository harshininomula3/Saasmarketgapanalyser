import React, { useEffect, useState } from 'react';
import api from '../api';

export default function Competitors() {
  const [data, setData]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.competitors()
      .then(r => { setData(r.data); if (r.data.length > 0) setSelected(r.data[0].id); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-overlay"><div className="spinner" /><span>Loading competitors…</span></div>;
  if (error)   return <div className="alert alert-error"><span>⚠️ {error}</span></div>;

  const active = data.find(c => c.id === selected);
  const features = active?.features || [];

  const tierColor = { Premium:'badge-purple', Enterprise:'badge-amber', Standard:'badge-cyan' };
  const catColor  = { Core:'badge-emerald', Advanced:'badge-purple', Analytics:'badge-cyan', Billing:'badge-amber' };

  return (
    <div className="fade-in">
      <div className="section-header">
        <div>
          <div className="section-title">🏢 Competitors</div>
          <div className="section-desc">{data.length} competitors mapped with feature coverage</div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'220px 1fr', gap:20 }}>
        {/* Sidebar list */}
        <div>
          {data.map(c => (
            <button key={c.id}
              className={`nav-item ${selected === c.id ? 'active' : ''}`}
              style={{ marginBottom:6 }}
              onClick={() => setSelected(c.id)}>
              <span className="nav-icon">🏢</span>
              <span>{c.name}</span>
            </button>
          ))}
        </div>

        {/* Feature panel */}
        {active && (
          <div className="card fade-in" style={{ padding:'22px 24px' }}>
            <div style={{ marginBottom:16 }}>
              <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:'1.15rem', marginBottom:4 }}>
                {active.name}
              </div>
              <a href={active.website} target="_blank" rel="noreferrer"
                style={{ color:'var(--cyan-light)', fontSize:'0.8rem', textDecoration:'none' }}>
                {active.website} ↗
              </a>
              {active.description && (
                <p style={{ marginTop:8, fontSize:'0.85rem', color:'var(--text-muted)' }}>{active.description}</p>
              )}
              <span className="badge badge-purple" style={{ marginTop:8 }}>{active.category}</span>
            </div>

            <div style={{ borderTop:'1px solid var(--border)', paddingTop:16 }}>
              <div style={{ fontSize:'0.8rem', fontWeight:600, color:'var(--text-muted)', marginBottom:12, textTransform:'uppercase', letterSpacing:'0.07em' }}>
                Features ({features.length})
              </div>

              {features.length === 0 ? (
                <div className="alert alert-info"><span>No features mapped for this competitor.</span></div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {features.map(f => (
                    <div key={f.id}
                      style={{ background:'var(--bg-surface)', borderRadius:'var(--radius-sm)', padding:'12px 16px', border:'1px solid var(--border)', transition:'all 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor='var(--border-hover)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4 }}>
                        <span style={{ fontWeight:600, fontSize:'0.88rem', color:'var(--text-primary)' }}>
                          {f.feature_name}
                        </span>
                        <div style={{ display:'flex', gap:6 }}>
                          <span className={`badge ${catColor[f.category] || 'badge-purple'}`} style={{ fontSize:'0.65rem' }}>{f.category}</span>
                          <span className={`badge ${tierColor[f.tier] || 'badge-cyan'}`} style={{ fontSize:'0.65rem' }}>{f.tier}</span>
                        </div>
                      </div>
                      <div style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>{f.description}</div>
                      <div style={{ marginTop:8 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4, fontSize:'0.7rem', color:'var(--text-muted)' }}>
                          <span>Confidence</span>
                          <span>{(f.confidence * 100).toFixed(0)}%</span>
                        </div>
                        <div className="score-bar-track">
                          <div className="score-bar-fill emerald" style={{ width:`${f.confidence * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
