"""
Risk Prediction & Road Segments API Endpoints
=============================================
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any, Optional

from app.schemas.route_schemas import RiskPredictRequest, SegmentBlockToggleRequest
from app.services.ml_service import predict_segment_risk
from app.services.weather_service import get_weather_for_coordinates
from app.services.graph_service import (
    build_enriched_graph,
    set_segment_blocked,
    get_blocked_segments,
    clear_blocked_segments
)

router = APIRouter(prefix="/api/risk", tags=["Risk Analysis"])

@router.get("/segments")
async def get_network_segments(
    rainfall_override: Optional[float] = None,
    wind_override: Optional[float] = None
):
    try:
        if rainfall_override is not None or wind_override is not None:
            weather = {
                "rainfall_intensity_mmh": rainfall_override if rainfall_override is not None else 25.0,
                "wind_speed_kmh": wind_override if wind_override is not None else 25.0,
                "temperature_c": 25.0,
                "source": "api-param-simulation"
            }
        else:
            weather = await get_weather_for_coordinates(30.28, 78.18)

        _, nodes, edges = build_enriched_graph(weather_data=weather)

        # Categorize
        high = [e for e in edges if e["risk_category"] == 2]
        med = [e for e in edges if e["risk_category"] == 1]
        low = [e for e in edges if e["risk_category"] == 0]

        return {
            "total_segments": len(edges),
            "weather_context": weather,
            "distribution": {
                "low_risk_count": len(low),
                "medium_risk_count": len(med),
                "high_risk_count": len(high)
            },
            "segments": edges
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch road segments: {str(e)}")

@router.post("/predict")
async def predict_custom_segment(req: RiskPredictRequest):
    try:
        res = predict_segment_risk(
            rainfall_mmh=req.rainfall_intensity_mmh,
            wind_kmh=req.wind_speed_kmh,
            temp_c=req.temperature_c,
            historical_incidents=req.historical_incidents,
            road_type=req.road_type,
            road_length_m=req.road_length_m,
            elevation_m=req.elevation_m,
            flood_susceptibility=req.flood_susceptibility
        )
        return {
            "input": req.model_dump(),
            "prediction": res
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@router.post("/toggle-block")
async def toggle_segment_block(req: SegmentBlockToggleRequest):
    try:
        set_segment_blocked(req.segment_id, req.is_blocked)
        return {
            "success": True,
            "segment_id": req.segment_id,
            "is_blocked": req.is_blocked,
            "currently_blocked": list(get_blocked_segments())
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Block toggle failed: {str(e)}")

@router.post("/clear-blocks")
async def reset_blocked_segments():
    try:
        clear_blocked_segments()
        return {"success": True, "message": "All road closure overrides cleared."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/blocked")
async def fetch_blocked_segments():
    return {"blocked_segment_ids": list(get_blocked_segments())}
