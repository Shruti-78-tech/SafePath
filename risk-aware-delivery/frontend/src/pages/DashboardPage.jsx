import React, { useEffect, useState } from 'react';
import {
  Route,
  AlertTriangle,
  ShieldCheck,
  Clock,
  Compass,
  ArrowRight,
  TrendingDown,
  Activity,
  Layers
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { dashboardService } from '../services/api';

const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

export default function DashboardPage({ setActiveTab, onSelectHistoryRoute }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getStats();
      setStats(data);
    } catch (err) {
      setError('Unable to load live dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium text-slate-500">Loading emergency metrics...</span>
        </div>
      </div>
    );
  }

  const pieData = stats?.risk_distribution || [
    { name: 'Low Risk', count: 28, color: '#10b981' },
    { name: 'Medium Risk', count: 9, color: '#f59e0b' },
    { name: 'High Risk', count: 5, color: '#ef4444' }
  ];

  const barData = [
    { category: 'Low Risk', segments: stats?.low_risk_segment_count || 28, fill: '#10b981' },
    { category: 'Medium Risk', segments: stats?.medium_risk_segment_count || 9, fill: '#f59e0b' },
    { category: 'High Risk', segments: stats?.high_risk_segment_count || 5, fill: '#ef4444' }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase font-mono font-semibold tracking-wider text-blue-300">
              SafePath AI • SIH 2026 • Problem Statement SIH26002
            </span>
          </div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span>SafePath Emergency Logistics Operations Center</span>
          </h2>
          <p className="text-sm text-slate-300 max-w-2xl">
            Real-time hydro-meteorological risk estimation and A* optimization ensuring safe passage for disaster relief convoys.
          </p>
        </div>
        <button
          onClick={() => setActiveTab('planner')}
          className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 font-semibold text-sm rounded-xl shadow-lg shadow-blue-500/30 flex items-center space-x-2 transition"
        >
          <span>Plan Supply Route</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Route Requests</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Route className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-800">{stats?.total_route_requests || 0}</span>
            <p className="text-xs text-slate-500 mt-1">Logged in SQLite dispatch registry</p>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">High-Risk Segments</span>
            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-red-600">{stats?.high_risk_segment_count || 0}</span>
            <span className="text-xs text-slate-500 ml-1">/ {stats?.total_network_segments || 42} corridors</span>
            <p className="text-xs text-slate-500 mt-1">Severe flood / washout hazard</p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Corridor Safety Score</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-emerald-600">{stats?.average_safety_score || 85.0}</span>
            <span className="text-xs text-slate-500 ml-1">/ 100</span>
            <p className="text-xs text-slate-500 mt-1">Risk-mitigated mean score</p>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Disruption Risk</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-800">
              {((stats?.average_predicted_risk || 0.18) * 100).toFixed(1)}%
            </span>
            <p className="text-xs text-slate-500 mt-1">Random Forest probability</p>
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution Donut */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between border-b pb-3 mb-2">
            <div>
              <h3 className="font-bold text-sm text-slate-800">Network Segment Classification</h3>
              <p className="text-xs text-slate-500">Supervised Random Forest Predictions</p>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 bg-slate-100 rounded text-slate-600 font-semibold">
              {stats?.total_network_segments || 42} Corridors
            </span>
          </div>

          <div className="relative h-56 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData.map(d => ({ ...d, value: Math.max(d.count, 0) }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={62}
                  outerRadius={88}
                  paddingAngle={pieData.filter(d => d.count > 0).length > 1 ? 4 : 0}
                  dataKey="count"
                  isAnimationActive={true}
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color || COLORS[index % COLORS.length]}
                      stroke="#ffffff"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value} segments`, name]}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Center Summary Inside Donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-slate-800 font-mono">
                {stats?.total_network_segments || 42}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">Total Segments</span>
            </div>
          </div>

          {/* Clean Non-Overlapping Category Summary Cards */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
            {pieData.map((item, idx) => {
              const total = stats?.total_network_segments || 42;
              const pct = total > 0 ? ((item.count / total) * 100).toFixed(0) : 0;
              return (
                <div key={idx} className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-center">
                  <div className="flex items-center justify-center space-x-1.5 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                    <span className="text-[11px] font-medium text-slate-600">{item.name}</span>
                  </div>
                  <div className="text-base font-bold text-slate-800 font-mono">
                    {item.count}
                    <span className="text-[10px] text-slate-400 font-normal ml-1">({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bar Chart Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between border-b pb-3 mb-2">
            <div>
              <h3 className="font-bold text-sm text-slate-800">Risk Category Volume</h3>
              <p className="text-xs text-slate-500">Breakdown of Active Corridors</p>
            </div>
            <div className="flex items-center space-x-1 text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Safety Priority Active</span>
            </div>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }} barSize={44}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value) => [`${value} segments`, 'Count']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="segments" radius={[6, 6, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`bar-cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Context note below bar chart */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 px-1">
            <span>High Risk Threshold: Disruption Probability &ge; 65%</span>
            <span className="font-medium text-blue-600">Dynamic A* Avoidance</span>
          </div>
        </div>
      </div>

      {/* How SafePath Works - User Friendly Step Guide */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              <span>Quick Start: How to Use SafePath</span>
            </h3>
            <p className="text-xs text-slate-500">Three easy steps to dispatch essential disaster supplies safely</p>
          </div>
          <button
            onClick={() => setActiveTab('planner')}
            className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-xs transition flex items-center space-x-1"
          >
            <span>Open Planner</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start space-x-3">
            <span className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs shadow-xs">1</span>
            <div>
              <span className="font-bold text-slate-800 block text-xs">Choose Pickup & Destination</span>
              <p className="text-slate-500 text-[11px] mt-0.5 leading-relaxed">
                Pick an origin relief depot (ISBT / Rajpur) and a delivery point (AIIMS Trauma / Evac Shelter).
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start space-x-3">
            <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-xs shadow-xs">2</span>
            <div>
              <span className="font-bold text-slate-800 block text-xs">Select Policy & Weather</span>
              <p className="text-slate-500 text-[11px] mt-0.5 leading-relaxed">
                Choose <em>Safest</em> for maximum flood avoidance, or test live monsoon rain using the weather slider.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start space-x-3">
            <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs shadow-xs">3</span>
            <div>
              <span className="font-bold text-slate-800 block text-xs">Inspect Risk-Aware Path</span>
              <p className="text-slate-500 text-[11px] mt-0.5 leading-relaxed">
                View turn-by-turn routes on the interactive map, see avoided hazards, and review AI explanations.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Dispatches Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-800">Recent Supply Route Requests</h3>
            <p className="text-xs text-slate-500">History of agent-optimized emergency plans</p>
          </div>
          <button
            onClick={() => setActiveTab('history')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3">Origin</th>
                <th className="px-5 py-3">Destination</th>
                <th className="px-5 py-3">Profile</th>
                <th className="px-5 py-3">Distance</th>
                <th className="px-5 py-3">Travel Time</th>
                <th className="px-5 py-3">Safety Score</th>
                <th className="px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats?.recent_requests?.length > 0 ? (
                stats.recent_requests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3 font-medium text-slate-800">{r.origin_name || r.origin}</td>
                    <td className="px-5 py-3 font-medium text-slate-800">{r.destination_name || r.destination}</td>
                    <td className="px-5 py-3">
                      <span className="capitalize px-2 py-0.5 rounded font-medium bg-slate-100 text-slate-700">
                        {r.profile}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono font-medium">{r.recommended_dist_km} km</td>
                    <td className="px-5 py-3 font-mono">{r.recommended_time_min} min</td>
                    <td className="px-5 py-3">
                      <span className="font-bold text-emerald-600">{r.safety_score}/100</span>
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => {
                          if (onSelectHistoryRoute && r.raw_response) {
                            onSelectHistoryRoute(r.raw_response);
                          }
                          setActiveTab('planner');
                        }}
                        className="text-blue-600 hover:text-blue-800 font-semibold"
                      >
                        Inspect Route
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-6 text-center text-slate-400">
                    No route plans requested yet. Use the Route Planner to start.
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
