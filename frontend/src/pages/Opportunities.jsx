import React, { useEffect, useState } from 'react';
import api from '../api';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
} from 'recharts';

const threatColor = { Low: 'badge-emerald', Medium: 'badge-amber', High: 'badge-rose' };
const gapBadge    = { 'Complete gap':'badge-rose','Partial gap':'badge-amber','Competitive gap':'badge-cyan' };

function RadialScore({ value }) {
  const r = 38, circ = 2 * Math.PI * r, filled = (value / 100) * circ;
  return (
    <div className="radial-score">
      <svg width="90" height="90" viewBox="0 0 90 90">
        <circle cx="45" cy="45" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="7" />
        <circle cx="45" cy="45" r={r} fill="none" stroke="url(#sg2)" strokeWidth="7"
          strokeDasharray={`${filled} ${circ - filled}`} strokeLinecap="round" />
        <defs>
          <linearGradient id="sg2" x1="0%" y1="0%" x2="100%" y2="0%">
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

function ScoreBar({ label, value, color='purple' }) {
  return (
    <div style={{ marginBottom: 9 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
        <span style={{ fontSize:'0.76rem', color:'var(--text-muted)' }}>{label}</span>
        <span style={{ fontSize:'0.76rem', fontWeight:700, color:'var(--text-secondary)' }}>{Math.round(value)}</span>
      </div>
      <div className="score-bar-track">
        <div className={`score-bar-fill ${color}`} style={{ width:`${value}%` }} />
      </div>
    </div>
  );
}

function OppCard({ opp, rank }) {
  const [expanded, setExpanded] = useState(false);
  const radarData = [
    { axis: 'Market',    value: opp.market_potential_score },
    { axis: 'Execute',   value: opp.execution_ease_score },
    { axis: 'Defend',    value: opp.defensibility_score },
    { axis: 'Timing',    value: opp.timing_score },
  ];

  return (
    <div className="opp-card fade-in">
      <div className="opp-rank">#{rank} Opportunity</div>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 }}>
        <div style={{ flex:1 }}>
          <div className="opp-name">{opp.name?.replace('Opportunity: ','')}</div>
          <div className="opp-meta">
            <span className={`badge ${gapBadge[opp.gap_type] || 'badge-purple'}`}>{opp.gap_type}</span>
            <span className={`badge ${threatColor[opp.threat_level] || 'badge-amber'}`}>{opp.threat_level} threat</span>
            <span className="badge badge-cyan">TAM {opp.tam_estimate}</span>
          </div>
        </div>
        <RadialScore value={opp.overall_score} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px 20px', marginBottom:12 }}>
        <ScoreBar label="Market Potential" value={opp.market_potential_score} color="purple" />
        <ScoreBar label="Execution Ease"   value={opp.execution_ease_score}   color="cyan" />
        <ScoreBar label="Defensibility"    value={opp.defensibility_score}    color="emerald" />
        <ScoreBar label="Timing"           value={opp.timing_score}           color="amber" />
      </div>

      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12 }}>
        {opp.year3_arr_estimate && (
          <div style={{ background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:8, padding:'5px 11px', fontSize:'0.76rem' }}>
            <span style={{ color:'var(--text-muted)' }}>Yr3 ARR: </span>
            <span style={{ color:'var(--emerald-light)', fontWeight:700 }}>{opp.year3_arr_estimate}</span>
          </div>
        )}
        {opp.estimated_effort_months && (
          <div style={{ background:'rgba(124,58,237,0.08)', border:'1px solid rgba(124,58,237,0.2)', borderRadius:8, padding:'5px 11px', fontSize:'0.76rem' }}>
            <span style={{ color:'var(--text-muted)' }}>Build: </span>
            <span style={{ color:'var(--purple-light)', fontWeight:700 }}>{opp.estimated_effort_months}mo</span>
          </div>
        )}
        {opp.estimated_cost_usd && (
          <div style={{ background:'rgba(6,182,212,0.08)', border:'1px solid rgba(6,182,212,0.2)', borderRadius:8, padding:'5px 11px', fontSize:'0.76rem' }}>
            <span style={{ color:'var(--text-muted)' }}>Cost: </span>
            <span style={{ color:'var(--cyan-light)', fontWeight:700 }}>${(opp.estimated_cost_usd/1000).toFixed(0)}k</span>
          </div>
        )}
        {opp.direct_competitors_count !== undefined && (
          <div style={{ background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:8, padding:'5px 11px', fontSize:'0.76rem' }}>
            <span style={{ color:'var(--text-muted)' }}>Competitors: </span>
            <span style={{ color:'var(--amber-light)', fontWeight:700 }}>{opp.direct_competitors_count}</span>
          </div>
        )}
      </div>

      <button className="btn btn-secondary"
        style={{ width:'100%', justifyContent:'center', fontSize:'0.78rem', padding:'7px' }}
        onClick={() => setExpanded(e => !e)}>
        {expanded ? '▲ Hide Details' : '▼ Radar & Details'}
      </button>

      {expanded && (
        <div style={{ marginTop:14 }}>
          <div style={{ height:200 }}>
            <ResponsiveContainer>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.07)" />
                <PolarAngleAxis dataKey="axis" tick={{ fill:'var(--text-muted)', fontSize:11 }} />
                <Radar dataKey="value" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.25} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          {opp.risk_summary && (
            <div className="alert alert-info" style={{ marginTop:10, marginBottom:0 }}>
              <span>ℹ️</span><span>{opp.risk_summary}</span>
            </div>
          )}
          {opp.target_personas?.length > 0 && (
            <div style={{ marginTop:10 }}>
              <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.07em' }}>Target Personas</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                {opp.target_personas.map(p => <span key={p} className="badge badge-purple">{p}</span>)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Opportunities() {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [filter, setFilter]   = useState('All');

  useEffect(() => {
    api.opportunities(50)
      .then(r => setData(r.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const threats = ['All', 'Low', 'Medium', 'High'];
  const filtered = filter === 'All' ? data : data.filter(o => o.threat_level === filter);

  if (loading) return <div className="loading-overlay"><div className="spinner" /><span>Loading opportunities…</span></div>;
  if (error)   return <div className="alert alert-error"><span>⚠️ {error}</span></div>;

  return (
    <div className="fade-in">
      <div className="section-header">
        <div>
          <div className="section-title">💡 Opportunities</div>
          <div className="section-desc">{data.length} opportunities ranked by overall score</div>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {threats.map(t => (
            <button key={t}
              className={`btn ${filter === t ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding:'7px 14px', fontSize:'0.8rem' }}
              onClick={() => setFilter(t)}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="alert alert-info">
          <span>No opportunities found. Run the Analysis Pipeline first.</span>
        </div>
      ) : (
        <div className="opp-grid">
          {filtered.map((opp, i) => (
            <OppCard key={opp.id} opp={opp} rank={i + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
