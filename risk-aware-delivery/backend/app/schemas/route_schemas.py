"""
Pydantic Schemas for Request & Response Validation
==================================================
"""

from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

class RoutePlanRequest(BaseModel):
    origin: str = Field(..., example="DEPOT_MAIN")
    destination: str = Field(..., example="HOSPITAL_AIIMS")
    profile: str = Field("balanced", example="balanced", description="fastest | balanced | safest")
    custom_blocked: Optional[List[str]] = Field(default=None, description="List of segment IDs to exclude")
    weather_override: Optional[Dict[str, float]] = Field(default=None, description="Optional simulation overrides")

class RiskPredictRequest(BaseModel):
    rainfall_intensity_mmh: float = Field(35.0, ge=0.0, le=300.0)
    wind_speed_kmh: float = Field(30.0, ge=0.0, le=200.0)
    temperature_c: float = Field(26.0, ge=-30.0, le=60.0)
    historical_incidents: int = Field(2, ge=0, le=30)
    road_type: str = Field("primary", example="primary")
    road_length_m: float = Field(1500.0, ge=10.0, le=20000.0)
    elevation_m: float = Field(550.0, ge=0.0, le=6000.0)
    flood_susceptibility: float = Field(0.45, ge=0.0, le=1.0)

class SegmentBlockToggleRequest(BaseModel):
    segment_id: str = Field(..., example="E15")
    is_blocked: bool = Field(True)

class ClearBlocksRequest(BaseModel):
    pass
