import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_api_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "HEALTHY"
    assert data["problem_statement"] == "SIH26002"

def test_dashboard_stats():
    res = client.get("/api/dashboard/stats")
    assert res.status_code == 200
    data = res.json()
    assert "total_network_segments" in data
    assert "high_risk_segment_count" in data
    assert "risk_distribution" in data

def test_route_plan_endpoint():
    payload = {
        "origin": "DEPOT_MAIN",
        "destination": "HOSPITAL_AIIMS",
        "profile": "balanced"
    }
    res = client.post("/api/routes/plan", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["recommended_route"]["total_distance_km"] > 0
    assert "explanation" in data

def test_risk_predict_endpoint():
    payload = {
        "rainfall_intensity_mmh": 80.0,
        "wind_speed_kmh": 60.0,
        "temperature_c": 24.0,
        "historical_incidents": 5,
        "road_type": "tertiary",
        "road_length_m": 1200.0,
        "elevation_m": 250.0,
        "flood_susceptibility": 0.85
    }
    res = client.post("/api/risk/predict", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["prediction"]["risk_category"] == 2
    assert data["prediction"]["risk_label"] == "High Risk"

def test_model_metrics_endpoint():
    res = client.get("/api/model/metrics")
    assert res.status_code == 200
    data = res.json()
    assert "accuracy" in data
    assert "confusion_matrix" in data
    assert "feature_importances" in data
