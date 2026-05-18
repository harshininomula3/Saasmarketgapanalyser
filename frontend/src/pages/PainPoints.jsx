import React, { useEffect, useState } from 'react';
import api from '../api';

export default function PainPoints() {
  const [data, setData]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.painPoints()
      .then(r => setData(r.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = data.filter(pp =>
    pp.theme.toLowerCase().includes(search.toLowerCase()) ||
    pp.description.toLowerCase().includes(search.toLowerCase())
  );

  const severityColor = (s) => {
    if (s >= 8) return 'badge-rose';
    if (s >= 6) return 'badge-amber';
    return 'badge-emerald';
  };

  if (loading) return <div className="loading-overlay"><div className="spinner" /><span>Loading pain points…</span></div>;
  if (error)   return <div className="alert alert-error"><span>⚠️ {error}</span></div>;

  return (
    <div className="fade-in">
      <div className="section-header">
        <div>
          <div className="section-title">🎯 Pain Points</div>
          <div className="section-desc">{data.length} pain points extracted from survey data</div>
        </div>
        <input
          type="text"
          placeholder="Search themes…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
            padding: '8px 14px', fontSize: '0.85rem', outline: 'none', width: 220,
          }}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="alert alert-info">
          <span>No pain points found. Upload a CSV in the Analysis Pipeline tab.</span>
        </div>
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Theme</th>
                <th>Description</th>
                <th>Frequency</th>
                <th>Severity</th>
                <th>Personas</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((pp, i) => (
                <tr key={pp.id}>
                  <td style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{i + 1}</td>
                  <td>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.85rem' }}>
                      {pp.theme}
                    </span>
                  </td>
                  <td style={{ maxWidth: 320, fontSize: '0.8rem', lineHeight: 1.4 }}>
                    {pp.description.length > 100 ? pp.description.slice(0, 100) + '…' : pp.description}
                  </td>
                  <td>
                    <span className="badge badge-purple">{pp.frequency}</span>
                  </td>
                  <td>
                    <span className={`badge ${severityColor(pp.severity_score)}`}>
                      {pp.severity_score.toFixed(1)}/10
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {(pp.affected_personas || []).slice(0, 3).map(p => (
                        <span key={p} className="badge badge-cyan" style={{ fontSize: '0.68rem' }}>{p}</span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-purple" style={{ fontSize: '0.68rem' }}>{pp.source}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
