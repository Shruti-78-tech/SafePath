import numpy as np
import pytest
from ml.random_forest import RandomForestClassifier, compute_metrics

def test_random_forest_classification():
    # Synthetic linearly separable clusters
    rng = np.random.RandomState(42)
    X0 = rng.normal(loc=-3.0, scale=0.5, size=(40, 4))
    X1 = rng.normal(loc=0.0, scale=0.5, size=(40, 4))
    X2 = rng.normal(loc=3.0, scale=0.5, size=(40, 4))
    X = np.vstack([X0, X1, X2])
    y = np.array([0]*40 + [1]*40 + [2]*40)

    rf = RandomForestClassifier(n_estimators=15, max_depth=5, random_state=42)
    rf.fit(X, y)

    preds = rf.predict(X)
    probs = rf.predict_proba(X)

    # Basic validity checks
    assert len(preds) == 120
    assert probs.shape == (120, 3)
    assert np.allclose(np.sum(probs, axis=1), 1.0)
    assert np.mean(preds == y) > 0.90
    assert len(rf.feature_importances_) == 4
    assert np.isclose(np.sum(rf.feature_importances_), 1.0)

def test_compute_metrics():
    y_true = np.array([0, 0, 1, 1, 2, 2])
    y_pred = np.array([0, 0, 1, 2, 2, 2])
    metrics = compute_metrics(y_true, y_pred)

    assert "accuracy" in metrics
    assert "macro_f1" in metrics
    assert "confusion_matrix" in metrics
    assert metrics["accuracy"] > 0.8
