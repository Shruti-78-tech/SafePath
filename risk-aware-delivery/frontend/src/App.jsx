import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

import DashboardPage from './pages/DashboardPage';
import RoutePlannerPage from './pages/RoutePlannerPage';
import RiskAnalysisPage from './pages/RiskAnalysisPage';
import RouteComparisonPage from './pages/RouteComparisonPage';
import AgentExplainabilityPage from './pages/AgentExplainabilityPage';
import ModelEvaluationPage from './pages/ModelEvaluationPage';
import RouteHistoryPage from './pages/RouteHistoryPage';
import AboutPage from './pages/AboutPage';

import { dashboardService } from './services/api';

const TAB_TITLES = {
  dashboard: {
    title: 'Executive Logistics Dashboard',
    subtitle: 'System-wide emergency supply overview, road classifications, and recent dispatches'
  },
  planner: {
    title: 'Interactive Route Planner',
    subtitle: 'Origin and destination dispatching with risk-penalized A* optimization'
  },
  risk: {
    title: 'Road Risk Analysis & ML Predictor',
    subtitle: 'Corridor hazard inspection, feature importances, and interactive inference sandbox'
  },
  comparison: {
    title: 'Route Comparison & Trade-Off Benchmarking',
    subtitle: 'Evaluating baseline shortest distance versus risk-mitigated delivery corridors'
  },
  explainability: {
    title: 'Agent Explainability & Decision Audit',
    subtitle: 'Step-by-step decision evidence and domain rule engine validation'
  },
  evaluation: {
    title: 'Machine Learning Model Evaluation',
    subtitle: 'Metrics, confusion matrix, and training methodology for Random Forest'
  },
  history: {
    title: 'Dispatch History Log',
    subtitle: 'Audit trail of past emergency routing requests persisted in SQLite'
  },
  about: {
    title: 'System Methodology & Architecture',
    subtitle: 'SIH26002 Problem Statement, algorithms, mathematical formulation, and limitations'
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [weather, setWeather] = useState(null);
  const [historyRouteResult, setHistoryRouteResult] = useState(null);

  useEffect(() => {
    loadGlobalWeather();
  }, []);

  const loadGlobalWeather = async () => {
    try {
      const stats = await dashboardService.getStats();
      if (stats?.current_weather) {
        setWeather(stats.current_weather);
      }
    } catch (e) {
      console.warn('Weather load fallback');
    }
  };

  const handleSelectHistoryRoute = (rawRoute) => {
    setHistoryRouteResult(rawRoute);
    setActiveTab('planner');
  };

  const currentTabInfo = TAB_TITLES[activeTab] || {
    title: 'Emergency Delivery Route Planning System',
    subtitle: 'SIH 2026 Problem Statement SIH26002'
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans text-slate-800 antialiased">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          weather={weather}
          title={currentTabInfo.title}
          subtitle={currentTabInfo.subtitle}
        />

        <main className="flex-1 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardPage
              setActiveTab={setActiveTab}
              onSelectHistoryRoute={handleSelectHistoryRoute}
            />
          )}

          {activeTab === 'planner' && (
            <RoutePlannerPage historyRouteResult={historyRouteResult} />
          )}

          {activeTab === 'risk' && (
            <RiskAnalysisPage />
          )}

          {activeTab === 'comparison' && (
            <RouteComparisonPage />
          )}

          {activeTab === 'explainability' && (
            <AgentExplainabilityPage />
          )}

          {activeTab === 'evaluation' && (
            <ModelEvaluationPage />
          )}

          {activeTab === 'history' && (
            <RouteHistoryPage
              setActiveTab={setActiveTab}
              onSelectRoute={handleSelectHistoryRoute}
            />
          )}

          {activeTab === 'about' && (
            <AboutPage />
          )}
        </main>
      </div>
    </div>
  );
}
