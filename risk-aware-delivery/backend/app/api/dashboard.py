"""
Dashboard Statistics & System Data Status Endpoints
===================================================
"""

from fastapi import APIRouter, HTTPException
import os

from app.database.db import get_dashboard_summary, get_recent_routes
from app.services.graph_service import build_enriched_graph, get_blocked_segments
from app.services.weather_service import get_weather_for_coordinates
from app.services.ml_service import get_metrics_info

router = APIRouter(prefix="/api", tags=["Dashboard & System"])

@router.get("/dashboard/stats")
async def get_dashboard_stats():
    try:
        summary = get_dashboard_summary()
        weather = await get_weather_for_coordinates(30.28, 78.18)
        _, _, edges = build_enriched_graph(weather_data=weather)

        high_risk_edges = [e for e in edges if e["risk_category"] == 2]
        med_risk_edges = [e for e in edges if e["risk_category"] == 1]
        low_risk_edges = [e for e in edges if e["risk_category"] == 0]

        recent = get_recent_routes(limit=5)

        return {
            "total_route_requests": summary["total_route_requests"],
            "high_risk_segment_count": len(high_risk_edges),
            "medium_risk_segment_count": len(med_risk_edges),
            "low_risk_segment_count": len(low_risk_edges),
            "total_network_segments": len(edges),
            "blocked_segments_count": len(get_blocked_segments()),
            "average_predicted_risk": summary["average_predicted_risk"],
            "average_safety_score": summary["average_safety_score"],
            "average_recommended_distance_km": summary["average_recommended_distance_km"],
            "current_weather": weather,
            "recent_requests": recent,
            "risk_distribution": [
                {"name": "Low Risk", "count": len(low_risk_edges), "color": "#10b981"},
                {"name": "Medium Risk", "count": len(med_risk_edges), "color": "#f59e0b"},
                {"name": "High Risk", "count": len(high_risk_edges), "color": "#ef4444"}
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load dashboard stats: {str(e)}")

@router.get("/data/status")
async def get_data_status():
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    data_dir = os.path.join(os.path.dirname(base_dir), "data")
    dataset_csv = os.path.join(data_dir, "road_disruption_dataset.csv")
    db_file = os.path.join(data_dir, "delivery_system.db")
    model_file = os.path.join(base_dir, "ml", "saved_models", "random_forest_disruption.joblib")

    weather = await get_weather_for_coordinates(30.28, 78.18)
    metrics = get_metrics_info()

    return {
        "status": "OPERATIONAL",
        "weather_service": {
            "source": weather.get("source"),
            "is_fallback": weather.get("is_fallback", False),
            "last_check": weather.get("timestamp")
        },
        "dataset": {
            "exists": os.path.exists(dataset_csv),
            "path": dataset_csv,
            "samples": metrics.get("training_samples", 1200) + metrics.get("total_test_samples", 300)
        },
        "machine_learning_model": {
            "type": "RandomForestClassifier",
            "accuracy": metrics.get("accuracy"),
            "macro_f1": metrics.get("macro_f1"),
            "model_persisted": os.path.exists(model_file)
        },
        "storage": {
            "database": "SQLite 3",
            "db_exists": os.path.exists(db_file),
            "path": db_file
        }
    }
