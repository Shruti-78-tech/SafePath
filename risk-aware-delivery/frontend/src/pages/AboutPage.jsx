import React from 'react';
import {
  Info,
  BookOpen,
  Cpu,
  Layers,
  Shield,
  Code,
  Terminal,
  ExternalLink,
  Award,
  CheckCircle2
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Title */}
      <div className="space-y-1">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold mb-1">
          <Award className="w-3.5 h-3.5" />
          <span>SafePath • Smart India Hackathon 2026 • Problem Statement ID: SIH26002</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900">
          SafePath: Risk-Aware Essential Supply Delivery Route Planning System
        </h2>
        <p className="text-xs text-slate-500">
          Decision Support System for Emergency Logistics Convoys during Natural Disasters and Severe Weather
        </p>
      </div>

      {/* System Architecture Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-slate-800 flex items-center space-x-2 border-b pb-3">
          <Layers className="w-4 h-4 text-blue-600" />
          <span>Multi-Tier System Architecture</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-800 block text-xs">1. Data Ingestion</span>
            <p className="text-slate-600 text-[11px]">
              OpenStreetMap road topological graphs combined with real-time Open-Meteo meteorological API telemetries.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-800 block text-xs">2. Machine Learning</span>
            <p className="text-slate-600 text-[11px]">
              Supervised 35-tree Random Forest with balanced class weighting to estimate segment disruption probabilities.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-800 block text-xs">3. A* Graph Optimization</span>
            <p className="text-slate-600 text-[11px]">
              Admissible Haversine-normalized heuristic search evaluating travel time and non-linear hazard penalties.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-800 block text-xs">4. Rule Engine & UI</span>
            <p className="text-slate-600 text-[11px]">
              Explainable domain rule policies, interactive Leaflet maps, and decision audit logs for incident commanders.
            </p>
          </div>
        </div>
      </div>

      {/* Algorithmic Formulation */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
        <h3 className="font-bold text-sm text-slate-800 flex items-center space-x-2 border-b pb-3">
          <Code className="w-4 h-4 text-indigo-600" />
          <span>Mathematical Formulation & Admissibility</span>
        </h3>

        <div className="space-y-3 text-slate-700 leading-relaxed">
          <p>
            <strong>1. Configurable Edge Cost Formulation:</strong> Each directed edge e = (u, v) in the road graph incorporates base travel time and profile-weighted disruption risk:
          </p>
          <div className="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs">
            edge_cost(e) = base_travel_time(e) × [1.0 + profile_weight × risk_score(e) × penalty_factor]
          </div>

          <p>
            <strong>2. Proof of Heuristic Admissibility:</strong> The A* heuristic h(n, goal) computes Great-Circle Haversine distance divided by maximum corridor velocity (v_max = 80 km/h ≈ 22.22 m/s):
          </p>
          <div className="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs">
            h(n, goal) = haversine_distance(n, goal) / v_max
          </div>
          <p className="text-slate-600">
            Because base_travel_time(e) ≥ haversine_distance / v_max and the risk penalty is non-negative (≥ 0), the heuristic strictly satisfies h(n) ≤ c*(n, goal). Therefore, h(n) is strictly <strong>admissible</strong> and monotonic, mathematically guaranteeing the discovery of optimal risk-penalized paths.
          </p>
        </div>
      </div>

      {/* Technology Stack Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        <div className="p-5 border-b border-slate-200">
          <h3 className="font-bold text-sm text-slate-800">Approved Technology Stack</h3>
          <p className="text-xs text-slate-500">Implemented exactly according to SIH26002 specifications</p>
        </div>

        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] font-semibold border-b border-slate-200">
            <tr>
              <th className="px-5 py-3">Component</th>
              <th className="px-5 py-3">Technologies</th>
              <th className="px-5 py-3">Role in System</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr>
              <td className="px-5 py-3 font-semibold text-slate-800">Frontend UI</td>
              <td className="px-5 py-3 font-mono text-blue-600">React.js, Vite, Tailwind CSS</td>
              <td className="px-5 py-3 text-slate-600">Interactive Single-Page Application</td>
            </tr>
            <tr>
              <td className="px-5 py-3 font-semibold text-slate-800">Geospatial Mapping</td>
              <td className="px-5 py-3 font-mono text-blue-600">Leaflet, React-Leaflet, OpenStreetMap</td>
              <td className="px-5 py-3 text-slate-600">Road network & polyline route visualization</td>
            </tr>
            <tr>
              <td className="px-5 py-3 font-semibold text-slate-800">Data Analytics</td>
              <td className="px-5 py-3 font-mono text-blue-600">Recharts, Axios, Lucide React</td>
              <td className="px-5 py-3 text-slate-600">Donut/Bar charts, API communication & iconography</td>
            </tr>
            <tr>
              <td className="px-5 py-3 font-semibold text-slate-800">Backend Server</td>
              <td className="px-5 py-3 font-mono text-indigo-600">Python 3.11, FastAPI, Pydantic</td>
              <td className="px-5 py-3 text-slate-600">High-performance async REST API engine</td>
            </tr>
            <tr>
              <td className="px-5 py-3 font-semibold text-slate-800">Graph Routing</td>
              <td className="px-5 py-3 font-mono text-indigo-600">NetworkX, A* Heuristic Algorithm</td>
              <td className="px-5 py-3 text-slate-600">Topology modeling & cost-optimized pathfinding</td>
            </tr>
            <tr>
              <td className="px-5 py-3 font-semibold text-slate-800">Machine Learning</td>
              <td className="px-5 py-3 font-mono text-indigo-600">Random Forest Classifier, Joblib</td>
              <td className="px-5 py-3 text-slate-600">Supervised 3-class disruption risk inference</td>
            </tr>
            <tr>
              <td className="px-5 py-3 font-semibold text-slate-800">Storage & Data</td>
              <td className="px-5 py-3 font-mono text-slate-700">SQLite 3, Open-Meteo REST API</td>
              <td className="px-5 py-3 text-slate-600">Persistent dispatch history & live weather</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Assumptions & Limitations */}
      <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl text-xs space-y-2 text-slate-700">
        <h4 className="font-bold text-sm text-slate-800 flex items-center space-x-1.5">
          <Info className="w-4 h-4 text-blue-600" />
          <span>Operational Assumptions & Life-Safety Disclaimers</span>
        </h4>
        <ul className="list-disc pl-5 space-y-1 text-slate-600">
          <li>The system acts as a <strong>decision-support tool</strong> for trained logistics officers, not an autonomous auto-pilot.</li>
          <li>Never guarantees absolute safety: during severe monsoons or cyclones, localized flash flooding may occur rapidly beyond telemetry resolution.</li>
          <li>Road closure status updates can be simulated interactively or synchronized via municipal emergency APIs.</li>
        </ul>
      </div>
    </div>
  );
}
