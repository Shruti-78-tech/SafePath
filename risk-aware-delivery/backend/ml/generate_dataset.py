"""
Dataset Generation Script for SIH26002
======================================
Generates a reproducible, physically grounded synthetic road disruption dataset.

Disruption risk is modeled on real meteorological, terrain, and road vulnerability principles:
- Inundation hazard: heavy rainfall over flood-prone lowland roads
- Slope instability / landslide: high elevation, steep terrain, heavy rain, historical washouts
- High wind vulnerability: exposed highways and bridges under gale-force winds
- Infrastructure quality: motorway/trunk roads resist minor flooding; tertiary/residential roads flood readily
"""

import os
import csv
import numpy as np

ROAD_TYPES = ["motorway", "trunk", "primary", "secondary", "tertiary", "residential"]
ROAD_TYPE_MAP = {rt: i for i, rt in enumerate(ROAD_TYPES)}

def generate_disruption_dataset(num_samples: int = 1500, random_seed: int = 42, output_path: str = None) -> str:
    rng = np.random.RandomState(random_seed)

    if output_path is None:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        output_path = os.path.join(base_dir, "data", "road_disruption_dataset.csv")

    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    rows = []
    headers = [
        "segment_id",
        "rainfall_intensity_mmh",
        "wind_speed_kmh",
        "temperature_c",
        "historical_incidents",
        "road_type",
        "road_type_code",
        "road_length_m",
        "elevation_m",
        "flood_susceptibility",
        "storm_severity_index",
        "inundation_hazard",
        "risk_category",
        "risk_label"
    ]

    for i in range(num_samples):
        segment_id = f"SEG_{i+1:05d}"

        # Weather conditions
        # Mix of calm weather (60%) and severe weather/cyclone/monsoon (40%)
        is_severe = rng.rand() < 0.4
        if is_severe:
            rainfall = float(np.clip(rng.gamma(shape=3.0, scale=20.0), 10.0, 150.0))
            wind = float(np.clip(rng.normal(loc=55.0, scale=22.0), 15.0, 120.0))
        else:
            rainfall = float(np.clip(rng.exponential(scale=6.0), 0.0, 30.0))
            wind = float(np.clip(rng.normal(loc=18.0, scale=10.0), 0.0, 45.0))

        temp = float(np.clip(rng.normal(loc=26.0, scale=7.0), 5.0, 46.0))

        # Road infrastructure & topology
        road_type = rng.choice(ROAD_TYPES, p=[0.10, 0.15, 0.25, 0.25, 0.15, 0.10])
        road_code = ROAD_TYPE_MAP[road_type]
        road_length = float(np.clip(rng.lognormal(mean=6.2, sigma=0.6), 60.0, 3500.0))
        elevation = float(np.clip(rng.normal(loc=450.0, scale=400.0), 15.0, 2600.0))

        # Susceptibility factors
        flood_susceptibility = float(np.clip(rng.beta(a=2.0, b=3.0) + (0.2 if elevation < 200 else -0.15), 0.0, 1.0))
        historical_incidents = int(np.clip(rng.poisson(lam=1.5 + (1.2 if flood_susceptibility > 0.6 else 0.0)), 0, 14))

        # Engineered features
        storm_severity = round((rainfall * wind) / 100.0, 2)
        inundation_hazard = round(flood_susceptibility * (rainfall / 50.0), 3)

        # Ground truth risk scoring formula
        risk_score = 0.0

        # Rainfall impact
        if rainfall > 70.0:
            risk_score += 3.5
        elif rainfall > 35.0:
            risk_score += 2.0
        elif rainfall > 15.0:
            risk_score += 0.8

        # Inundation impact
        if inundation_hazard > 1.2:
            risk_score += 3.8
        elif inundation_hazard > 0.6:
            risk_score += 2.0

        # Wind & storm
        if wind > 75.0:
            risk_score += 2.5
        elif wind > 50.0:
            risk_score += 1.2

        # Landslide risk (steep mountain roads + rain)
        if elevation > 1000.0 and rainfall > 45.0:
            risk_score += 2.5

        # Incident history vulnerability
        if historical_incidents >= 5:
            risk_score += 2.2
        elif historical_incidents >= 2:
            risk_score += 1.0

        # Infrastructure resilience
        if road_type in ["motorway", "trunk"]:
            risk_score -= 1.5
        elif road_type in ["tertiary", "residential"]:
            risk_score += 1.2

        # Stochastic environmental variance (10%)
        risk_score += rng.normal(loc=0.0, scale=0.7)

        # Categorize: 0 (Low), 1 (Medium), 2 (High)
        if risk_score >= 5.0:
            cat = 2
            label = "High Risk"
        elif risk_score >= 2.3:
            cat = 1
            label = "Medium Risk"
        else:
            cat = 0
            label = "Low Risk"

        rows.append([
            segment_id,
            round(rainfall, 2),
            round(wind, 2),
            round(temp, 1),
            historical_incidents,
            road_type,
            road_code,
            round(road_length, 1),
            round(elevation, 1),
            round(flood_susceptibility, 3),
            storm_severity,
            inundation_hazard,
            cat,
            label
        ])

    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(rows)

    print(f"Generated {len(rows)} samples saved to: {output_path}")
    counts = {0: 0, 1: 0, 2: 0}
    for r in rows:
        counts[r[12]] += 1
    print(f"Class distribution -> Low: {counts[0]} ({counts[0]/len(rows):.1%}), Medium: {counts[1]} ({counts[1]/len(rows):.1%}), High: {counts[2]} ({counts[2]/len(rows):.1%})")

    return output_path

if __name__ == "__main__":
    generate_disruption_dataset()
