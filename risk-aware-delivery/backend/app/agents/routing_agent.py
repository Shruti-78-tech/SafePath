"""
Goal-Based Intelligent Agent for Risk-Aware Delivery Route Planning
==================================================================
Implements a 9-step decision lifecycle with full explainability audit logs,
trade-off syntheses, and safety assurance validation.
"""

import time
from typing import Dict, Any, List, Optional

from app.services.weather_service import get_weather_for_coordinates
from app.services.graph_service import build_enriched_graph, get_blocked_segments
from app.algorithms.astar import find_risk_aware_path
from app.rules.rule_engine import RuleEngine

class DeliveryRoutingAgent:
    def __init__(self):
        self.rule_engine = RuleEngine()

    async def execute_plan(
        self,
        origin: str,
        destination: str,
        profile: str = "balanced",
        custom_blocked: Optional[List[str]] = None,
        weather_override: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        audit_trail: List[Dict[str, Any]] = []
        start_wall_time = time.time()

        # Step 1: Ingest Delivery Goal & Constraints
        audit_trail.append({
            "step_number": 1,
            "step_name": "Ingest Goal & Constraints",
            "status": "COMPLETED",
            "details": f"Targeting delivery from '{origin}' to '{destination}' under optimization profile '{profile}'.",
            "timestamp": time.strftime("%H:%M:%S")
        })

        # Step 2: Retrieve Weather Telemetry
        # Look up coordinates of origin or default center
        if weather_override:
            weather_data = {
                "temperature_c": float(weather_override.get("temperature_c", 25.0)),
                "rainfall_intensity_mmh": float(weather_override.get("rainfall_intensity_mmh", 20.0)),
                "wind_speed_kmh": float(weather_override.get("wind_speed_kmh", 25.0)),
                "source": "user-manual-simulation",
                "is_fallback": False,
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ")
            }
        else:
            weather_data = await get_weather_for_coordinates(30.28, 78.18)

        audit_trail.append({
            "step_number": 2,
            "step_name": "Ingest Hydro-Meteorological Data",
            "status": "COMPLETED",
            "details": (
                f"Source: {weather_data.get('source')} | "
                f"Rain: {weather_data.get('rainfall_intensity_mmh')} mm/h | "
                f"Wind: {weather_data.get('wind_speed_kmh')} km/h | "
                f"Temp: {weather_data.get('temperature_c')}°C"
            ),
            "timestamp": time.strftime("%H:%M:%S")
        })

        # Step 3 & 4: Build Enriched Road Graph with ML Predictions
        all_blocked = list(get_blocked_segments())
        if custom_blocked:
            all_blocked.extend(custom_blocked)
        all_blocked = list(set(all_blocked))

        graph, node_data, enriched_edges = build_enriched_graph(
            weather_data=weather_data,
            custom_blocked=all_blocked
        )

        high_risk_edges = [e for e in enriched_edges if e["risk_category"] == 2]
        med_risk_edges = [e for e in enriched_edges if e["risk_category"] == 1]
        low_risk_edges = [e for e in enriched_edges if e["risk_category"] == 0]

        audit_trail.append({
            "step_number": 3,
            "step_name": "Extract & Engineer Segment Features",
            "status": "COMPLETED",
            "details": f"Constructed topological road graph with {graph.number_of_nodes()} nodes and {graph.number_of_edges()} directed edges.",
            "timestamp": time.strftime("%H:%M:%S")
        })

        audit_trail.append({
            "step_number": 4,
            "step_name": "Random Forest Risk Inference",
            "status": "COMPLETED",
            "details": (
                f"Segment risk breakdown: Low Risk: {len(low_risk_edges)} ({len(low_risk_edges)/len(enriched_edges):.1%}), "
                f"Medium Risk: {len(med_risk_edges)} ({len(med_risk_edges)/len(enriched_edges):.1%}), "
                f"High Risk: {len(high_risk_edges)} ({len(high_risk_edges)/len(enriched_edges):.1%})."
            ),
            "timestamp": time.strftime("%H:%M:%S")
        })

        # Step 5: Check Graph Preconditions
        if origin not in graph:
            audit_trail.append({
                "step_number": 5,
                "step_name": "Validation Error",
                "status": "FAILED",
                "details": f"Origin node '{origin}' not found in active road network.",
                "timestamp": time.strftime("%H:%M:%S")
            })
            return {
                "success": False,
                "error": f"Invalid origin: '{origin}'",
                "audit_trail": audit_trail
            }

        if destination not in graph:
            audit_trail.append({
                "step_number": 5,
                "step_name": "Validation Error",
                "status": "FAILED",
                "details": f"Destination node '{destination}' not found in active road network.",
                "timestamp": time.strftime("%H:%M:%S")
            })
            return {
                "success": False,
                "error": f"Invalid destination: '{destination}'",
                "audit_trail": audit_trail
            }

        # Step 6: Execute Risk-Aware A* Search
        recommended_route = find_risk_aware_path(
            graph=graph,
            origin=origin,
            destination=destination,
            node_data=node_data,
            profile=profile
        )

        # Step 7: Execute Baseline Route Search (Shortest Distance / Fastest)
        baseline_route = find_risk_aware_path(
            graph=graph,
            origin=origin,
            destination=destination,
            node_data=node_data,
            profile="fastest"
        )

        audit_trail.append({
            "step_number": 6,
            "step_name": "Risk-Aware A* Search",
            "status": "COMPLETED" if recommended_route else "FAILED",
            "details": (
                f"Recommended route: {recommended_route['total_distance_km']} km, "
                f"{recommended_route['total_travel_time_min']} min, "
                f"Safety Score: {recommended_route['safety_score_100']}/100"
                if recommended_route else "No path found."
            ),
            "timestamp": time.strftime("%H:%M:%S")
        })

        audit_trail.append({
            "step_number": 7,
            "step_name": "Baseline Route Benchmarking",
            "status": "COMPLETED" if baseline_route else "FAILED",
            "details": (
                f"Baseline route: {baseline_route['total_distance_km']} km, "
                f"{baseline_route['total_travel_time_min']} min, "
                f"Safety Score: {baseline_route['safety_score_100']}/100"
                if baseline_route else "No baseline path found."
            ),
            "timestamp": time.strftime("%H:%M:%S")
        })

        # Step 8: Apply Rule-Based Reasoning & Synthesize Decision Explanation
        triggered_rules = self.rule_engine.evaluate(
            weather=weather_data,
            profile=profile,
            recommended_route=recommended_route,
            baseline_route=baseline_route,
            blocked_segments=all_blocked,
            origin=origin,
            destination=destination
        )

        audit_trail.append({
            "step_number": 8,
            "step_name": "Rule Engine & Policy Audit",
            "status": "COMPLETED",
            "details": f"Evaluated domain rules; {len(triggered_rules)} policy rule(s) triggered.",
            "timestamp": time.strftime("%H:%M:%S")
        })

        # Synthesize explainability verdict
        explanation = self._synthesize_explanation(recommended_route, baseline_route, profile, triggered_rules)

        # Step 9: Assemble Decision Support Package
        elapsed_ms = round((time.time() - start_wall_time) * 1000.0, 1)
        audit_trail.append({
            "step_number": 9,
            "step_name": "Assemble Decision Package",
            "status": "COMPLETED",
            "details": f"Package ready for operator review in {elapsed_ms} ms.",
            "timestamp": time.strftime("%H:%M:%S")
        })

        return {
            "success": recommended_route is not None,
            "origin": origin,
            "origin_name": node_data[origin]["name"],
            "destination": destination,
            "destination_name": node_data[destination]["name"],
            "profile": profile,
            "weather": weather_data,
            "recommended_route": recommended_route,
            "baseline_route": baseline_route,
            "comparison": self._compute_comparison(recommended_route, baseline_route),
            "triggered_rules": triggered_rules,
            "explanation": explanation,
            "audit_trail": audit_trail,
            "execution_time_ms": elapsed_ms,
            "network_nodes": node_data,
            "total_segments_evaluated": len(enriched_edges)
        }

    def _compute_comparison(
        self,
        recommended: Optional[Dict[str, Any]],
        baseline: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        if not recommended or not baseline:
            return {}

        rec_dist = recommended["total_distance_km"]
        base_dist = baseline["total_distance_km"]
        delta_dist_km = round(rec_dist - base_dist, 2)
        delta_dist_pct = round(((rec_dist - base_dist) / max(0.1, base_dist)) * 100.0, 1)

        rec_time = recommended["total_travel_time_min"]
        base_time = baseline["total_travel_time_min"]
        delta_time_min = round(rec_time - base_time, 1)
        delta_time_pct = round(((rec_time - base_time) / max(0.1, base_time)) * 100.0, 1)

        rec_risk = recommended["aggregate_risk_score"]
        base_risk = baseline["aggregate_risk_score"]
        risk_reduction_pct = round(((base_risk - rec_risk) / max(0.001, base_risk)) * 100.0, 1)

        high_risk_avoided = max(0, baseline["high_risk_segment_count"] - recommended["high_risk_segment_count"])

        return {
            "delta_distance_km": delta_dist_km,
            "delta_distance_percentage": delta_dist_pct,
            "delta_travel_time_min": delta_time_min,
            "delta_travel_time_percentage": delta_time_pct,
            "risk_reduction_percentage": max(0.0, risk_reduction_pct),
            "high_risk_segments_avoided": high_risk_avoided,
            "safety_gain_score": round(recommended["safety_score_100"] - baseline["safety_score_100"], 1)
        }

    def _synthesize_explanation(
        self,
        recommended: Optional[Dict[str, Any]],
        baseline: Optional[Dict[str, Any]],
        profile: str,
        rules: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        if not recommended:
            return {
                "headline": "No Feasible Route Available",
                "summary": "All network corridors between origin and destination are currently blocked or impassable.",
                "key_takeaway": "Immediate action required: Check flood conditions or request alternate dispatch staging."
            }

        if baseline and recommended["nodes_in_path"] == baseline["nodes_in_path"]:
            return {
                "headline": "Optimal Route Confirmed Safe",
                "summary": (
                    f"The baseline shortest corridor is already within acceptable safety bounds "
                    f"(Safety Score: {recommended['safety_score_100']}/100). No detour is necessary."
                ),
                "key_takeaway": f"Direct dispatch authorized. Total distance: {recommended['total_distance_km']} km."
            }

        comparison = self._compute_comparison(recommended, baseline)
        return {
            "headline": f"Risk-Mitigated Detour Recommended ({profile.capitalize()} Profile)",
            "summary": (
                f"The agent recommends an alternative corridor to avoid {comparison.get('high_risk_segments_avoided', 0)} "
                f"high-risk road segment(s). This decision reduces disruption hazard by {comparison.get('risk_reduction_percentage', 0)}%, "
                f"requiring an additional {comparison.get('delta_distance_km', 0)} km ({comparison.get('delta_travel_time_min', 0)} min)."
            ),
            "key_takeaway": (
                f"Safety Score increased from {baseline['safety_score_100']} to {recommended['safety_score_100']}/100. "
                f"Recommendation strongly advised during active disaster operations."
            )
        }
