import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import api from '../api';

function PipelineSteps({ currentStep }) {
  const steps = [
    'Upload CSV','Parse Points','Claude Analysis','Score Opps','Done!'
  ];
  return (
    <div className="pipeline-steps">
      {steps.map((s, i) => (
        <div className="pipeline-step" key={i}>
          <div className={`step-circle ${i < currentStep ? 'done' : i === currentStep ? 'active' : ''}`}>
            {i < currentStep ? '✓' : i + 1}
          </div>
          <div className="step-label">{s}</div>
        </div>
      ))}
    </div>
  );
}

const SAMPLE_CSV = `theme,description,frequency,severity_score,affected_personas,related_keywords,source
Manual Receipt Entry,Finance teams spend hours manually entering receipts into spreadsheets. No automated capture from photos.,342,8.5,"CFO,Finance Manager","receipt,ocr,automation",survey
Real-Time Budget Visibility,No real-time view of team spending against budgets. Overruns only discovered at month-end.,315,9.1,"CFO,VP Finance","budget,real-time,dashboard",survey
Employee Expense Policy Enforcement,No automated way to flag or block non-compliant submissions before approval.,256,8.0,"HR Manager,CFO","policy,compliance,enforcement",survey`;

export default function Analyze() {
  const [file, setFile]           = useState(null);
  const [step, setStep]           = useState(0);
  const [running, setRunning]     = useState(false);
  const [messages, setMessages]   = useState([]);
  const [uploadResult, setUpload] = useState(null);
  const [analyzeResult, setAnalysis] = useState(null);

  const addMsg = (type, text) =>
    setMessages(prev => [...prev, { type, text, id: Date.now() + Math.random() }]);

  const onDrop = useCallback((accepted) => {
    if (accepted.length > 0) {
      setFile(accepted[0]);
      setMessages([]); setUpload(null); setAnalysis(null); setStep(0);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'text/csv': ['.csv'] }, maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!file) return;
    setRunning(true); setMessages([]);
    try {
      setStep(1);
      addMsg('info', `Uploading "${file.name}"…`);
      const res = await api.uploadCSV(file);
      setUpload(res.data);
      setStep(2);
      addMsg('success', res.data.message);
    } catch (err) {
      addMsg('error', `Upload failed: ${err.response?.data?.detail || err.message}`);
      setStep(0);
    } finally { setRunning(false); }
  };

  const handleAnalyze = async () => {
    setRunning(true);
    try {
      setStep(3);
      addMsg('info', 'Running Claude gap analysis — this may take 30-90s…');
      const res = await api.analyze();
      setAnalysis(res.data);
      setStep(4);
      addMsg('success', res.data.message);
    } catch (err) {
      addMsg('error', `Analysis failed: ${err.response?.data?.detail || err.message}`);
    } finally { setRunning(false); }
  };

  const handleReset = async () => {
    if (!window.confirm('Delete all pain points, gaps and opportunities?')) return;
    try {
      await api.reset();
      setFile(null); setStep(0); setMessages([]);
      setUpload(null); setAnalysis(null);
      addMsg('success', 'Database cleared.');
    } catch (err) { addMsg('error', err.message); }
  };

  const downloadSample = (e) => {
    e.preventDefault();
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'sample_survey.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fade-in">
      <div className="section-header">
        <div>
          <div className="section-title">🚀 Analysis Pipeline</div>
          <div className="section-desc">Upload survey CSV → AI gap detection → Opportunity scoring</div>
        </div>
        <button className="btn btn-danger" onClick={handleReset}>🗑️ Reset Data</button>
      </div>

      <PipelineSteps currentStep={step} />

      {/* Step 1 */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-title">Step 1 — Upload Survey CSV</div>
        <div className="card-subtitle">Required columns: theme, description, frequency, severity_score, affected_personas, related_keywords</div>

        <div {...getRootProps()} className={`upload-zone ${isDragActive ? 'active' : ''}`}>
          <input {...getInputProps()} />
          <div className="upload-icon">{file ? '📄' : '📁'}</div>
          {file ? (
            <><div className="upload-title">{file.name}</div>
            <div className="upload-subtitle">{(file.size/1024).toFixed(1)} KB · Click to change</div></>
          ) : (
            <><div className="upload-title">Drop CSV here or click to browse</div>
            <div className="upload-subtitle">.csv files only</div></>
          )}
        </div>

        <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={handleUpload} disabled={!file || running}>
            {running && step === 1
              ? <><span className="spinner" style={{width:16,height:16}} /> Uploading…</>
              : '📤 Upload CSV'}
          </button>
          <button className="btn btn-secondary" onClick={downloadSample}>⬇️ Sample CSV</button>
        </div>
      </div>

      {/* Step 2 */}
      {uploadResult && (
        <div className="card fade-in" style={{ marginBottom: 20 }}>
          <div className="card-title">Step 2 — Run AI Gap Analysis</div>
          <div className="card-subtitle">Claude semantically matches pain points against competitor features, then scores each gap.</div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <div className="stat-card purple" style={{ flex: 1, minWidth: 130 }}>
              <div className="stat-value">{uploadResult.data?.inserted || 0}</div>
              <div className="stat-label">Pain points inserted</div>
            </div>
            <div className="stat-card cyan" style={{ flex: 1, minWidth: 130 }}>
              <div className="stat-value">{uploadResult.data?.skipped || 0}</div>
              <div className="stat-label">Duplicates skipped</div>
            </div>
          </div>

          <button className="btn btn-success" onClick={handleAnalyze} disabled={running} style={{ minWidth: 220 }}>
            {running && step >= 3 && step < 4
              ? <><span className="spinner" style={{width:16,height:16}} /> Analyzing…</>
              : '🤖 Run Full Analysis'}
          </button>
        </div>
      )}

      {/* Results */}
      {analyzeResult && (
        <div className="card fade-in" style={{ marginBottom: 20 }}>
          <div className="card-title">✅ Analysis Complete</div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
            <div className="stat-card emerald" style={{ flex: 1, minWidth: 130 }}>
              <div className="stat-value">{analyzeResult.data?.gaps_created || 0}</div>
              <div className="stat-label">Gaps identified</div>
            </div>
            <div className="stat-card amber" style={{ flex: 1, minWidth: 130 }}>
              <div className="stat-value">{analyzeResult.data?.opportunities_created || 0}</div>
              <div className="stat-label">Opportunities scored</div>
            </div>
          </div>
          <p style={{ marginTop: 14, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            View results in <strong style={{ color: 'var(--purple-light)' }}>Dashboard</strong> or <strong style={{ color: 'var(--cyan-light)' }}>Opportunities</strong> tabs.
          </p>
        </div>
      )}

      {/* Message log */}
      {messages.map(m => (
        <div key={m.id} className={`alert alert-${m.type === 'error' ? 'error' : m.type === 'success' ? 'success' : 'info'} fade-in`}>
          <span>{m.text}</span>
        </div>
      ))}
    </div>
  );
}
