"""
Road Network Graph Service
==========================
Constructs and manages the NetworkX road graph from OpenStreetMap / bundled data.
Enriches edges with ML-predicted disruption risks and tracks dynamic closures.
"""

import os
import json
import networkx as nx
from typing import Dict, Any, List, Set, Optional, Tuple

from app.services.ml_service import predict_segment_risk

_CACHED_GRAPH: Optional[nx.DiGraph] = None
_CACHED_NODES: Optional[Dict[str, Any]] = None
_CACHED_RAW_EDGES: Optional[List[Dict[str, Any]]] = None
_BLOCKED_SEGMENTS: Set[str] = set()

def load_base_network() -> Tuple[Dict[str, Any], List[Dict[str, Any]]]:
    global _CACHED_NODES, _CACHED_RAW_EDGES
    if _CACHED_NODES is not None and _CACHED_RAW_EDGES is not None:
        return _CACHED_NODES, _CACHED_RAW_EDGES

    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    json_path = os.path.join(base_dir, "data", "sample_network.json")

    with open(json_path, "r", encoding="utf-8") as f:
        network_data = json.load(f)

    _CACHED_NODES = network_data["nodes"]
    _CACHED_RAW_EDGES = network_data["edges"]
    return _CACHED_NODES, _CACHED_RAW_EDGES

def set_segment_blocked(edge_id: str, is_blocked: bool = True):
    global _BLOCKED_SEGMENTS
    if is_blocked:
        _BLOCKED_SEGMENTS.add(edge_id)
    else:
        _BLOCKED_SEGMENTS.discard(edge_id)

def get_blocked_segments() -> Set[str]:
    return set(_BLOCKED_SEGMENTS)

def clear_blocked_segments():
    global _BLOCKED_SEGMENTS
    _BLOCKED_SEGMENTS.clear()

def build_enriched_graph(
    weather_data: Dict[str, Any],
    custom_blocked: Optional[List[str]] = None
) -> Tuple[nx.DiGraph, Dict[str, Any], List[Dict[str, Any]]]:
    nodes, edges = load_base_network()
    G = nx.DiGraph()

    for node_id, node_info in nodes.items():
        G.add_node(
            node_id,
            name=node_info["name"],
            lat=node_info["lat"],
            lon=node_info["lon"],
            elevation_m=node_info.get("elevation_m", 500.0)
        )

    all_blocked = set(_BLOCKED_SEGMENTS)
    if custom_blocked:
        all_blocked.update(custom_blocked)

    rain = float(weather_data.get("rainfall_intensity_mmh", 20.0))
    wind = float(weather_data.get("wind_speed_kmh", 25.0))
    temp = float(weather_data.get("temperature_c", 25.0))

    enriched_edges = []

    for raw_edge in edges:
        edge_id = raw_edge["id"]
        u = raw_edge["u"]
        v = raw_edge["v"]
        length_m = raw_edge["length_m"]
        speed_kmh = raw_edge["speed_limit_kmh"]
        road_type = raw_edge["road_type"]
        flood_susc = raw_edge["flood_susceptibility"]
        hist_incidents = raw_edge["historical_incidents"]
        elevation_m = raw_edge.get("elevation_m", 500.0)

        # Run ML model inference for this edge under current weather
        risk_info = predict_segment_risk(
            rainfall_mmh=rain,
            wind_kmh=wind,
            temp_c=temp,
            historical_incidents=hist_incidents,
            road_type=road_type,
            road_length_m=length_m,
            elevation_m=elevation_m,
            flood_susceptibility=flood_susc
        )

        is_blocked = edge_id in all_blocked

        edge_attrs = {
            "id": edge_id,
            "u": u,
            "v": v,
            "road_name": raw_edge["road_name"],
            "road_type": road_type,
            "length_m": length_m,
            "speed_limit_kmh": speed_kmh,
            "elevation_m": elevation_m,
            "flood_susceptibility": flood_susc,
            "historical_incidents": hist_incidents,
            "risk_category": risk_info["risk_category"],
            "risk_label": risk_info["risk_label"],
            "risk_score": risk_info["risk_score"],
            "probabilities": risk_info["probabilities"],
            "is_blocked": is_blocked,
            "coords": [
                [nodes[u]["lat"], nodes[u]["lon"]],
                [nodes[v]["lat"], nodes[v]["lon"]]
            ]
        }

        G.add_edge(u, v, **edge_attrs)
        enriched_edges.append(edge_attrs)

    return G, nodes, enriched_edges
