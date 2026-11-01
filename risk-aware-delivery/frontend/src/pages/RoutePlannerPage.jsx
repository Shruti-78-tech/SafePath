import React, { useState, useEffect } from 'react';
import {
  Navigation,
  Sliders,
  Shield,
  Zap,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  RotateCcw,
  Sparkles,
  Info,
  MapPin
} from 'lucide-react';
import MapComponent from '../components/MapComponent';
import RiskBadge from '../components/RiskBadge';
import { routeService, riskService } from '../services/api';

const PRESETS = [
  { name: 'AIIMS Trauma Center', badge: '🏥 Critical Emergency', desc: 'Direct hospital lifeline', origin: 'DEPOT_MAIN', destination: 'HOSPITAL_AIIMS' },
  { name: 'Maldevta Flood Evac', badge: '🌊 Flood Relief', desc: 'Monsoon evacuation corridor', origin: 'DEPOT_MAIN', destination: 'SHELTER_VALLEY' },
  { name: 'Jolly Grant Helipad', badge: '🚁 Air Supply', desc: 'Airlift emergency staging', origin: 'DEPOT_NORTH', destination: 'JUNCTION_K' },
  { name: 'Muni Ki Reti Shelter', badge: '⛺ Shelter Evacuation', desc: 'Disaster camp relief', origin: 'JUNCTION_A', destination: 'SHELTER_EAST' }
];

