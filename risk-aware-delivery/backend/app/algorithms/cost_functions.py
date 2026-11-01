"""
Edge Cost Functions for Risk-Aware Delivery Routing
===================================================
Calculates edge weights combining travel time with predicted disruption risk
according to configurable routing profiles.
"""

from typing import Dict, Any

MAX_NETWORK_SPEED_KMH = 80.0
MAX_NETWORK_SPEED_MS = (MAX_NETWORK_SPEED_KMH * 1000.0) / 3600.0  # ~22.22 m/s

PROFILE_WEIGHTS = {
    "fastest": 0.0,
    "balanced": 1.8,
    "safest": 4.5
}

def calculate_base_travel_time(length_m: float, speed_limit_kmh: float) -> float:
    speed_ms = max(5.0, (speed_limit_kmh * 1000.0) / 3600.0)
    return length_m / speed_ms

def calculate_edge_cost(
    length_m: float,
    speed_limit_kmh: float,
    risk_score: float,
    risk_category: int,
    profile: str = "balanced"
) -> float:
    base_time = calculate_base_travel_time(length_m, speed_limit_kmh)
    risk_weight = PROFILE_WEIGHTS.get(profile.lower(), 1.8)

    if risk_weight == 0.0:
        return base_time

    # Profile adjustments
    penalty_multiplier = 1.0
    if profile.lower() == "safest":
        if risk_category == 2 or risk_score >= 0.65:
            penalty_multiplier = 3.0
        elif risk_category == 1:
            penalty_multiplier = 1.5

    risk_penalty = risk_weight * risk_score * penalty_multiplier
    return base_time * (1.0 + risk_penalty)
