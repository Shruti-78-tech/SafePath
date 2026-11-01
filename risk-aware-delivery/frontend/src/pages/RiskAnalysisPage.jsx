import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Sliders,
  Search,
  Filter,
  BarChart2,
  Sparkles,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import RiskBadge from '../components/RiskBadge';
import { riskService, modelService } from '../services/api';

export default function RiskAnalysisPage() {
  const [segments, setSegments] = useState([]);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [loading, setLoading] = useState(true);

  // Feature Importance data
  const [features, setFeatures] = useState([]);

  // Sandbox prediction form
  const [rainfall, setRainfall] = useState(55.0);
  const [wind, setWind] = useState(40.0);
  const [temp, setTemp] = useState(24.0);
  const [incidents, setIncidents] = useState(3);
  const [roadType, setRoadType] = useState('secondary');
  const [roadLength, setRoadLength] = useState(1200);
  const [elevation, setElevation] = useState(450);
  const [floodSusc, setFloodSusc] = useState(0.65);

  const [sandboxResult, setSandboxResult] = useState(null);
  const [sandboxLoading, setSandboxLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [segData, featData] = await Promise.all([
        riskService.getSegments(),
        modelService.getFeatureImportance()
      ]);
      setSegments(segData.segments || []);
      setFeatures(featData.feature_importances || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    try {
      setSandboxLoading(true);
      const res = await riskService.predictRisk({
        rainfall_intensity_mmh: Number(rainfall),
        wind_speed_kmh: Number(wind),
        temperature_c: Number(temp),
        historical_incidents: Number(incidents),
        road_type: roadType,
        road_length_m: Number(roadLength),
        elevation_m: Number(elevation),
        flood_susceptibility: Number(floodSusc)
      });
      setSandboxResult(res.prediction);
    } catch (err) {
      console.error(err);
    } finally {
      setSandboxLoading(false);
    }
  };

  const handleToggleBlock = async (segId, isBlocked) => {
    try {
      await riskService.toggleBlock(segId, isBlocked);
      const segData = await riskService.getSegments();
      setSegments(segData.segments || []);
    } catch (e) {
      console.error(e);
    }
  };

  const filteredSegments = segments.filter(s => {
    const matchesSearch =
      s.road_name.toLowerCase().includes(search.toLowerCase()) ||
      s.id.toLowerCase().includes(search.toLowerCase());
    if (filterCat === 'all') return matchesSearch;
    if (filterCat === 'blocked') return matchesSearch && s.is_blocked;
    return matchesSearch && s.risk_category === Number(filterCat);
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Road Corridor Disruption Risk Analysis</h2>
        <p className="text-xs text-slate-500">
          Inspection of segment classifications, feature importances, and interactive ML inference sandbox
        </p>
      </div>

      {/* Top: Feature Importance Chart & Sandbox Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Feature Importance Bar Chart */}
        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-800 flex items-center space-x-2">
                <BarChart2 className="w-4 h-4 text-blue-600" />
                <span>Feature Importance Ranking</span>
              </h3>
              <p className="text-xs text-slate-500">Gini impurity reduction across Random Forest trees</p>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-semibold">
              Top Predictors
            </span>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={features.slice(0, 7)}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 90, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" unit="%" tick={{ fontSize: 11 }} />
                <YAxis dataKey="feature" type="category" tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Bar dataKey="percentage" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Interactive ML Risk Sandbox */}
        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-800 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Interactive ML Risk Estimator</span>
              </h3>
              <p className="text-xs text-slate-500">Test real-time inference on arbitrary road parameters</p>
            </div>
          </div>

          <form onSubmit={handlePredict} className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-semibold text-slate-600 block mb-1">Precipitation (mm/h): {rainfall}</label>
                <input
                  type="range"
                  min="0"
                  max="150"
                  value={rainfall}
                  onChange={(e) => setRainfall(e.target.value)}
                  className="w-full accent-blue-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-600 block mb-1">Wind Velocity (km/h): {wind}</label>
                <input
                  type="range"
                  min="0"
                  max="120"
                  value={wind}
                  onChange={(e) => setWind(e.target.value)}
                  className="w-full accent-teal-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-600 block mb-1">Road Classification</label>
                <select
                  value={roadType}
                  onChange={(e) => setRoadType(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white"
                >
                  {['motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'residential'].map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-600 block mb-1">Flood Susceptibility: {(floodSusc * 100).toFixed(0)}%</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={floodSusc}
                  onChange={(e) => setFloodSusc(e.target.value)}
                  className="w-full accent-blue-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-600 block mb-1">Elevation (meters): {elevation}</label>
                <input
                  type="range"
                  min="20"
                  max="2500"
                  step="50"
                  value={elevation}
                  onChange={(e) => setElevation(e.target.value)}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-600 block mb-1">Historical Incidents: {incidents}</label>
                <input
                  type="range"
                  min="0"
                  max="12"
                  value={incidents}
                  onChange={(e) => setIncidents(e.target.value)}
                  className="w-full accent-amber-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={sandboxLoading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center justify-center space-x-2 transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Run Model Inference</span>
            </button>
          </form>

          {/* Sandbox Prediction Result */}
          {sandboxResult && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Predicted Classification:</span>
                <RiskBadge
                  category={sandboxResult.risk_category}
                  label={sandboxResult.risk_label}
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Computed Disruption Hazard:</span>
                <span className="font-bold font-mono text-slate-800">
                  {(sandboxResult.risk_score * 100).toFixed(1)}%
                </span>
              </div>
              <div className="pt-1.5 border-t border-slate-200 text-[11px] font-mono flex justify-between text-slate-500">
                <span>Low: {(sandboxResult.probabilities.low * 100).toFixed(0)}%</span>
                <span>Medium: {(sandboxResult.probabilities.medium * 100).toFixed(0)}%</span>
                <span>High: {(sandboxResult.probabilities.high * 100).toFixed(0)}%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Road Network Segments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
        <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm text-slate-800">Network Road Segments Inventory</h3>
            <p className="text-xs text-slate-500">Live operational status and topological attributes</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search road name or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none w-48"
              />
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
              {[
                { id: 'all', label: 'All' },
                { id: '0', label: 'Low' },
                { id: '1', label: 'Medium' },
                { id: '2', label: 'High' },
                { id: 'blocked', label: 'Blocked' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilterCat(f.id)}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    filterCat === f.id
                      ? 'bg-white text-slate-800 shadow-sm font-semibold'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3">ID</th>
                <th className="px-5 py-3">Corridor Name</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Length</th>
                <th className="px-5 py-3">Speed</th>
                <th className="px-5 py-3">Flood Susc.</th>
                <th className="px-5 py-3">Past Incidents</th>
                <th className="px-5 py-3">ML Prediction</th>
                <th className="px-5 py-3">Simulate Closure</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSegments.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-5 py-3 font-mono font-bold text-slate-700">{s.id}</td>
                  <td className="px-5 py-3 font-semibold text-slate-800">{s.road_name}</td>
                  <td className="px-5 py-3 capitalize text-slate-600">{s.road_type}</td>
                  <td className="px-5 py-3 font-mono">{(s.length_m / 1000).toFixed(2)} km</td>
                  <td className="px-5 py-3 font-mono">{s.speed_limit_kmh} km/h</td>
                  <td className="px-5 py-3 font-mono text-blue-600">{(s.flood_susceptibility * 100).toFixed(0)}%</td>
                  <td className="px-5 py-3 font-mono text-amber-700">{s.historical_incidents}</td>
                  <td className="px-5 py-3">
                    <RiskBadge category={s.risk_category} label={s.risk_label} isBlocked={s.is_blocked} />
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => handleToggleBlock(s.id, !s.is_blocked)}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                        s.is_blocked
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-red-50 text-red-700 hover:bg-red-100'
                      }`}
                    >
                      {s.is_blocked ? 'Reopen' : 'Block'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
