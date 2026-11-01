import React from 'react';
import { ShieldCheck, AlertCircle, AlertTriangle, Ban } from 'lucide-react';

export default function RiskBadge({ category, label, isBlocked = false, size = 'sm' }) {
  if (isBlocked) {
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-900 text-white border border-slate-700">
        <Ban className="w-3 h-3 text-red-400" />
        <span>Road Blocked</span>
      </span>
    );
  }

  // 0: Low, 1: Medium, 2: High
  const cat = Number(category);

  if (cat === 2) {
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
        <AlertTriangle className="w-3 h-3 text-red-600" />
        <span>{label || 'High Risk'}</span>
      </span>
    );
  }

  if (cat === 1) {
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
        <AlertCircle className="w-3 h-3 text-amber-600" />
        <span>{label || 'Medium Risk'}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
      <ShieldCheck className="w-3 h-3 text-emerald-600" />
      <span>{label || 'Low Risk'}</span>
    </span>
  );
}
