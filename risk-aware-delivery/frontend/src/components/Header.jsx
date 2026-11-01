import React from 'react';
import { CloudRain, Wind, Thermometer, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function Header({ weather, title, subtitle }) {
  const rain = weather?.rainfall_intensity_mmh ?? 0;
  const wind = weather?.wind_speed_kmh ?? 0;
  const temp = weather?.temperature_c ?? 25;
  const isFallback = weather?.is_fallback ?? false;

  const isSevere = rain >= 50 || wind >= 55;

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-20 shadow-xs">
      <div className="flex items-center space-x-3.5">
        <div className="w-10 h-10 rounded-xl bg-slate-50 p-1 border border-slate-200 flex items-center justify-center shrink-0 shadow-xs">
          <img
            src="/safepath-logo.png"
            alt="SafePath Logo"
            className="w-full h-full object-contain filter drop-shadow-sm"
          />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <span>{title}</span>
          </h2>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs">
        {/* Weather Indicator Card */}
        <div className={`flex items-center space-x-3 px-3 py-1.5 rounded-lg border ${
          isSevere
            ? 'bg-amber-50 border-amber-300 text-amber-900'
            : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}>
          <div className="flex items-center space-x-1 font-medium">
            <CloudRain className={`w-3.5 h-3.5 ${isSevere ? 'text-amber-600 animate-pulse' : 'text-blue-500'}`} />
            <span>{rain} mm/h</span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center space-x-1 font-medium">
            <Wind className="w-3.5 h-3.5 text-teal-500" />
            <span>{wind} km/h</span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center space-x-1 font-medium">
            <Thermometer className="w-3.5 h-3.5 text-rose-500" />
            <span>{temp}°C</span>
          </div>
        </div>

        {/* Source Badge */}
        <span className={`px-2.5 py-1 rounded-full font-mono text-[11px] font-semibold flex items-center space-x-1.5 border ${
          isFallback
            ? 'bg-amber-100 text-amber-800 border-amber-300'
            : 'bg-emerald-100 text-emerald-800 border-emerald-300'
        }`}>
          {isFallback ? (
            <>
              <AlertTriangle className="w-3 h-3 text-amber-600" />
              <span>Simulated Weather</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>Live Open-Meteo</span>
            </>
          )}
        </span>
      </div>
    </header>
  );
}