export default function RoutePlannerPage({ historyRouteResult = null }) {
  const [nodes, setNodes] = useState({});
  const [segments, setSegments] = useState([]);
  const [origin, setOrigin] = useState('DEPOT_MAIN');
  const [destination, setDestination] = useState('HOSPITAL_AIIMS');
  const [profile, setProfile] = useState('safest');

  // Weather simulation overrides
  const [useCustomWeather, setUseCustomWeather] = useState(false);
  const [rainfall, setRainfall] = useState(75.0);
  const [windSpeed, setWindSpeed] = useState(60.0);

  // Active roadblocks
  const [blockedSegments, setBlockedSegments] = useState([]);

  // Result state
  const [routeResult, setRouteResult] = useState(historyRouteResult);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadNetworkData();
  }, []);

  useEffect(() => {
    if (historyRouteResult) {
      setRouteResult(historyRouteResult);
      if (historyRouteResult.origin) setOrigin(historyRouteResult.origin);
      if (historyRouteResult.destination) setDestination(historyRouteResult.destination);
      if (historyRouteResult.profile) setProfile(historyRouteResult.profile);
    }
  }, [historyRouteResult]);

  const loadNetworkData = async () => {
    try {
      const [nodesData, segmentsData, blockedData] = await Promise.all([
        routeService.getNodes(),
        riskService.getSegments(),
        riskService.getBlockedSegments()
      ]);

      const nodeMap = {};
      nodesData.nodes.forEach(n => { nodeMap[n.id] = n; });
      setNodes(nodeMap);
      setSegments(segmentsData.segments || []);
      setBlockedSegments(blockedData.blocked_segment_ids || []);
    } catch (err) {
      setError('Failed to load road network data.');
    }
  };

  const handlePlanRoute = async () => {
    if (!origin || !destination) {
      setError('Please select both origin and destination.');
      return;
    }
    if (origin === destination) {
      setError('Origin and destination cannot be identical.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        origin,
        destination,
        profile,
        custom_blocked: blockedSegments,
        weather_override: useCustomWeather ? {
          rainfall_intensity_mmh: rainfall,
          wind_speed_kmh: windSpeed,
          temperature_c: 24.0
        } : null
      };

      const result = await routeService.planRoute(payload);
      setRouteResult(result);

      // Refresh segment predictions with current weather
      const updatedSegments = await riskService.getSegments(
        useCustomWeather ? { rainfall_override: rainfall, wind_override: windSpeed } : {}
      );
      setSegments(updatedSegments.segments || []);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to compute delivery route.');
    } finally {
      setLoading(false);
    }
  };

  const handleRunDemoScenario = async () => {
    const demoOrigin = 'DEPOT_MAIN';
    const demoDestination = 'HOSPITAL_AIIMS';
    const demoProfile = 'safest';
    const demoRainfall = 90.0;
    const demoWind = 65.0;

    setOrigin(demoOrigin);
    setDestination(demoDestination);
    setProfile(demoProfile);
    setUseCustomWeather(true);
    setRainfall(demoRainfall);
    setWindSpeed(demoWind);

    try {
      setLoading(true);
      setError(null);

      const payload = {
        origin: demoOrigin,
        destination: demoDestination,
        profile: demoProfile,
        custom_blocked: blockedSegments,
        weather_override: {
          rainfall_intensity_mmh: demoRainfall,
          wind_speed_kmh: demoWind,
          temperature_c: 24.0
        }
      };

      const result = await routeService.planRoute(payload);
      setRouteResult(result);

      const updatedSegments = await riskService.getSegments({
        rainfall_override: demoRainfall,
        wind_override: demoWind
      });
      setSegments(updatedSegments.segments || []);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to compute demo delivery route.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBlock = async (segmentId, isBlocked) => {
    try {
      await riskService.toggleBlock(segmentId, isBlocked);
      const updatedBlocked = isBlocked
        ? [...blockedSegments, segmentId]
        : blockedSegments.filter(id => id !== segmentId);
      setBlockedSegments(updatedBlocked);

      // Re-fetch segments
      const segmentsData = await riskService.getSegments();
      setSegments(segmentsData.segments || []);

      // If route is active, re-plan automatically
      if (routeResult) {
        setTimeout(handlePlanRoute, 100);
      }
    } catch (e) {
      setError('Failed to update road block status.');
    }
  };

  const handleSelectNode = (nodeId, type) => {
    if (type === 'origin') setOrigin(nodeId);
    if (type === 'destination') setDestination(nodeId);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Title & Preset Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <span>SafePath Route Planner & Dispatch</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-300">
                A* + RF Active
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select origin and destination to plan emergency supply convoy corridors avoiding floodways and washouts.
            </p>
          </div>

          {/* Quick 1-Click Demo Scenario Button */}
          <button
            onClick={handleRunDemoScenario}
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-500/20 flex items-center space-x-2 transition shrink-0"
          >
            <Sparkles className="w-4 h-4 animate-spin text-amber-200" />
            <span>⚡ 1-Click Flood Demo (River Detour)</span>
          </button>
        </div>

        {/* 3-Step Simple Guide Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center space-x-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
            <div className="min-w-0">
              <span className="font-semibold text-slate-800 block truncate">Select Locations</span>
              <span className="text-[10px] text-slate-400 truncate block">Choose depot & hospital</span>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
            <div className="min-w-0">
              <span className="font-semibold text-slate-800 block truncate">Choose Safety Policy</span>
              <span className="text-[10px] text-slate-400 truncate block">Fastest vs Balanced vs Safest</span>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
            <div className="min-w-0">
              <span className="font-semibold text-slate-800 block truncate">Find Safe Path</span>
              <span className="text-[10px] text-slate-400 truncate block">See risk-mitigated map & trade-off</span>
            </div>
          </div>
        </div>

        {/* Presets Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center space-x-1">
            <MapPin className="w-3.5 h-3.5 text-blue-500" />
            <span>Quick Scenarios:</span>
          </span>
          {PRESETS.map((p, i) => (
            <button
              key={i}
              onClick={() => {
                setOrigin(p.origin);
                setDestination(p.destination);
              }}
              className="px-3 py-1.5 text-xs rounded-xl font-medium bg-slate-50 border border-slate-200 text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition shadow-xs flex items-center space-x-1.5"
            >
              <span>{p.badge}</span>
              <span className="text-slate-400 font-normal">|</span>
              <span className="font-semibold">{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid: Left Controls, Right Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Controls */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-800 flex items-center space-x-2">
              <Navigation className="w-4 h-4 text-blue-600" />
              <span>Dispatch Parameters</span>
            </h3>

            {/* Origin */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Origin (Supply Staging / Depot)</span>
              </label>
              <select
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full text-xs font-medium p-2.5 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-500 focus:outline-none"
              >
                {Object.values(nodes).map(n => (
                  <option key={n.id} value={n.id}>
                    {n.name} ({n.id})
                  </option>
                ))}
              </select>
            </div>

            {/* Destination */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                <span>Destination (Hospital / Evac Shelter)</span>
              </label>
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full text-xs font-medium p-2.5 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-500 focus:outline-none"
              >
                {Object.values(nodes).map(n => (
                  <option key={n.id} value={n.id}>
                    {n.name} ({n.id})
                  </option>
                ))}
              </select>
            </div>

            {/* Profile Selection */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-semibold text-slate-600">Routing Policy Profile</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'fastest', label: 'Fastest', desc: 'Shortest time' },
                  { id: 'balanced', label: 'Balanced', desc: 'Prudent detour' },
                  { id: 'safest', label: 'Safest', desc: 'Max avoidance' }
                ].map(p => (
                  <button
                    key={p.id}
                    onClick={() => setProfile(p.id)}
                    className={`py-2 px-1 text-center rounded-lg border transition ${
                      profile === p.id
                        ? 'bg-blue-50 border-blue-600 text-blue-700 font-bold shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs">{p.label}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Simulation Weather Overrides (Accordion / Toggle) */}
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setUseCustomWeather(!useCustomWeather)}
                className="w-full flex items-center justify-between text-xs font-semibold text-slate-600 hover:text-blue-600"
              >
                <span className="flex items-center space-x-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Weather Hazard Simulation</span>
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                  useCustomWeather ? 'bg-indigo-100 text-indigo-700 font-bold' : 'bg-slate-100 text-slate-500'
                }`}>
                  {useCustomWeather ? 'Active' : 'Live Data'}
                </span>
              </button>

              {useCustomWeather && (
                <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between font-medium text-slate-600 mb-1">
                      <span>Rainfall Intensity:</span>
                      <span className="font-bold text-blue-600 font-mono">{rainfall} mm/h</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="150"
                      value={rainfall}
                      onChange={(e) => setRainfall(Number(e.target.value))}
                      className="w-full accent-blue-600"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                      <span>Clear (0)</span>
                      <span>Moderate (35)</span>
                      <span>Extreme (100+)</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-medium text-slate-600 mb-1">
                      <span>Wind Speed:</span>
                      <span className="font-bold text-teal-600 font-mono">{windSpeed} km/h</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="120"
                      value={windSpeed}
                      onChange={(e) => setWindSpeed(Number(e.target.value))}
                      className="w-full accent-teal-600"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Action Button */}
            <button
              onClick={handlePlanRoute}
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center space-x-2 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Calculating Safe Route...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Find Safe Delivery Path (A*)</span>
                </>
              )}
            </button>
          </div>

          {/* Active Closures Alert Box */}
          {blockedSegments.length > 0 && (
            <div className="p-4 bg-slate-900 text-white rounded-2xl text-xs space-y-2">
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center space-x-1.5 text-amber-400">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{blockedSegments.length} Roadblock(s) Active</span>
                </span>
                <button
                  onClick={async () => {
                    await riskService.clearBlocks();
                    setBlockedSegments([]);
                    const data = await riskService.getSegments();
                    setSegments(data.segments || []);
                    if (routeResult) handlePlanRoute();
                  }}
                  className="text-[10px] text-blue-400 hover:underline flex items-center space-x-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Clear All</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Segments excised: {blockedSegments.join(', ')}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Interactive Map */}
        <div className="lg:col-span-8 space-y-2.5">
          {/* Friendly Map Helper Banner */}
          <div className="p-2.5 px-3.5 bg-gradient-to-r from-blue-50/90 to-indigo-50/90 border border-blue-200/80 rounded-xl text-xs text-blue-900 flex items-center justify-between shadow-2xs">
            <div className="flex items-center space-x-2">
              <span className="px-1.5 py-0.5 bg-blue-600 text-white font-bold rounded text-[10px]">MAP GUIDE</span>
              <span className="text-slate-700">Click any <strong>road corridor</strong> to test a roadblock, or click any <strong>location circle</strong> to set start/end point.</span>
            </div>
            <span className="text-[11px] font-semibold text-blue-700 font-mono hidden sm:inline">
              Live Map
            </span>
          </div>

          <MapComponent
            nodes={nodes}
            segments={segments}
            recommendedRoute={routeResult?.recommended_route}
            baselineRoute={routeResult?.baseline_route}
            onToggleBlock={handleToggleBlock}
            onSelectNode={handleSelectNode}
            height="560px"
          />
        </div>
      </div>

      {/* Route Result & Decision Explanation Card */}
      {routeResult && (
        <div className="space-y-6">
          {/* Summary Metrics Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase">Recommended Distance</span>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className="text-2xl font-bold text-slate-800">
                  {routeResult.recommended_route?.total_distance_km || 0}
                </span>
                <span className="text-xs text-slate-500">km</span>
              </div>
              {routeResult.comparison?.delta_distance_km !== 0 && (
                <p className="text-xs text-slate-500 mt-1">
                  Baseline: {routeResult.baseline_route?.total_distance_km} km ({routeResult.comparison?.delta_distance_km > 0 ? `+${routeResult.comparison.delta_distance_km}` : routeResult.comparison?.delta_distance_km} km)
                </p>
              )}
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase">Estimated Travel Time</span>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className="text-2xl font-bold text-slate-800">
                  {routeResult.recommended_route?.total_travel_time_min || 0}
                </span>
                <span className="text-xs text-slate-500">min</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Avg Velocity: ~{((routeResult.recommended_route?.total_distance_km / Math.max(0.01, routeResult.recommended_route?.total_travel_time_min / 60))).toFixed(0)} km/h
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase">Route Safety Score</span>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className="text-2xl font-bold text-emerald-600">
                  {routeResult.recommended_route?.safety_score_100 || 0}
                </span>
                <span className="text-xs text-slate-500">/ 100</span>
              </div>
              <p className="text-xs text-emerald-600 font-semibold mt-1">
                Risk Factor: {routeResult.recommended_route?.aggregate_risk_score}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase">High Risk Corridors</span>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className="text-2xl font-bold text-red-600">
                  {routeResult.recommended_route?.high_risk_segment_count || 0}
                </span>
                <span className="text-xs text-slate-500">traversed</span>
              </div>
              <p className="text-xs text-blue-600 font-semibold mt-1">
                {routeResult.comparison?.high_risk_segments_avoided || 0} hazardous road(s) avoided
              </p>
            </div>
          </div>

          {/* Explanation Banner */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-6 rounded-2xl shadow-sm">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-blue-600 text-white rounded-lg mt-0.5">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-blue-950">
                  {routeResult.explanation?.headline || 'Agent Decision Summary'}
                </h4>
                <p className="text-xs text-blue-800 leading-relaxed">
                  {routeResult.explanation?.summary}
                </p>
                <p className="text-xs font-semibold text-blue-900 pt-1">
                  Key Takeaway: {routeResult.explanation?.key_takeaway}
                </p>
              </div>
            </div>
          </div>

          {/* Triggered Domain Rules */}
          {routeResult.triggered_rules?.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h4 className="font-bold text-sm text-slate-800 flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  <span>Rule Engine Reasoning Audit</span>
                </h4>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                  {routeResult.triggered_rules.length} Policies Active
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {routeResult.triggered_rules.map((rule, idx) => {
                  const isCrit = rule.severity === 'critical';
                  const isWarn = rule.severity === 'warning';

                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                        isCrit
                          ? 'bg-red-50/70 border-red-200'
                          : isWarn
                          ? 'bg-amber-50/70 border-amber-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{rule.rule_name}</span>
                        <span className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded font-bold ${
                          isCrit
                            ? 'bg-red-100 text-red-800'
                            : isWarn
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {rule.severity}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        {rule.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Turn-by-Turn Segment Table */}
          {routeResult.recommended_route?.edges?.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-200">
                <h4 className="font-bold text-sm text-slate-800">Traversed Road Corridors Breakdown</h4>
                <p className="text-xs text-slate-500">Segment-by-segment distance, speed limit, and ML risk evaluation</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="px-5 py-3">Step</th>
                      <th className="px-5 py-3">Corridor Name</th>
                      <th className="px-5 py-3">From → To</th>
                      <th className="px-5 py-3">Length</th>
                      <th className="px-5 py-3">Est. Time</th>
                      <th className="px-5 py-3">Risk Assessment</th>
                      <th className="px-5 py-3">Class Probabilities</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {routeResult.recommended_route.edges.map((e, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition">
                        <td className="px-5 py-3 font-mono font-semibold text-slate-400">{idx + 1}</td>
                        <td className="px-5 py-3 font-semibold text-slate-800">{e.road_name}</td>
                        <td className="px-5 py-3 text-slate-500 font-mono text-[11px]">
                          {e.from_node} → {e.to_node}
                        </td>
                        <td className="px-5 py-3 font-mono">{(e.length_m / 1000).toFixed(2)} km</td>
                        <td className="px-5 py-3 font-mono">{(e.base_travel_time_s / 60).toFixed(1)} min</td>
                        <td className="px-5 py-3">
                          <RiskBadge category={e.risk_category} label={e.risk_label} isBlocked={e.is_blocked} />
                        </td>
                        <td className="px-5 py-3 text-[11px] font-mono text-slate-500">
                          L: {((e.probabilities?.low || 0) * 100).toFixed(0)}% |
                          M: {((e.probabilities?.medium || 0) * 100).toFixed(0)}% |
                          H: {((e.probabilities?.high || 0) * 100).toFixed(0)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
