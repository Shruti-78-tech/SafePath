import React from 'react';
import {
  LayoutDashboard,
  Navigation,
  ShieldAlert,
  GitCompare,
  Bot,
  BarChart3,
  History,
  Info,
  Truck
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'planner', label: 'Route Planner', icon: Navigation },
  { id: 'risk', label: 'Risk Analysis', icon: ShieldAlert },
  { id: 'comparison', label: 'Route Comparison', icon: GitCompare },
  { id: 'explainability', label: 'Agent Explainability', icon: Bot },
  { id: 'evaluation', label: 'Model Evaluation', icon: BarChart3 },
  { id: 'history', label: 'Route History', icon: History },
  { id: 'about', label: 'About / Methodology', icon: Info }
];

export default function Sidebar({ activeTab, setActiveTab }) {
  return (
    <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col border-r border-slate-800 shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-white/10 p-1 border border-slate-700/70 shadow-md shadow-blue-500/10 flex items-center justify-center shrink-0">
            <img
              src="/safepath-logo.png"
              alt="SafePath Logo"
              className="w-full h-full object-contain filter drop-shadow"
            />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white tracking-wide flex items-center gap-1.5">
              <span>SafePath</span>
              <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 font-mono font-semibold px-1.5 py-0.5 rounded">AI</span>
            </h1>
            <p className="text-[11px] text-blue-400 font-mono font-medium">SIH 2026 • SIH26002</p>
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
          Risk-Aware Essential Supply Delivery Route Planning
        </p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
        <div className="flex items-center justify-between">
          <span className="font-medium text-slate-400">SafePath Engine</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
            Live Ready
          </span>
        </div>
      </div>
    </aside>
  );
}
