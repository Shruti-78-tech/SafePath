# SafePath: Risk-Aware Essential Supply Delivery Route Planning System

**Problem Statement ID:** SIH26002  
**Event:** Smart India Hackathon 2026  
**System Name:** SafePath AI

---

## 1. Executive Summary

During natural disasters (monsoon flooding, severe cloudbursts, cyclones, landslides), critical supply delivery convoys (carrying drinking water, rations, medical supplies, and trauma equipment) face perilous disruptions. Traditional navigation systems rely on shortest-distance heuristics that frequently direct emergency vehicles through low-lying river causeways and impassable slip zones.

**SafePath AI** is an AI-powered emergency logistics decision-support web application that combines:
1. **Supervised Machine Learning (Random Forest)** to estimate road-segment disruption risk based on live hydro-meteorological telemetries and infrastructure vulnerabilities.
2. **Admissible Risk-Aware A* Search** to discover optimal delivery routes balancing distance, travel time, and safety.
3. **Transparent Rule-Based Reasoning** to enforce road closure policies, safety advisories, and explainable distance-risk trade-offs.
4. **A Goal-Based Intelligent Agent** orchestrating a 9-stage autonomous decision lifecycle.
5. **Interactive OpenStreetMap Geospatial Maps** powered by Leaflet and React.

---

## 2. Technology Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Leaflet, React-Leaflet, Recharts, Axios, Lucide React
- **Backend**: Python 3.11, FastAPI, Pydantic V2, NetworkX, Scikit-learn, NumPy, Pandas, Joblib
- **Data & Telemetry**: OpenStreetMap road network data, Open-Meteo REST API, reproducible physics-grounded disaster dataset
- **Storage**: SQLite 3 for persistent route history and road closures

---

## 3. Quick Start & Execution Guide

### Prerequisites
- **Python 3.11** installed and on system PATH (`py -3.11 -V`)
- **Node.js 18+** and **npm** (`node -v`)

### Step 1: Clone or Navigate to the Workspace
```powershell
cd "C:\Users\Shruti Bondya\.gemini\antigravity\scratch\risk-aware-delivery"
```

### Step 2: Set Up Backend
```powershell
cd backend
py -3.11 -m pip install -r requirements.txt
```

#### Train the ML Model & Generate Metrics
```powershell
py -3.11 ml/train_model.py
```
*Outputs: 84% test accuracy, 0.7777 macro F1, serialized to `backend/ml/saved_models/`.*

#### Run Automated Tests
```powershell
$env:PYTHONPATH = "C:\Users\Shruti Bondya\.gemini\antigravity\scratch\risk-aware-delivery\backend"
py -3.11 -m pytest tests -v
```
*(All 11 automated unit and integration tests will pass).*

#### Start the FastAPI Server
```powershell
py -3.11 -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```
*API Swagger Documentation is available at: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)*

---

