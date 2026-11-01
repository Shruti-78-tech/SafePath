"""
Standalone Model Evaluation & Inference Verification Script
===========================================================
Loads the persisted Random Forest model and validates predictions
on test examples and edge scenarios.
"""

import os
import sys
import json
import joblib
import numpy as np

current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from ml.train_model import FEATURE_NAMES, load_data

def evaluate():
    model_path = os.path.join(current_dir, "saved_models", "random_forest_disruption.joblib")
    metrics_path = os.path.join(current_dir, "saved_models", "model_metrics.json")

    if not os.path.exists(model_path) or not os.path.exists(metrics_path):
        print("Model or metrics not found! Please run train_model.py first.")
        return False

    model = joblib.load(model_path)
    with open(metrics_path, "r", encoding="utf-8") as f:
        metrics = json.load(f)

    print(f"Loaded model: {type(model).__name__} with {len(model.trees)} trees")
    print(f"Reported Accuracy: {metrics['accuracy'] * 100:.2f}%")
    print(f"Reported Macro F1: {metrics['macro_f1']:.4f}")

    # Test Scenarios
    test_cases = [
        {
            "name": "Severe Flood Hazard (Lowland tertiary road under torrential monsoon)",
            "features": [95.0, 45.0, 24.0, 6, 4, 850.0, 80.0, 0.85, (95*45)/100, 0.85*(95/50)],
            "expected_risk": "High Risk (2)"
        },
        {
            "name": "Clear Weather Highway (Motorway under sunny conditions)",
            "features": [0.0, 12.0, 28.0, 0, 0, 2200.0, 350.0, 0.10, 0.0, 0.0],
            "expected_risk": "Low Risk (0)"
        },
        {
            "name": "Moderate Mountain Rain (Secondary mountain corridor)",
            "features": [32.0, 28.0, 18.0, 2, 3, 1100.0, 1250.0, 0.35, (32*28)/100, 0.35*(32/50)],
            "expected_risk": "Medium Risk (1)"
        }
    ]

    print("\n--- Verifying Predictions on Key Edge Scenarios ---")
    for case in test_cases:
        X_vec = np.array([case["features"]], dtype=float)
        pred_cat = int(model.predict(X_vec)[0])
        probs = model.predict_proba(X_vec)[0]
        label = ["Low Risk", "Medium Risk", "High Risk"][pred_cat]
        print(f"\nScenario: {case['name']}")
        print(f"Expected: {case['expected_risk']} | Predicted: {label} ({pred_cat})")
        print(f"Probabilities -> Low: {probs[0]:.3f}, Med: {probs[1]:.3f}, High: {probs[2]:.3f}")

    return True

if __name__ == "__main__":
    evaluate()
