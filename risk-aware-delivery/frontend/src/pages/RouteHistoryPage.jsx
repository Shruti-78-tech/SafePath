import React, { useEffect, useState } from 'react';
import { History, Navigation, ArrowRight, Clock, ShieldCheck, RefreshCw } from 'lucide-react';
import { routeService } from '../services/api';

export default function RouteHistoryPage({ onSelectRoute, setActiveTab }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const res = await routeService.getHistory(30);
      setHistory(res.history || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Route Planning Audit History</h2>
          <p className="text-xs text-slate-500">
            Persistent log of past delivery recommendations saved in local SQLite storage
          </p>
        </div>

        <button
          onClick={loadHistory}
          disabled={loading}
          className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl flex items-center space-x-1.5 transition shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3">ID</th>
                <th className="px-5 py-3">Origin</th>
                <th className="px-5 py-3">Destination</th>
                <th className="px-5 py-3">Profile</th>
                <th className="px-5 py-3">Rec Distance</th>
                <th className="px-5 py-3">Base Distance</th>
                <th className="px-5 py-3">Travel Time</th>
                <th className="px-5 py-3">Safety Score</th>
                <th className="px-5 py-3">Policies</th>
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.length > 0 ? (
                history.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3 font-mono font-bold text-slate-400">#{item.id}</td>
                    <td className="px-5 py-3 font-semibold text-slate-800">{item.origin_name || item.origin}</td>
                    <td className="px-5 py-3 font-semibold text-slate-800">{item.destination_name || item.destination}</td>
                    <td className="px-5 py-3 capitalize">
                      <span className="px-2 py-0.5 rounded font-medium bg-slate-100 text-slate-700">
                        {item.profile}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono font-bold text-blue-600">
                      {item.recommended_dist_km} km
                    </td>
                    <td className="px-5 py-3 font-mono text-slate-500">
                      {item.baseline_dist_km} km
                    </td>
                    <td className="px-5 py-3 font-mono">
                      {item.recommended_time_min} min
                    </td>
                    <td className="px-5 py-3 font-mono font-bold text-emerald-600">
                      {item.safety_score}/100
                    </td>
                    <td className="px-5 py-3 font-mono">
                      {item.rules_count}
                    </td>
                    <td className="px-5 py-3 text-slate-400 font-mono text-[11px]">
                      {item.created_at}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => {
                          if (item.raw_response) {
                            onSelectRoute(item.raw_response);
                          }
                          setActiveTab('planner');
                        }}
                        className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-xs font-semibold flex items-center space-x-1"
                      >
                        <span>Open in Map</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="px-5 py-8 text-center text-slate-400">
                    No route history recorded yet. Execute a route plan to create records.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
