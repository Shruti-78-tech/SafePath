"""
Risk-Aware A* Search Algorithm
==============================
Implements A* graph traversal over the road network with an admissible
heuristic based on Haversine distance normalized by maximum velocity.
"""

import math
import heapq
import networkx as nx
from typing import Dict, Any, List, Optional, Tuple

from app.algorithms.cost_functions import (
    calculate_edge_cost,
    calculate_base_travel_time,
    MAX_NETWORK_SPEED_MS
)

def haversine_distance_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371000.0  # Earth's mean radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

def admissible_heuristic(u: str, goal: str, node_data: Dict[str, Any]) -> float:
    if u == goal:
        return 0.0
    u_info = node_data.get(u, {})
    goal_info = node_data.get(goal, {})

    if not u_info or not goal_info:
        return 0.0

    dist = haversine_distance_m(
        u_info["lat"], u_info["lon"],
        goal_info["lat"], goal_info["lon"]
    )
    # Since actual edge cost >= base travel time >= distance / MAX_SPEED,
    # distance / MAX_SPEED is strictly admissible (never overestimates).
    return dist / MAX_NETWORK_SPEED_MS

def find_risk_aware_path(
    graph: nx.DiGraph,
    origin: str,
    destination: str,
    node_data: Dict[str, Any],
    profile: str = "balanced"
) -> Optional[Dict[str, Any]]:
    if origin not in graph or destination not in graph:
        return None

    # Priority queue: (f_score, g_score, current_node, path, edge_history)
    frontier = []
    start_h = admissible_heuristic(origin, destination, node_data)
    heapq.heappush(frontier, (start_h, 0.0, origin, [origin], []))

    best_g: Dict[str, float] = {origin: 0.0}
    nodes_expanded = 0

    while frontier:
        f_score, g_score, current, path, edge_list = heapq.heappop(frontier)
        nodes_expanded += 1

        if current == destination:
            # Reconstruct route metrics
            total_dist_m = sum(e["length_m"] for e in edge_list)
            total_time_s = sum(e["base_travel_time_s"] for e in edge_list)

            # Aggregate risk: length-weighted average of segment risk scores
            if total_dist_m > 0:
                weighted_risk = sum(e["risk_score"] * e["length_m"] for e in edge_list) / total_dist_m
            else:
                weighted_risk = 0.0

            high_risk_segments = [e for e in edge_list if e.get("risk_category") == 2]
            med_risk_segments = [e for e in edge_list if e.get("risk_category") == 1]

            # Route coordinates for map polyline
            route_coords = []
            for node_id in path:
                n_info = node_data[node_id]
                route_coords.append([n_info["lat"], n_info["lon"]])

            return {
                "origin": origin,
                "destination": destination,
                "profile": profile,
                "nodes_in_path": path,
                "route_coordinates": route_coords,
                "edges": edge_list,
                "total_distance_m": round(total_dist_m, 1),
                "total_distance_km": round(total_dist_m / 1000.0, 2),
                "total_travel_time_s": round(total_time_s, 1),
                "total_travel_time_min": round(total_time_s / 60.0, 1),
                "aggregate_risk_score": round(weighted_risk, 3),
                "safety_score_100": round(max(0.0, (1.0 - weighted_risk) * 100.0), 1),
                "high_risk_segment_count": len(high_risk_segments),
                "medium_risk_segment_count": len(med_risk_segments),
                "nodes_expanded": nodes_expanded,
                "total_cost": round(g_score, 2)
            }

        if g_score > best_g.get(current, float('inf')):
            continue

        for neighbor in graph.neighbors(current):
            edge_attrs = graph.get_edge_data(current, neighbor)
            if not edge_attrs:
                continue

            # Respect road closure accessibility rule
            if edge_attrs.get("is_blocked", False):
                continue

            length_m = edge_attrs.get("length_m", 1000.0)
            speed_kmh = edge_attrs.get("speed_limit_kmh", 50.0)
            risk_score = edge_attrs.get("risk_score", 0.1)
            risk_cat = edge_attrs.get("risk_category", 0)

            step_cost = calculate_edge_cost(length_m, speed_kmh, risk_score, risk_cat, profile)
            new_g = g_score + step_cost

            if new_g < best_g.get(neighbor, float('inf')):
                best_g[neighbor] = new_g
                h = admissible_heuristic(neighbor, destination, node_data)
                f = new_g + h

                edge_record = {
                    "edge_id": edge_attrs.get("id", f"{current}->{neighbor}"),
                    "from_node": current,
                    "to_node": neighbor,
                    "road_name": edge_attrs.get("road_name", "Local Road"),
                    "road_type": edge_attrs.get("road_type", "secondary"),
                    "length_m": length_m,
                    "speed_limit_kmh": speed_kmh,
                    "base_travel_time_s": round(calculate_base_travel_time(length_m, speed_kmh), 1),
                    "risk_category": risk_cat,
                    "risk_label": edge_attrs.get("risk_label", "Low Risk"),
                    "risk_score": risk_score,
                    "probabilities": edge_attrs.get("probabilities", {"low": 1.0, "medium": 0.0, "high": 0.0}),
                    "is_blocked": edge_attrs.get("is_blocked", False)
                }

                heapq.heappush(
                    frontier,
                    (f, new_g, neighbor, path + [neighbor], edge_list + [edge_record])
                )

    return None
