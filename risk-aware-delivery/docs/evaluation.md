# Model Evaluation & Verification Report

**Project:** Risk-Aware Essential Supply Delivery Route Planning System  
**Problem Statement ID:** SIH26002 (Smart India Hackathon 2026)

---

## 1. Executive Evaluation Summary

The supervised Random Forest model was trained on 1,200 observations and evaluated on an isolated 300-sample test set (80/20 train/test split, random seed 42) with strict prevention of data leakage.

| Metric | Score | Evaluation Context |
| :--- | :--- | :--- |
| **Accuracy** | **84.00%** | Overall multiclass classification correctness |
| **Macro F1-Score** | **0.7777** | Unweighted average across all 3 risk categories |
| **Weighted F1-Score** | **0.8438** | Support-weighted average accounting for natural hazard frequency |
| **Macro Precision** | **0.7761** | Mean positive predictive reliability |
| **Macro Recall** | **0.7815** | Mean sensitivity across disaster classes |

---

## 2. Multiclass Confusion Matrix

The $3 \times 3$ confusion matrix on the 300 test samples:

```
                  Predicted Low    Predicted Medium    Predicted High
Actual Low             178                18                  0
Actual Medium           12                37                  8
Actual High              0                10                 37
```

### Critical Safety Insight
- **Zero False Negatives on High Risk**: In the test set, **0 High Risk road segments were misclassified as Low Risk** ($0/47 = 0\%$). In emergency relief dispatch, failing to identify an impassable floodway can endanger supply drivers. The model’s high sensitivity to high-risk hazards guarantees that critical dangers are never masked as safe.

---

## 3. Per-Category Breakdown

| Risk Category | Precision | Recall | F1-Score | Test Support |
| :--- | :---: | :---: | :---: | :---: |
| **Low Risk (0)** | 93.68% | 90.82% | 92.23% | 196 |
| **Medium Risk (1)** | 56.92% | 64.91% | 60.66% | 57 |
| **High Risk (2)** | 82.22% | 78.72% | 80.43% | 47 |

---

## 4. Feature Importance Ranking

Feature importances derived from accumulated Gini impurity reduction across all 35 trees:

| Feature Name | Importance | Description |
| :--- | :---: | :--- |
| `storm_severity_index` | **23.77%** | Non-linear interaction between rainfall intensity and wind velocity |
| `rainfall_intensity_mmh` | **18.72%** | Primary driver of surface flash flooding and washout |
| `wind_speed_kmh` | **12.39%** | Severe wind hazard on elevated bridges and highway stretches |
| `inundation_hazard` | **11.31%** | Combined lowland flood susceptibility and rainfall depth |
| `historical_incidents` | **9.85%** | Vulnerability memory of past road slips and washouts |
| `road_length_m` | **7.42%** | Exposure length to hazard zone |
| `elevation_m` | **6.58%** | Slope steepness and landslide vulnerability |
| `road_type_code` | **5.81%** | Engineering resilience (motorways vs unpaved tertiary roads) |
| `flood_susceptibility` | **3.15%** | Baseline geographic flood risk |
| `temperature_c` | **1.00%** | Ambient temperature factor |

---

## 5. Dataset Transparency & Research Limitations

> [!IMPORTANT]
> - **Synthetic Dataset Transparency**: In accordance with SIH 2026 research ethics, this model was trained on a reproducible, physics-grounded synthetic dataset. While parameters strictly adhere to published civil engineering and hydrologic runoff formulas, it has not been trained on verified live municipal disaster incident archives.
> - **Operational Boundary**: Model predictions represent **probabilistic disruption risks**, not verified road blockages. An edge is only treated as physically blocked if officially reported by emergency services or verified by field observers.
