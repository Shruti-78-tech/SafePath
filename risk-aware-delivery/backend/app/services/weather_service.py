"""
Weather Service with Open-Meteo Integration & Resilient Caching
==============================================================
Fetches real-time weather conditions from Open-Meteo API (free, open, no API key).
Implements timeout handling, local in-memory caching (15-min TTL), and transparent
fallback mode when external network is unavailable.
"""

import time
import httpx
from typing import Dict, Any, Optional

# In-memory cache: (lat, lon) -> (timestamp, data)
_WEATHER_CACHE: Dict[str, Any] = {}
CACHE_TTL_SECONDS = 900  # 15 minutes

async def get_weather_for_coordinates(lat: float, lon: float, force_refresh: bool = False) -> Dict[str, Any]:
    cache_key = f"{round(lat, 2)}_{round(lon, 2)}"
    now = time.time()

    if not force_refresh and cache_key in _WEATHER_CACHE:
        cached_time, cached_data = _WEATHER_CACHE[cache_key]
        if now - cached_time < CACHE_TTL_SECONDS:
            return {**cached_data, "source": "open-meteo-cache", "is_fallback": False}

    url = (
        f"https://api.open-meteo.com/v1/forecast"
        f"?latitude={lat}&longitude={lon}"
        f"&current=temperature_2m,relative_humidity_2m,precipitation,rain,wind_speed_10m"
    )

    try:
        async with httpx.AsyncClient(timeout=3.5) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                data = resp.json()
                current = data.get("current", {})
                weather_info = {
                    "temperature_c": float(current.get("temperature_2m", 25.0)),
                    "rainfall_intensity_mmh": float(current.get("precipitation", current.get("rain", 0.0))),
                    "wind_speed_kmh": float(current.get("wind_speed_10m", 15.0)),
                    "humidity_percent": float(current.get("relative_humidity_2m", 60.0)),
                    "source": "open-meteo-live",
                    "timestamp": current.get("time", time.strftime("%Y-%m-%dT%H:%M:%SZ")),
                    "is_fallback": False
                }
                _WEATHER_CACHE[cache_key] = (now, weather_info)
                return weather_info
    except Exception as e:
        # Transparent fallback if network is offline or throttled
        pass

    # Physics-grounded fallback
    fallback_data = {
        "temperature_c": 24.5,
        "rainfall_intensity_mmh": 42.0,  # Simulated monsoon condition for emergency demonstration
        "wind_speed_kmh": 38.0,
        "humidity_percent": 85.0,
        "source": "emergency-simulation-fallback",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "is_fallback": True,
        "fallback_reason": "Live weather API timed out or offline. Using calibrated emergency weather profile."
    }
    return fallback_data
