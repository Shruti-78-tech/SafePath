"""
Machine Learning Model Evaluation & Insights Endpoints
======================================================
"""

from fastapi import APIRouter, HTTPException
from app.services.ml_service import get_metrics_info

router = APIRouter(prefix="/api/model", tags=["Model Analytics"])

@router.get("/metrics")
async def get_metrics():
    try:
        metrics = get_metrics_info()
        return metrics
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch model metrics: {str(e)}")

@router.get("/feature-importance")
async def get_feature_importance():
    try:
        metrics = get_metrics_info()
        return {
            "feature_importances": metrics.get("feature_importances", []),
            "hyperparameters": metrics.get("model_hyperparameters", {})
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch feature importance: {str(e)}")
