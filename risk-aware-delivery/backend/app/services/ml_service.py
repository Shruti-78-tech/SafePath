"""
Machine Learning Inference Service
==================================
Manages the Random Forest disruption risk classification model,
feature extraction from road segment and weather data, and predictions.
"""

import os
import json
import joblib
import numpy as np
from typing import Dict, Any, List, Optional

_MODEL = None
_METRICS = None

ROAD_TYPE_MAP = {
    "motorway": 0,
    "trunk": 1,
    "primary": 2,
    "secondary": 3,
    "tertiary": 4,
    "residential": 5
}

def get_model_and_metrics():
    global _MODEL, _METRICS
    if _MODEL is not None and _METRICS is not None:
        return _MODEL, _METRICS

    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    model_path = os.path.join(base_dir, "ml", "saved_models", "random_forest_disruption.joblib")
    metrics_path = os.path.join(base_dir, "ml", "saved_models", "model_metrics.json")

    if not os.path.exists(model_path) or not os.path.exists(metrics_path):
        from ml.train_model import train_and_evaluate
        _MODEL, _METRICS = train_and_evaluate()
        return _MODEL, _METRICS

    _MODEL = joblib.load(model_path)
    with open(metrics_path, "r", encoding="utf-8") as f:
        _METRICS = json.load(f)

    return _MODEL, _METRICS

def extract_features(
    rainfall_mmh: float,
    wind_kmh: float,
    temp_c: float,
    historical_incidents: int,
    road_type: str,
    road_length_m: float,
    elevation_m: float,
    flood_susceptibility: float
) -> np.ndarray:
    road_type_code = ROAD_TYPE_MAP.get(str(road_type).lower(), 3)
    storm_severity = (rainfall_mmh * wind_kmh) / 100.0
    inundation_hazard = flood_susceptibility * (rainfall_mmh / 50.0)

    features = [
        float(rainfall_mmh),
        float(wind_kmh),
        float(temp_c),
        float(historical_incidents),
        float(road_type_code),
        float(road_length_m),
        float(elevation_m),
        float(flood_susceptibility),
        float(storm_severity),
        float(inundation_hazard)
    ]
    return np.array([features], dtype=float)

def predict_segment_risk(
    rainfall_mmh: float,
    wind_kmh: float,
    temp_c: float,
    historical_incidents: int,
    road_type: str,
    road_length_m: float,
    elevation_m: float,
    flood_susceptibility: float
) -> Dict[str, Any]:
    model, _ = get_model_and_metrics()
    X = extract_features(
        rainfall_mmh, wind_kmh, temp_c, historical_incidents,
        road_type, road_length_m, elevation_m, flood_susceptibility
    )

    pred_cat = int(model.predict(X)[0])
    probs = model.predict_proba(X)[0]

    risk_labels = ["Low Risk", "Medium Risk", "High Risk"]
    label = risk_labels[pred_cat]

    # Normalized risk score between 0.0 and 1.0
    # 0.1 * P(Low) + 0.5 * P(Med) + 1.0 * P(High)
    risk_score = round(float(0.1 * probs[0] + 0.5 * probs[1] + 1.0 * probs[2]), 4)

    return {
        "risk_category": pred_cat,
        "risk_label": label,
        "risk_score": risk_score,
        "probabilities": {
            "low": round(float(probs[0]), 4),
            "medium": round(float(probs[1]), 4),
            "high": round(float(probs[2]), 4)
        }
    }

def get_metrics_info() -> Dict[str, Any]:
    _, metrics = get_model_and_metrics()
    return metrics
