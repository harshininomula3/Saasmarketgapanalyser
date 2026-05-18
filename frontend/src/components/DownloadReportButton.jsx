import React, { useState } from 'react';
import { FileDown, Loader, CheckCircle } from 'lucide-react';
import axios from 'axios';

export default function DownloadReportButton({ API_BASE }) {
  const [state, setState] = useState('idle'); // 'idle' | 'loading' | 'done' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  const handleDownload = async () => {
    setState('loading');
    setErrorMsg('');
    try {
      const response = await axios.get(`${API_BASE}/api/reports/generate`, {
        responseType: 'blob',
      });

      // Extract filename from Content-Disposition header if available
      const disposition = response.headers['content-disposition'];
      const match = disposition && disposition.match(/filename="(.+?)"/);
      const filename = match ? match[1] : 'gap_analysis_report.pdf';

      // Trigger download
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setState('done');
      setTimeout(() => setState('idle'), 3000);
    } catch (err) {
      setState('error');
      // Blob parsing workaround
      const errorText = await err.response?.data?.text?.() || err.message;
      let errMsg = 'Failed to generate report';
      try {
        const errJson = JSON.parse(errorText);
        errMsg = errJson.detail || errMsg;
      } catch (e) {}
      setErrorMsg(errMsg);
      setTimeout(() => setState('idle'), 4000);
    }
  };

  return (
    <div>
      <button
        onClick={handleDownload}
        disabled={state === 'loading'}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all
          ${state === 'idle'    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200'
          : state === 'loading' ? 'bg-indigo-400 text-white cursor-wait'
          : state === 'done'    ? 'bg-emerald-600 text-white'
          :                       'bg-rose-600 text-white'}`}
      >
        {state === 'idle'    && <><FileDown size={16} /> Download Full Report (PDF)</>}
        {state === 'loading' && <><Loader size={16} className="animate-spin" /> Generating Report...</>}
        {state === 'done'    && <><CheckCircle size={16} /> Report Downloaded!</>}
        {state === 'error'   && <>⚠ {errorMsg}</>}
      </button>
      <p className="text-xs text-slate-400 mt-1.5">
        Includes pain points, gaps, opportunities, TAM estimates & methodology
      </p>
    </div>
  );
}
