"""
Rule-Based Reasoning Engine for Emergency Logistics Decision Support
====================================================================
Evaluates environmental indicators, infrastructure constraints, and model outputs
to produce explainable policy decisions, safety advisories, and graph modifications.
"""

from typing import Dict, Any, List, Optional

class RuleEngine:
    def __init__(self):
        pass

    def evaluate(
        self,
        weather: Dict[str, Any],
        profile: str,
        recommended_route: Optional[Dict[str, Any]],
        baseline_route: Optional[Dict[str, Any]],
        blocked_segments: List[str],
        origin: str,
        destination: str
    ) -> List[Dict[str, Any]]:
        triggered_rules = []

        # RULE 1: Officially Reported Road Closure
        if blocked_segments:
            triggered_rules.append({
                "rule_id": "RULE_01_OFFICIAL_ROAD_CLOSURE",
                "rule_name": "Official Road Closure Exclusion",
                "severity": "critical",
                "description": (
                    f"Identified {len(blocked_segments)} road segment(s) with official closure notices "
                    f"({', '.join(blocked_segments[:3])}{'...' if len(blocked_segments) > 3 else ''}). "
                    f"These edges were physically excised from the routing graph to guarantee route feasibility."
                ),
                "evidence": {"blocked_segments": blocked_segments}
            })

        # RULE 2: Weather Data Reliability & Uncertainty
        if weather.get("is_fallback", False):
            triggered_rules.append({
                "rule_id": "RULE_02_DATA_SOURCE_UNCERTAINTY",
                "rule_name": "Meteorological Data Uncertainty Advisory",
                "severity": "warning",
                "description": (
                    "Live Open-Meteo weather telemetries were unreachable or timed out. "
                    "The system fell back to high-fidelity emergency simulation parameters. "
                    "Segment risk classifications should be treated with conservative safety margins."
                ),
                "evidence": {
                    "source": weather.get("source"),
                    "fallback_reason": weather.get("fallback_reason")
                }
            })

        # RULE 3: Extreme Weather Alert
        rain = float(weather.get("rainfall_intensity_mmh", 0.0))
        wind = float(weather.get("wind_speed_kmh", 0.0))
        if rain >= 50.0 or wind >= 60.0:
            triggered_rules.append({
                "rule_id": "RULE_03_SEVERE_WEATHER_ALERT",
                "rule_name": "Severe Hydro-Meteorological Hazard",
                "severity": "warning",
                "description": (
                    f"Active conditions indicate severe storm energy (Precipitation: {rain} mm/h, Wind: {wind} km/h). "
                    f"Lowland river crossings and unpaved secondary arteries are highly susceptible to flash inundation."
                ),
                "evidence": {"rainfall_mmh": rain, "wind_speed_kmh": wind}
            })

        # RULE 4: Infeasible Route / Graph Partitioning
        if recommended_route is None:
            triggered_rules.append({
                "rule_id": "RULE_04_NO_FEASIBLE_ROUTE",
                "rule_name": "Delivery Route Unreachable",
                "severity": "critical",
                "description": (
                    f"No connected path exists between origin '{origin}' and destination '{destination}'. "
                    f"Active road closures or insurmountable bottlenecks completely severed connectivity. "
                    f"Recommendation: Review active closures or deploy aerial / amphibious emergency transport."
                ),
                "evidence": {"origin": origin, "destination": destination}
            })
            return triggered_rules

        # RULE 5: High Risk Avoidance in Safest Profile
        if profile.lower() == "safest":
            triggered_rules.append({
                "rule_id": "RULE_05_SAFETY_FIRST_POLICY",
                "rule_name": "Safest Profile Rerouting Policy",
                "severity": "info",
                "description": (
                    "The 'Safest' profile applied an exponential penalty on high and medium risk road segments, "
                    "actively preferring elevated ridge corridors and engineered bypasses even if they require longer mileage."
                ),
                "evidence": {"profile": profile}
            })

        # RULE 6: Unavoidable High-Risk Segment Warning
        high_risk_count = recommended_route.get("high_risk_segment_count", 0)
        if high_risk_count > 0:
            triggered_rules.append({
                "rule_id": "RULE_06_UNAVOIDABLE_HIGH_RISK_WARNING",
                "rule_name": "Caution: Unavoidable High-Risk Segment in Path",
                "severity": "warning",
                "description": (
                    f"The recommended path contains {high_risk_count} segment(s) classified as High Risk. "
                    f"Due to corridor geography, no alternative route completely bypasses all hazard zones. "
                    f"Emergency drivers must proceed with specialized high-clearance vehicles and rescue escort."
                ),
                "evidence": {"high_risk_count": high_risk_count}
            })

        # RULE 7: Comparative Safety Trade-Off
        if baseline_route is not None:
            base_risk = baseline_route.get("aggregate_risk_score", 0.0)
            rec_risk = recommended_route.get("aggregate_risk_score", 0.0)
            base_dist = baseline_route.get("total_distance_km", 0.0)
            rec_dist = recommended_route.get("total_distance_km", 0.0)

            if base_risk > rec_risk and rec_dist > base_dist:
                risk_reduction = round(((base_risk - rec_risk) / max(0.001, base_risk)) * 100.0, 1)
                extra_km = round(rec_dist - base_dist, 2)
                triggered_rules.append({
                    "rule_id": "RULE_07_RISK_EFFICIENCY_TRADE_OFF",
                    "rule_name": "Explainable Risk-Distance Trade-Off",
                    "severity": "info",
                    "description": (
                        f"Recommended route reduces aggregate disruption risk by {risk_reduction}% "
                        f"compared to baseline shortest route at the cost of an additional {extra_km} km of travel."
                    ),
                    "evidence": {
                        "risk_reduction_pct": risk_reduction,
                        "extra_distance_km": extra_km,
                        "baseline_high_risk_segments": baseline_route.get("high_risk_segment_count", 0),
                        "recommended_high_risk_segments": recommended_route.get("high_risk_segment_count", 0)
                    }
                })

        return triggered_rules
