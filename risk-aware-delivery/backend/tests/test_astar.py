import networkx as nx
from app.algorithms.astar import find_risk_aware_path, haversine_distance_m
from app.algorithms.cost_functions import calculate_edge_cost

def test_haversine():
    # Delhi to Rishikesh distance is ~190-210 km
    d = haversine_distance_m(28.6139, 77.2090, 30.0869, 78.2676)
    assert 180000 < d < 220000

def test_astar_route_optimization():
    G = nx.DiGraph()
    nodes = {
        "A": {"name": "Start", "lat": 30.0, "lon": 78.0},
        "B": {"name": "Risky Direct", "lat": 30.05, "lon": 78.05},
        "C": {"name": "Safe Detour", "lat": 30.08, "lon": 78.02},
        "D": {"name": "Destination", "lat": 30.1, "lon": 78.1}
    }

    # Direct path: A -> B -> D (Short, but High Risk)
    G.add_edge("A", "B", id="E1", length_m=5000, speed_limit_kmh=50, risk_category=2, risk_score=0.9, is_blocked=False)
    G.add_edge("B", "D", id="E2", length_m=5000, speed_limit_kmh=50, risk_category=2, risk_score=0.9, is_blocked=False)

    # Detour path: A -> C -> D (Longer, but Low Risk)
    G.add_edge("A", "C", id="E3", length_m=6500, speed_limit_kmh=60, risk_category=0, risk_score=0.1, is_blocked=False)
    G.add_edge("C", "D", id="E4", length_m=6500, speed_limit_kmh=60, risk_category=0, risk_score=0.1, is_blocked=False)

    # Fastest profile should pick shorter risky path
    fastest_route = find_risk_aware_path(G, "A", "D", nodes, profile="fastest")
    assert fastest_route["nodes_in_path"] == ["A", "B", "D"]
    assert fastest_route["total_distance_m"] == 10000

    # Safest profile should pick detour path
    safest_route = find_risk_aware_path(G, "A", "D", nodes, profile="safest")
    assert safest_route["nodes_in_path"] == ["A", "C", "D"]
    assert safest_route["total_distance_m"] == 13000
    assert safest_route["safety_score_100"] > fastest_route["safety_score_100"]
