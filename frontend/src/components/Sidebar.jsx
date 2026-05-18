import React from 'react';
import { Settings, Search, BarChart2, Trophy, CheckCircle, Lock } from 'lucide-react';

const ICONS = { Settings, Search, BarChart2, Trophy };

export default function Sidebar({ stages, currentStage, stageComplete, onNavigate }) {
  return (
    <aside className="w-64 bg-slate-900 flex flex-col flex-shrink-0 h-full">
      {/* Logo / Brand */}
      <div className="px-6 py-5 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <BarChart2 size={16} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">Gap Analyzer</p>
            <p className="text-slate-400 text-xs mt-0.5">Market Intelligence</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest px-3 mb-3">
          Analysis Pipeline
        </p>
        {stages.map((s, index) => {
          const Icon = ICONS[s.icon];
          const isActive = currentStage === s.id;
          const isDone = stageComplete[s.id];
          const isLocked = !stageComplete[s.id] && s.id !== 'configure' &&
                           !stageComplete[stages[index - 1]?.id];

          return (
            <button
              key={s.id}
              onClick={() => !isLocked && onNavigate(s.id)}
              disabled={isLocked}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                ${isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40'
                  : isDone
                    ? 'text-emerald-400 hover:bg-slate-800'
                    : isLocked
                      ? 'text-slate-600 cursor-not-allowed'
                      : 'text-slate-300 hover:bg-slate-800'
                }`}
            >
              <span className="flex-shrink-0">
                {isDone && !isActive
                  ? <CheckCircle size={16} className="text-emerald-400" />
                  : isLocked
                    ? <Lock size={16} />
                    : <Icon size={16} />
                }
              </span>
              <span className="flex-1 text-left">{s.label}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded font-mono
                ${isActive ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                {s.step}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-700">
        <p className="text-slate-500 text-xs">Powered by Groq AI</p>
        <p className="text-slate-600 text-xs">Groq Llama3 · MVP v2.0</p>
      </div>
    </aside>
  );
}
