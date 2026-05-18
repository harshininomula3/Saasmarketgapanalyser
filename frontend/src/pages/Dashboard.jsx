import React, { useEffect, useState } from 'react';
import api from '../api';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';

/* ── Helpers ─────────────────────────────────────────────────────────── */
const threatColor = { Low: 'badge-emerald', Medium: 'badge-amber', High: 'badge-rose' };
const gapTypeColor = {
  'Complete gap':    'badge-rose',
  'Partial gap':     'badge-amber',
  'Competitive gap': 'badge-cyan',
};

function RadialScore({ value }) {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const filled = (value / 100) * circ;
  return (
    <div className="radial-score">
      <svg width="90" height="90" viewBox="0 0 90 90">
        <circle cx="45" cy="45" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="7" />
        <circle
          cx="45" cy="45" r={r}
          fill="none"
          stroke="url(#scoreGrad)"
          strokeWidth="7"
          strokeDasharray={`${filled} ${circ - filled}`}
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>
      <div className="score-text">
        <span className="val">{Math.round(value)}</span>
        <span className="lbl">score</span>
      </div>
    </div>
  );
}

function ScoreBar({ label, value, color = 'purple' }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{label}</span>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
          {Math.round(value)}
        </span>
      </div>
      <div className="score-bar-track">
        <div className={`score-bar-fill ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function OppCard({ opp, rank }) {
  const [expanded, setExpanded] = useState(false);

  const radarData = [
    { axis: 'Market', value: opp.market_potential_score },
    { axis: 'Execution', value: opp.execution_ease_score },
    { axis: 'Defend', value: opp.defensibility_score },
    { axis: 'Timing', value: opp.timing_score },
  ];

  return (
    <div className="opp-card fade-in">
      <div className="opp-rank">#{rank} Opportunity</div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div className="opp-name">{opp.name?.replace('Opportunity: ', '')}</div>
          <div className="opp-meta">
            <span className={`badge ${gapTypeColor[opp.gap_type] || 'badge-purple'}`}>{opp.gap_type}</span>
            <span className={`badge ${threatColor[opp.threat_level] || 'badge-amber'}`}>
              {opp.threat_level} threat
            </span>
            <span className="badge badge-cyan">TAM {opp.tam_estimate}</span>
          </div>
        </div>
        <RadialScore value={opp.overall_score} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 20px', marginBottom: 14 }}>
        <ScoreBar label="Market Potential" value={opp.market_potential_score} color="purple" />
        <ScoreBar label="Execution Ease"   value={opp.execution_ease_score}   color="cyan" />
        <ScoreBar label="Defensibility"    value={opp.defensibility_score}    color="emerald" />
        <ScoreBar label="Timing"           value={opp.timing_score}           color="amber" />
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        {opp.year3_arr_estimate && (
          <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, padding: '6px 12px', fontSize: '0.78rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Yr3 ARR: </span>
            <span style={{ color: 'var(--emerald-light)', fontWeight: 700 }}>{opp.year3_arr_estimate}</span>
          </div>
        )}
        {opp.estimated_effort_months && (
          <div style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 8, padding: '6px 12px', fontSize: '0.78rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Build: </span>
            <span style={{ color: 'var(--purple-light)', fontWeight: 700 }}>{opp.estimated_effort_months}mo</span>
          </div>
        )}
        {opp.estimated_cost_usd && (
          <div style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: 8, padding: '6px 12px', fontSize: '0.78rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Cost: </span>
            <span style={{ color: 'var(--cyan-light)', fontWeight: 700 }}>
              ${(opp.estimated_cost_usd / 1000).toFixed(0)}k
            </span>
          </div>
        )}
      </div>

      <button
        className="btn btn-secondary"
        style={{ width: '100%', justifyContent: 'center', fontSize: '0.78rem', padding: '7px' }}
        onClick={() => setExpanded(e => !e)}
      >
        {expanded ? '▲ Hide Details' : '▼ Radar & Details'}
      </button>

      {expanded && (
        <div style={{ marginTop: 16, animation: 'fadeIn 0.25s ease' }}>
          <div className="chart-container" style={{ height: 200 }}>
            <ResponsiveContainer>
              <RadarChart data={radarData} margin={{ top: 0, bottom: 0, left: 0, right: 0 }}>
                <PolarGrid stroke="rgba(255,255,255,0.07)" />
                <PolarAngleAxis dataKey="axis" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <Radar name="Score" dataKey="value" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.25} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {opp.risk_summary && (
            <div className="alert alert-info" style={{ marginTop: 12, marginBottom: 0 }}>
              <span>ℹ️</span>
              <span>{opp.risk_summary}</span>
            </div>
          )}

          {opp.target_personas?.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Target Personas
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {opp.target_personas.map(p => (
                  <span key={p} className="badge badge-purple">{p}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Main Dashboard ──────────────────────────────────────────────────── */
export default function Dashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    api.dashboard()
      .then(r => setData(r.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="loading-overlay"><div className="spinner" /><span>Loading dashboard…</span></div>
  );
  if (error) return (
    <div className="alert alert-error"><span>⚠️</span><span>Failed to load dashboard: {error}</span></div>
  );

  const topOpps = data?.top_opportunities || [];

  const barData = topOpps.slice(0, 5).map((o, i) => ({
    name: `#${i + 1}`,
    score: Math.round(o.overall_score),
    market: Math.round(o.market_potential_score),
    execution: Math.round(o.execution_ease_score),
  }));

  return (
    <div className="fade-in">
      {/* Stats Row */}
      <div className="stats-grid">
        <div className="stat-card purple">
          <span className="stat-icon">🎯</span>
          <div className="stat-value">{data.total_pain_points}</div>
          <div className="stat-label">Pain Points Analyzed</div>
        </div>
        <div className="stat-card cyan">
          <span className="stat-icon">🏢</span>
          <div className="stat-value">{data.total_competitors}</div>
          <div className="stat-label">Competitors Mapped</div>
        </div>
        <div className="stat-card emerald">
          <span className="stat-icon">🔍</span>
          <div className="stat-value">{data.total_gaps_identified}</div>
          <div className="stat-label">Market Gaps Found</div>
        </div>
        <div className="stat-card amber">
          <span className="stat-icon">💡</span>
          <div className="stat-value">{data.total_opportunities}</div>
          <div className="stat-label">Opportunities Scored</div>
        </div>
        <div className="stat-card purple" style={{ gridColumn: 'span 1' }}>
          <span className="stat-icon">📈</span>
          <div className="stat-value" style={{ fontSize: '1.5rem' }}>{data.highest_tam_estimate}</div>
          <div className="stat-label">Top TAM Estimate</div>
        </div>
        <div className="stat-card cyan">
          <span className="stat-icon">⭐</span>
          <div className="stat-value" style={{ fontSize: '1.5rem' }}>
            {data.average_opportunity_score?.toFixed(1)}
          </div>
          <div className="stat-label">Avg Opportunity Score</div>
        </div>
      </div>

      {/* Score comparison chart */}
      {barData.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-title">📊 Top Opportunities — Score Breakdown</div>
          <div className="card-subtitle">Overall vs Market Potential vs Execution Ease</div>
          <div className="chart-container">
            <ResponsiveContainer>
              <BarChart data={barData} margin={{ top: 8, right: 16, bottom: 0, left: -10 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }}
                  labelStyle={{ color: 'var(--text-primary)' }}
                  itemStyle={{ color: 'var(--text-secondary)' }}
                />
                <Bar dataKey="score"     name="Overall"   fill="#7c3aed" radius={[4,4,0,0]} />
                <Bar dataKey="market"    name="Market"    fill="#06b6d4" radius={[4,4,0,0]} />
                <Bar dataKey="execution" name="Execution" fill="#10b981" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Opportunity cards */}
      {topOpps.length === 0 ? (
        <div className="alert alert-info">
          <span>💡</span>
          <span>No opportunities yet. Upload a CSV and run the analysis pipeline.</span>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 16 }}>
            <div className="section-title" style={{ fontSize: '1rem' }}>🏆 Top 5 Opportunities</div>
          </div>
          <div className="opp-grid">
            {topOpps.map((opp, i) => (
              <OppCard key={opp.id} opp={opp} rank={i + 1} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
