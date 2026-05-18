import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import ConfigurePage from './pages/ConfigurePage';
import AnalyzePage from './pages/AnalyzePage';
import ScorePage from './pages/ScorePage';
import ResultsPage from './pages/ResultsPage';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8000';

const STAGES = [
  { id: 'configure', label: 'Configure Domain', icon: 'Settings', step: 1 },
  { id: 'analyze',   label: 'Identify Gaps',    icon: 'Search',   step: 2 },
  { id: 'score',     label: 'Score Opportunities', icon: 'BarChart2', step: 3 },
  { id: 'results',   label: 'View Results',     icon: 'Trophy',   step: 4 },
];

export default function App() {
  const [stage, setStage] = useState('configure');
  const [domainConfig, setDomainConfig] = useState(null);
  const [painPoints, setPainPoints] = useState([]);
  const [gaps, setGaps] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const stageProps = {
    API_BASE, loading, setLoading, error, setError, showToast,
    domainConfig, setDomainConfig,
    painPoints, setPainPoints,
    gaps, setGaps,
    opportunities, setOpportunities,
    summary, setSummary,
    setStage
  };

  const stageComplete = {
    configure: !!domainConfig,
    analyze: gaps.length > 0,
    score: opportunities.length > 0,
    results: opportunities.length > 0,
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        stages={STAGES}
        currentStage={stage}
        stageComplete={stageComplete}
        onNavigate={(s) => stageComplete[s] || s === 'configure' ? setStage(s) : null}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          domainConfig={domainConfig}
          stage={stage}
          toast={toast}
        />
        <main className="flex-1 overflow-y-auto p-8">
          {stage === 'configure' && <ConfigurePage {...stageProps} />}
          {stage === 'analyze'   && <AnalyzePage   {...stageProps} />}
          {stage === 'score'     && <ScorePage     {...stageProps} />}
          {stage === 'results'   && <ResultsPage   {...stageProps} />}
        </main>
      </div>
    </div>
  );
}
