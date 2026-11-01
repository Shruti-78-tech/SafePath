# Road Disruption Dataset Documentation (SIH 2026 - SIH26002)

## Overview
This dataset supports the **Risk-Aware Essential Supply Delivery Route Planning System for Decision Support** (Smart India Hackathon 2026). It models road network segment disruption vulnerabilities during adverse weather, monsoon flooding, and terrain-related emergency events.

## Transparency & Data Provenance Notice
> [!IMPORTANT]
> In accordance with SIH 2026 engineering and research guidelines, this dataset is a **reproducible, physics-grounded synthetic dataset**. It synthesizes hydrological, meteorological, and infrastructure parameters to realistically model disaster disruptions.
> **Limitation Disclaimer**: This dataset has been calibrated against published civil engineering and disaster vulnerability principles; it has not been validated against live verified municipal emergency incident dispatch logs. For real-world deployment, this model must be fine-tuned on verified district administration disruption archives.

## Dataset Structure
- **File**: `data/road_disruption_dataset.csv`
- **Total Records**: 1,500 road segments
- **Target Variable**: `risk_category`
  - `0`: Low Risk (Normal passage, minor or no disruption)
  - `1`: Medium Risk (Impeded travel, partial flooding or high winds, caution required)
  - `2`: High Risk (Severe waterlogging, landslide hazard, washout, impassable)

## Feature Dictionary

| Feature Name | Type | Unit / Range | Description |
| :--- | :--- | :--- | :--- |
| `segment_id` | String | `SEG_00001` - `SEG_01500` | Unique road segment identifier |
| `rainfall_intensity_mmh` | Float | 0.0 - 150.0 mm/h | Rate of precipitation during event |
| `wind_speed_kmh` | Float | 0.0 - 120.0 km/h | Sustained wind velocity |
| `temperature_c` | Float | 5.0 - 46.0 °C | Ambient air temperature |
| `historical_incidents` | Integer | 0 - 14 | Historical frequency of past closures/accidents |
| `road_type` | Categorical | motorway, trunk, primary, secondary, tertiary, residential | Functional highway classification |
| `road_type_code` | Integer | 0 to 5 | Ordinal encoding of highway hierarchy |
| `road_length_m` | Float | 60 - 3500 m | Segment physical distance |
| `elevation_m` | Float | 15 - 2600 m | Topographic elevation above sea level |
| `flood_susceptibility` | Float | 0.0 - 1.0 | Geographic lowland flood vulnerability index |
| `storm_severity_index` | Float | $\frac{\text{rain} \times \text{wind}}{100}$ | Combined hydro-meteorological storm energy |
| `inundation_hazard` | Float | $\text{flood\_susceptibility} \times \frac{\text{rain}}{50}$ | Localized water accumulation potential |

## Class Distribution
- **Low Risk (0)**: ~62.1% (932 segments)
- **Medium Risk (1)**: ~22.1% (331 segments)
- **High Risk (2)**: ~15.8% (237 segments)

Balanced class weighting is applied during Random Forest training to prevent bias towards the majority class and ensure high sensitivity to high-risk hazards.
