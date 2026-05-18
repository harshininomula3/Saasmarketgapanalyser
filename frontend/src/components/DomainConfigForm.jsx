import React, { useState } from 'react';
import { Globe, Building2, Target, TrendingUp, Users, Sparkles } from 'lucide-react';

const DOMAIN_PRESETS = [
  { label: 'Expense Management SaaS', category: 'B2B expense tracking for mid-market', market: 'Finance teams at 100–2000 employee companies' },
  { label: 'HR & Recruiting Tech',     category: 'ATS and talent acquisition platform',  market: 'HR managers and recruiters at growing startups' },
  { label: 'Legal Tech',               category: 'Contract management and e-signature',   market: 'In-house legal teams and law firms' },
  { label: 'DevOps & Monitoring',      category: 'Observability and incident management', market: 'Platform engineering teams at tech companies' },
  { label: 'Healthcare SaaS',          category: 'Patient engagement and scheduling',      market: 'Clinical staff at outpatient practices and hospitals' },
];

export default function DomainConfigForm({ onSubmit, loading }) {
  const [form, setForm] = useState({
    domain: '',
    product_category: '',
    target_market: '',
    company_description: '',
    industry_tam_billions: 50,
    market_growth_rate: 12,
    pain_points_count: 8,
  });

  const applyPreset = (preset) => {
    setForm(f => ({
      ...f,
      domain: preset.label,
      product_category: preset.category,
      target_market: preset.market,
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: name.includes('_billions') || name.includes('_rate') || name === 'pain_points_count'
      ? parseFloat(value) : value }));
  };

  const handleSubmit = () => {
    if (!form.domain.trim() || !form.product_category.trim() || !form.target_market.trim()) {
      return;
    }
    onSubmit(form);
  };

  const isValid = form.domain.trim() && form.product_category.trim() && form.target_market.trim();

  return (
    <div className="max-w-2xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Define Your Product Domain</h2>
        <p className="text-slate-500 mt-1">
          Describe your product and market — our AI will generate realistic customer pain points
          from that domain. No CSV upload needed.
        </p>
      </div>

      {/* Quick Presets */}
      <div className="mb-6">
        <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-2">Quick Presets</p>
        <div className="flex flex-wrap gap-2">
          {DOMAIN_PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => applyPreset(p)}
              className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700
                         hover:border-indigo-300 border border-slate-200 rounded-full transition-colors text-slate-600"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-5">

        {/* Domain */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
            <Globe size={12} className="inline mr-1.5" /> Product Domain *
          </label>
          <input
            name="domain"
            value={form.domain}
            onChange={handleChange}
            placeholder="e.g. Expense Management SaaS"
            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800
                       placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Product Category */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
            <Building2 size={12} className="inline mr-1.5" /> Product Category *
          </label>
          <input
            name="product_category"
            value={form.product_category}
            onChange={handleChange}
            placeholder="e.g. B2B expense tracking platform for mid-market companies"
            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800
                       placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Target Market */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
            <Target size={12} className="inline mr-1.5" /> Target Market *
          </label>
          <input
            name="target_market"
            value={form.target_market}
            onChange={handleChange}
            placeholder="e.g. Finance teams at 100–2000 employee companies in North America"
            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800
                       placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Company Description (optional) */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
            <Users size={12} className="inline mr-1.5" /> Company Description <span className="text-slate-300 normal-case font-normal">(optional)</span>
          </label>
          <textarea
            name="company_description"
            value={form.company_description}
            onChange={handleChange}
            rows={2}
            placeholder="Brief description of your product or startup angle"
            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800
                       placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Market Parameters */}
        <div className="grid grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
              <TrendingUp size={12} className="inline mr-1.5" /> Industry TAM ($B)
            </label>
            <input
              type="number" name="industry_tam_billions"
              value={form.industry_tam_billions} onChange={handleChange}
              min={1} max={10000} step={1}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
              Growth Rate (%/yr)
            </label>
            <input
              type="number" name="market_growth_rate"
              value={form.market_growth_rate} onChange={handleChange}
              min={0} max={100} step={0.5}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
              Pain Points to Generate
            </label>
            <select
              name="pain_points_count"
              value={form.pain_points_count} onChange={handleChange}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {[5, 8, 10, 15, 20].map(n => (
                <option key={n} value={n}>{n} pain points</option>
              ))}
            </select>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            onClick={handleSubmit}
            disabled={!isValid || loading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700
                       disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed
                       text-white font-semibold py-3 rounded-lg transition-colors text-sm"
          >
            {loading
              ? <><span className="animate-spin">⟳</span> Generating Pain Points via AI...</>
              : <><Sparkles size={16} /> Fetch Pain Points with AI</>
            }
          </button>
          {!isValid && (
            <p className="text-xs text-slate-400 text-center mt-2">
              Fill in Domain, Product Category, and Target Market to continue.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
