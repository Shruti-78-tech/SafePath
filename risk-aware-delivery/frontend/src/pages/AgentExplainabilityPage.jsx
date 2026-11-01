import React, { useState, useEffect } from 'react';
import {
  Bot,
  CheckCircle2,
  Clock,
  Shield,
  AlertTriangle,
  Info,
  Terminal,
  Cpu,
  Layers,
  ArrowRight
} from 'lucide-react';
import { routeService } from '../services/api';

export default function AgentExplainabilityPage() {
  const [agentData, setAgentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedStep, setSelectedStep] = useState(null);

  useEffect(() => {
    runSampleAudit();
  }, []);

  const runSampleAudit = async () => {
    try {
      setLoading(true);
      const res = await routeService.planRoute({
        origin: 'DEPOT_MAIN',
        destination: 'HOSPITAL_AIIMS',
        profile: 'safest',
        weather_override: {
          rainfall_intensity_mmh: 85.0,
          wind_speed_kmh: 65.0,
          temperature_c: 24.0
        }
      });
      setAgentData(res);
      if (res?.audit_trail?.length > 0) {
        setSelectedStep(res.audit_trail[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const auditSteps = agentData?.audit_trail || [];
  const triggeredRules = agentData?.triggered_rules || [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Goal-Based Intelligent Agent Explainability</h2>
        <p className="text-xs text-slate-500">
          Transparent step-by-step decision auditing, heuristic search proofs, and domain rule engine validation
        </p>
      </div>

      {/* Top Lifecycle Overview */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-2xl text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Bot className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-base">Autonomous Dispatcher Lifecycle (9-Stage Pipeline)</h3>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl">
            Every route recommendation is produced via deterministic goal-oriented execution combining live data ingestion,
            supervised ML classification, admissible A* graph search, and transparent policy rule checks.
          </p>
        </div>

        <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-mono">
          <Clock className="w-4 h-4 text-emerald-400" />
          <span>Execution Time: {agentData?.execution_time_ms || 12} ms</span>
        </div>
      </div>

      {/* Main Content: Left Audit Steps Timeline, Right Step Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Timeline */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="font-bold text-sm text-slate-800 flex items-center space-x-2 border-b pb-3">
            <Cpu className="w-4 h-4 text-blue-600" />
            <span>Agent Decision Audit Trail</span>
          </h3>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {auditSteps.map((step) => {
              const isSelected = selectedStep?.step_number === step.step_number;
              return (
                <button
                  key={step.step_number}
                  onClick={() => setSelectedStep(step)}
                  className={`w-full text-left p-3 rounded-xl border transition flex items-start space-x-3 ${
                    isSelected
                      ? 'bg-blue-50 border-blue-500 shadow-sm'
                      : 'border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg text-xs font-bold font-mono mt-0.5 ${
                    isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    0{step.step_number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold truncate ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                        {step.step_name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{step.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{step.details}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step Inspector & Evidence Viewer */}
        <div className="lg:col-span-7 space-y-5">
          {selectedStep ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                    Stage {selectedStep.step_number} of 9
                  </span>
                  <h3 className="font-bold text-sm text-slate-800">{selectedStep.step_name}</h3>
                </div>
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>{selectedStep.status}</span>
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="font-semibold text-slate-500 block mb-1">Execution Summary</span>
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 font-mono text-[11px] leading-relaxed">
                    {selectedStep.details}
                  </div>
                </div>

                <div className="pt-2">
                  <span className="font-semibold text-slate-500 block mb-1">Methodology & Verification</span>
                  <p className="text-slate-600 leading-relaxed">
                    {selectedStep.step_number === 1 && "Ingests mission destination, supply convoy speed limits, and user profile weighting."}
                    {selectedStep.step_number === 2 && "Queries the Open-Meteo REST API with timeout fallback to ensure system operates seamlessly during telecom outages."}
                    {selectedStep.step_number === 3 && "Constructs topological NetworkX representation and derives non-linear hydro-meteorological vulnerability indices."}
                    {selectedStep.step_number === 4 && "Evaluates each candidate edge against the trained 35-tree Random Forest classifier to compute class probabilities."}
                    {selectedStep.step_number === 5 && "Verifies strong connectivity and confirms that source and target nodes exist within the navigable subgraph."}
                    {selectedStep.step_number === 6 && "Executes A* search using an admissible Haversine heuristic (distance / max speed), guaranteeing optimal risk-penalized path."}
                    {selectedStep.step_number === 7 && "Runs unweighted baseline shortest path search (risk weight = 0.0) for transparent decision benchmarking."}
                    {selectedStep.step_number === 8 && "Evaluates domain rules to detect road closures, extreme hazard alerts, and explainable distance-risk trade-offs."}
                    {selectedStep.step_number === 9 && "Packages turn-by-turn routing, polyline geometries, and audit evidence for human operator verification."}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
              Select a stage from the timeline to inspect evidence.
            </div>
          )}

          {/* Triggered Domain Rules Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-slate-800 flex items-center space-x-2 border-b pb-3">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>Active Rule Engine Policies ({triggeredRules.length})</span>
            </h3>

            <div className="space-y-2">
              {triggeredRules.map((r, i) => (
                <div key={i} className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{r.rule_name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded font-bold uppercase bg-slate-200 text-slate-700">
                      {r.severity}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px]">{r.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