### Step 3: Set Up and Start Frontend
In a second terminal:
```powershell
cd "C:\Users\Shruti Bondya\.gemini\antigravity\scratch\risk-aware-delivery\frontend"
npm install
npm run dev
```
*Frontend will be running at: [http://127.0.0.1:5173/](http://127.0.0.1:5173/)*

---

## 4. Key Application Features & Demonstration Walkthrough

1. **Executive Dashboard (`/dashboard`)**:
   - System KPIs: Total route dispatches, high-risk segments count, average safety score, and disruption risk probability.
   - Interactive Recharts Donut & Bar charts for road classification distribution.
   - Recent dispatch activity with one-click route inspection.

2. **Interactive Route Planner (`/planner`)**:
   - Origin & Destination selection with built-in emergency presets (e.g., *ISBT to AIIMS Trauma*, *Rajpur to Helipad*).
   - Profile toggles: **Fastest** (baseline shortest), **Balanced**, and **Safest** (maximum avoidance).
   - **Severe Weather Hazard Simulator**: Adjust rainfall intensity (0-150 mm/h) and wind speed (0-120 km/h) sliders in real time to witness dynamic route adaptation!
   - **Dynamic Road Closures**: Click any corridor on the Leaflet map to simulate a roadblock/landslide; watch the A* algorithm immediately reroute.
   - Simultaneous rendering of **Recommended Route** (solid blue) and **Baseline Route** (dashed purple).

3. **Risk Analysis & ML Predictor (`/risk`)**:
   - Filterable inventory of all 42 road corridors with search and road type classification.
   - **Interactive ML Sandbox Form**: Enter arbitrary precipitation, wind, elevation, and flood susceptibility parameters to get instant predictions and class probabilities.
   - Feature Importance ranking chart.

4. **Route Comparison & Benchmarking (`/comparison`)**:
   - Side-by-side metric scorecard showing $\Delta$ distance, $\Delta$ travel time, and $\%$ risk reduction.
   - Quantified explanation justifying the safety dividend of the recommended detour.

5. **Agent Explainability & Decision Audit (`/explainability`)**:
   - Step-by-step interactive timeline of the Goal-Based Intelligent Agent's 9-stage lifecycle.
   - Inspection of triggered domain rules and evidence payloads.

6. **Model Evaluation (`/evaluation`)**:
   - Test accuracy (84%), Macro F1 (0.7777), Weighted F1 (0.8438).
   - $3 \times 3$ Confusion Matrix with heat intensity showing 0 false negatives on high-risk hazards.
   - Per-class precision, recall, and support.

7. **Route History Log (`/history`)**:
   - SQLite dispatch database table with timestamped records.
   - "Open in Map" button to re-visualize historical dispatches on the Leaflet map.

8. **System Methodology & Architecture (`/about`)**:
   - Mathematical formulation of risk-aware A* edge costs and proof of heuristic admissibility.
   - Multi-tier architectural diagrams and disaster deployment guidance.

---

## 5. Algorithmic Formulation

### Edge Cost Function
$$ \text{Cost}(e) = \text{base\_time}(e) \times \left(1.0 + w_{\text{profile}} \times R(e) \times \gamma(e)\right) $$

### Admissible Heuristic
$$ h(n, \text{goal}) = \frac{\text{haversine\_distance}(n, \text{goal})}{v_{\max}} $$
Since $h(n) \le \text{true minimal cost}$, the A* search is mathematically proven to be admissible and monotone.

---

## 6. Project Directory Structure

```
risk-aware-delivery/
├── frontend/
│   ├── src/
│   │   ├── components/         # MapComponent, Sidebar, Header, RiskBadge
│   │   ├── pages/              # 8 application pages
│   │   ├── services/api.js     # Axios REST client
│   │   ├── App.jsx             # Master application shell
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
├── backend/
│   ├── app/
│   │   ├── main.py             # FastAPI entrypoint
│   │   ├── api/                # routes.py, risk.py, model.py, dashboard.py
│   │   ├── services/           # weather_service, ml_service, graph_service
│   │   ├── algorithms/         # astar.py, cost_functions.py
│   │   ├── rules/              # rule_engine.py
│   │   ├── agents/             # routing_agent.py (Goal-Based Agent)
│   │   ├── schemas/            # route_schemas.py (Pydantic V2)
│   │   └── database/           # db.py (SQLite 3)
│   ├── ml/
│   │   ├── generate_dataset.py # Synthetic disaster dataset generator
│   │   ├── random_forest.py    # Native RF classifier & metrics
│   │   ├── train_model.py      # Training & evaluation pipeline
│   │   └── evaluate_model.py   # Standalone CLI validation
│   ├── tests/                  # 11 automated test cases (pytest)
│   ├── requirements.txt
│   └── .env.example
├── data/
│   ├── README.md               # Dataset documentation
│   ├── road_disruption_dataset.csv
│   ├── sample_network.json     # Dehradun-Rishikesh corridor network
│   └── delivery_system.db      # SQLite 3 database
├── docs/
│   ├── architecture.md         # System architecture & mermaid diagrams
│   ├── methodology.md          # A* admissibility proof & algorithms
│   └── evaluation.md           # Model scorecard & confusion matrix
└── README.md
```

---

## 7. Verification & Acceptance Checklist

- [x] Frontend runs successfully on Vite (`http://127.0.0.1:5173`)
- [x] FastAPI backend runs successfully (`http://127.0.0.1:8000`)
- [x] Random Forest model trained, saved, and loaded with Joblib
- [x] 42 road corridors dynamically classified with class probabilities
- [x] Risk-Aware A* algorithm produces optimal route with admissible heuristic
- [x] Baseline vs Risk-Aware routes compared and quantified
- [x] Goal-based intelligent agent produces explainable 9-stage audit trail
- [x] Interactive Leaflet map displays nodes, color-coded edges, and polylines
- [x] Route requests saved to SQLite and retrievable in Route History
- [x] Model evaluation metrics computed from isolated test set (84% accuracy)
- [x] Weather telemetries integrate Open-Meteo with graceful offline simulation fallback
- [x] 11/11 automated pytest test cases pass cleanly
