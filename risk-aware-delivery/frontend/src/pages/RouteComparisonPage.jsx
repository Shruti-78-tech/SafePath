import React, { useState, useEffect } from 'react';
import {
  GitCompare,
  TrendingDown,
  Clock,
  Navigation,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { routeService } from '../services/api';
import RiskBadge from '../components/RiskBadge';

export default function RouteComparisonPage() {
  const [nodes, setNodes] = useState([]);
  const [origin, setOrigin] = useState('DEPOT_MAIN');
  const [destination, setDestination] = useState('HOSPITAL_AIIMS');
  const [profile, setProfile] = useState('safest');
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadNodes();
    executeCompare();
  }, []);

  const loadNodes = async () => {
    try {
      const data = await routeService.getNodes();
      setNodes(data.nodes || []);
    } catch (e) {
      console.error(e);
    }
  };

  const executeCompare = async () => {
    try {
      setLoading(true);
      const data = await routeService.compareRoutes({
        origin,
        destination,
        profile,
        weather_override: {
          rainfall_intensity_mmh: 80.0,
          wind_speed_kmh: 55.0,
          temperature_c: 24.0
        }
      });
      setComparisonData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const rec = comparisonData?.recommended_route;
  const base = comparisonData?.baseline_route;
  const comp = comparisonData?.comparison;

  const chartData = [
    {
      metric: 'Distance (km)',
      Recommended: rec?.total_distance_km || 0,
      Baseline: base?.total_distance_km || 0
    },
    {
      metric: 'Time (min)',
      Recommended: rec?.total_travel_time_min || 0,
      Baseline: base?.total_travel_time_min || 0
    },
    {
      metric: 'Safety Score (/100)',
      Recommended: rec?.safety_score_100 || 0,
      Baseline: base?.safety_score_100 || 0
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Route Comparison & Trade-Off Benchmarking</h2>
        <p className="text-xs text-slate-500">
          Side-by-side evaluation between Baseline Shortest Route and Risk-Mitigated Delivery Corridor
        </p>
      </div>

      {/* Control Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Origin</label>
            <select
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="text-xs font-medium p-2 rounded-lg border border-slate-300 bg-slate-50"
            >
              {nodes.map(n => (
                <option key={n.id} value={n.id}>{n.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Destination</label>
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="text-xs font-medium p-2 rounded-lg border border-slate-300 bg-slate-50"
            >
              {nodes.map(n => (
                <option key={n.id} value={n.id}>{n.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Target Profile</label>
            <select
              value={profile}
              onChange={(e) => setProfile(e.target.value)}
              className="text-xs font-medium p-2 rounded-lg border border-slate-300 bg-slate-50"
            >
              <option value="safest">Safest (Maximum Avoidance)</option>
              <option value="balanced">Balanced (Prudent Detour)</option>
              <option value="fastest">Fastest (Baseline)</option>
            </select>
          </div>
        </div>

        <button
          onClick={executeCompare}
          disabled={loading}
          className="w-full md:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center justify-center space-x-2 transition"
        >
          <GitCompare className="w-4 h-4" />
          <span>Recalculate Trade-Offs</span>
        </button>
      </div>

      {/* Comparison Scorecards */}
      {comp && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase">Distance Delta</span>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className={`text-2xl font-bold ${comp.delta_distance_km > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
                {comp.delta_distance_km > 0 ? `+${comp.delta_distance_km}` : comp.delta_distance_km} km
              </span>
              <span className="text-xs text-slate-500 font-mono">({comp.delta_distance_percentage}%)</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Rec: {rec?.total_distance_km} km vs Base: {base?.total_distance_km} km
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase">Travel Time Delta</span>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-slate-800">
                {comp.delta_travel_time_min > 0 ? `+${comp.delta_travel_time_min}` : comp.delta_travel_time_min} min
              </span>
              <span className="text-xs text-slate-500 font-mono">({comp.delta_travel_time_percentage}%)</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Rec: {rec?.total_travel_time_min} min vs Base: {base?.total_travel_time_min} min
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase">Risk Reduction</span>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-emerald-600">
                {comp.risk_reduction_percentage}%
              </span>
              <span className="text-xs text-emerald-600 font-semibold">safer</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Hazard Factor: {rec?.aggregate_risk_score} vs {base?.aggregate_risk_score}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase">Hazardous Roads Avoided</span>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-blue-600">
                {comp.high_risk_segments_avoided}
              </span>
              <span className="text-xs text-slate-500">corridors</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Safety Score: {base?.safety_score_100} → {rec?.safety_score_100}/100
            </p>
          </div>
        </div>
      )}

      {/* Comparison Chart & Detailed Explanations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Metric Bar Chart */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-800">Side-by-Side Metric Comparison</h3>
              <p className="text-xs text-slate-500">Quantitative evaluation between routes</p>
            </div>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="metric" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Recommended" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Baseline" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Explainability Breakdown */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="border-b pb-3">
            <h3 className="font-bold text-sm text-slate-800 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Safety Decision Justification</span>
            </h3>
            <p className="text-xs text-slate-500">Why was this detour selected?</p>
          </div>

          <div className="space-y-3 text-xs leading-relaxed text-slate-600">
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1">
              <span className="font-bold text-blue-900 block text-xs">
                {comparisonData?.explanation?.headline}
              </span>
              <p className="text-blue-800">
                {comparisonData?.explanation?.summary}
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <div className="flex items-center space-x-2 text-slate-700 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Trade-Off Analysis</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                <li>
                  <strong className="text-slate-800">Efficiency Cost:</strong> Convoy travels an extra{' '}
                  <span className="font-mono text-slate-900 font-semibold">{comp?.delta_distance_km} km</span> ({comp?.delta_travel_time_min} minutes).
                </li>
                <li>
                  <strong className="text-slate-800">Safety Dividend:</strong> Mitigates disruption exposure by{' '}
                  <span className="font-mono text-emerald-700 font-semibold">{comp?.risk_reduction_percentage}%</span>.
                </li>
                <li>
                  <strong className="text-slate-800">Critical Infrastructure:</strong> Avoids vulnerable lowland causeways prone to flash inundation during heavy precipitation events.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
