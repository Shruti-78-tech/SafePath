import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, useMap } from 'react-leaflet';
import RiskBadge from './RiskBadge';

function AutoFitBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      try {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      } catch (e) {
        // ignore invalid bounds
      }
    }
  }, [bounds, map]);
  return null;
}

export default function MapComponent({
  nodes = {},
  segments = [],
  recommendedRoute = null,
  baselineRoute = null,
  onToggleBlock = null,
  onSelectNode = null,
  height = '540px'
}) {
  const center = [30.22, 78.18]; // Default Dehradun-Rishikesh corridor center

  // Color mapping by risk
  const getRiskColor = (segment) => {
    if (segment.is_blocked) return '#334155'; // Dark slate/blocked
    const cat = Number(segment.risk_category);
    if (cat === 2) return '#ef4444'; // Red
    if (cat === 1) return '#f59e0b'; // Amber
    return '#10b981'; // Green
  };

  // Node marker styling
  const getNodeColor = (nodeId) => {
    if (nodeId.startsWith('DEPOT')) return '#2563eb'; // Blue
    if (nodeId.startsWith('HOSPITAL')) return '#dc2626'; // Red
    if (nodeId.startsWith('SHELTER')) return '#059669'; // Emerald
    return '#64748b'; // Slate
  };

  const mapBounds = useMemo(() => {
    const coords = [];
    if (recommendedRoute?.route_coordinates?.length) {
      return recommendedRoute.route_coordinates;
    }
    Object.values(nodes).forEach(n => {
      if (n.lat && n.lon) coords.push([n.lat, n.lon]);
    });
    return coords.length > 0 ? coords : null;
  }, [nodes, recommendedRoute]);

  return (
    <div style={{ height }} className="w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm relative z-0">
      <MapContainer
        center={center}
        zoom={11}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {mapBounds && <AutoFitBounds bounds={mapBounds} />}

        {/* 1. Underlying Road Network Segments */}
        {segments.map((seg) => {
          const color = getRiskColor(seg);
          const isBlocked = seg.is_blocked;

          return (
            <Polyline
              key={seg.id}
              positions={seg.coords}
              pathOptions={{
                color,
                weight: isBlocked ? 3 : 4,
                opacity: isBlocked ? 0.45 : 0.65,
                dashArray: isBlocked ? '6, 6' : undefined
              }}
            >
              <Popup>
                <div className="p-1 space-y-2 min-w-[220px]">
                  <div className="flex items-center justify-between border-b pb-1.5">
                    <span className="font-bold text-xs text-slate-800">{seg.road_name}</span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-slate-100 rounded text-slate-600">
                      {seg.id}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-600">
                    <div className="flex justify-between items-center">
                      <span>Status:</span>
                      <RiskBadge
                        category={seg.risk_category}
                        label={seg.risk_label}
                        isBlocked={seg.is_blocked}
                      />
                    </div>
                    <div className="flex justify-between">
                      <span>Road Type:</span>
                      <span className="font-medium capitalize">{seg.road_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Length:</span>
                      <span className="font-medium">{(seg.length_m / 1000).toFixed(2)} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Speed Limit:</span>
                      <span className="font-medium">{seg.speed_limit_kmh} km/h</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Flood Susceptibility:</span>
                      <span className="font-medium text-blue-600">
                        {(seg.flood_susceptibility * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Past Incidents:</span>
                      <span className="font-medium text-amber-700">{seg.historical_incidents}</span>
                    </div>
                  </div>

                  {onToggleBlock && (
                    <div className="pt-2 border-t">
                      <button
                        onClick={() => onToggleBlock(seg.id, !seg.is_blocked)}
                        className={`w-full py-1 px-2.5 rounded text-xs font-semibold text-white transition ${
                          seg.is_blocked
                            ? 'bg-emerald-600 hover:bg-emerald-700'
                            : 'bg-red-600 hover:bg-red-700'
                        }`}
                      >
                        {seg.is_blocked ? 'Reopen Segment' : 'Simulate Roadblock'}
                      </button>
                    </div>
                  )}
                </div>
              </Popup>
            </Polyline>
          );
        })}

        {/* 2. Baseline Shortest Route (Dashed Purple) */}
        {baselineRoute?.route_coordinates && (
          <Polyline
            positions={baselineRoute.route_coordinates}
            pathOptions={{
              color: '#8b5cf6',
              weight: 5,
              opacity: 0.8,
              dashArray: '8, 8'
            }}
          >
            <Popup>
              <div className="p-1 text-xs">
                <span className="font-bold text-purple-700">Baseline Shortest Route</span>
                <p className="mt-1">Distance: {baselineRoute.total_distance_km} km</p>
                <p>Time: {baselineRoute.total_travel_time_min} min</p>
                <p>Safety Score: {baselineRoute.safety_score_100}/100</p>
              </div>
            </Popup>
          </Polyline>
        )}

        {/* 3. Recommended Risk-Aware Route (Solid Blue Glow) */}
        {recommendedRoute?.route_coordinates && (
          <Polyline
            positions={recommendedRoute.route_coordinates}
            pathOptions={{
              color: '#2563eb',
              weight: 7,
              opacity: 0.95
            }}
          >
            <Popup>
              <div className="p-1 text-xs">
                <span className="font-bold text-blue-700">★ Recommended Delivery Route</span>
                <p className="mt-1">Distance: {recommendedRoute.total_distance_km} km</p>
                <p>Travel Time: {recommendedRoute.total_travel_time_min} min</p>
                <p>Safety Score: {recommendedRoute.safety_score_100}/100</p>
                <p>Profile: <span className="capitalize font-semibold">{recommendedRoute.profile}</span></p>
              </div>
            </Popup>
          </Polyline>
        )}

        {/* 4. Node Markers */}
        {Object.values(nodes).map((node) => {
          const color = getNodeColor(node.id);
          const isOrigin = recommendedRoute?.origin === node.id;
          const isDest = recommendedRoute?.destination === node.id;

          let radius = 7;
          if (isOrigin || isDest) radius = 10;
          else if (node.id.startsWith('DEPOT') || node.id.startsWith('HOSPITAL')) radius = 9;

          return (
            <CircleMarker
              key={node.id}
              center={[node.lat, node.lon]}
              radius={radius}
              pathOptions={{
                fillColor: isOrigin ? '#10b981' : isDest ? '#dc2626' : color,
                color: '#ffffff',
                weight: 2,
                fillOpacity: 0.9
              }}
            >
              <Popup>
                <div className="p-1 text-xs space-y-1">
                  <span className="font-bold text-slate-800">{node.name}</span>
                  <div className="text-[10px] text-slate-500 font-mono">ID: {node.id}</div>
                  <div className="text-[11px] text-slate-600">Elevation: {node.elevation_m} m</div>

                  {onSelectNode && (
                    <div className="flex gap-1.5 pt-1.5 border-t">
                      <button
                        onClick={() => onSelectNode(node.id, 'origin')}
                        className="px-2 py-0.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-[10px] font-semibold"
                      >
                        Set Origin
                      </button>
                      <button
                        onClick={() => onSelectNode(node.id, 'destination')}
                        className="px-2 py-0.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded text-[10px] font-semibold"
                      >
                        Set Destination
                      </button>
                    </div>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Map Legend Floating Overlay */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-slate-200 text-[11px] space-y-1.5 max-w-[200px]">
        <span className="font-bold text-slate-800 block text-xs">Map Legend</span>
        <div className="flex items-center space-x-2">
          <span className="w-3.5 h-1 bg-emerald-500 rounded"></span>
          <span className="text-slate-600">Low Risk Segment</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3.5 h-1 bg-amber-500 rounded"></span>
          <span className="text-slate-600">Medium Risk Segment</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3.5 h-1 bg-red-500 rounded"></span>
          <span className="text-slate-600">High Risk Segment</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-4 h-1.5 bg-blue-600 rounded"></span>
          <span className="text-slate-700 font-medium">Recommended Route</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-4 h-1 border-t-2 border-dashed border-purple-500"></span>
          <span className="text-slate-700 font-medium">Baseline Route</span>
        </div>
      </div>
    </div>
  );
}
