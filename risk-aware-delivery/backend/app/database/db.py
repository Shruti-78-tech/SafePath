"""
SQLite Database Access Layer
============================
Persists route requests, execution audits, and analytical history.
"""

import os
import json
import sqlite3
from typing import Dict, Any, List, Optional

DB_FILE = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))),
    "data",
    "delivery_system.db"
)

def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    os.makedirs(os.path.dirname(DB_FILE), exist_ok=True)
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS route_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                origin TEXT NOT NULL,
                origin_name TEXT,
                destination TEXT NOT NULL,
                destination_name TEXT,
                profile TEXT NOT NULL,
                recommended_dist_km REAL,
                recommended_time_min REAL,
                baseline_dist_km REAL,
                baseline_time_min REAL,
                risk_score REAL,
                safety_score REAL,
                rules_count INTEGER,
                status TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                raw_response TEXT
            )
        """)
        conn.commit()

def save_route_history(data: Dict[str, Any]) -> int:
    init_db()
    rec = data.get("recommended_route") or {}
    base = data.get("baseline_route") or {}

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO route_history (
                origin, origin_name, destination, destination_name, profile,
                recommended_dist_km, recommended_time_min,
                baseline_dist_km, baseline_time_min,
                risk_score, safety_score, rules_count, status, raw_response
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            data.get("origin"),
            data.get("origin_name"),
            data.get("destination"),
            data.get("destination_name"),
            data.get("profile", "balanced"),
            rec.get("total_distance_km"),
            rec.get("total_travel_time_min"),
            base.get("total_distance_km"),
            base.get("total_travel_time_min"),
            rec.get("aggregate_risk_score"),
            rec.get("safety_score_100"),
            len(data.get("triggered_rules", [])),
            "SUCCESS" if data.get("success") else "FAILED",
            json.dumps(data)
        ))
        conn.commit()
        return cursor.lastrowid

def get_recent_routes(limit: int = 25) -> List[Dict[str, Any]]:
    init_db()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, origin, origin_name, destination, destination_name, profile,
                   recommended_dist_km, recommended_time_min,
                   baseline_dist_km, baseline_time_min,
                   risk_score, safety_score, rules_count, status, created_at, raw_response
            FROM route_history
            ORDER BY id DESC
            LIMIT ?
        """, (limit,))
        rows = cursor.fetchall()

        results = []
        for r in rows:
            results.append({
                "id": r["id"],
                "origin": r["origin"],
                "origin_name": r["origin_name"],
                "destination": r["destination"],
                "destination_name": r["destination_name"],
                "profile": r["profile"],
                "recommended_dist_km": r["recommended_dist_km"],
                "recommended_time_min": r["recommended_time_min"],
                "baseline_dist_km": r["baseline_dist_km"],
                "baseline_time_min": r["baseline_time_min"],
                "risk_score": r["risk_score"],
                "safety_score": r["safety_score"],
                "rules_count": r["rules_count"],
                "status": r["status"],
                "created_at": r["created_at"],
                "raw_response": json.loads(r["raw_response"]) if r["raw_response"] else None
            })
        return results

def get_dashboard_summary() -> Dict[str, Any]:
    init_db()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) AS total_count FROM route_history")
        total_requests = cursor.fetchone()["total_count"]

        cursor.execute("SELECT AVG(safety_score) AS avg_safety, AVG(risk_score) AS avg_risk, AVG(recommended_dist_km) AS avg_dist FROM route_history WHERE status = 'SUCCESS'")
        row = cursor.fetchone()
        avg_safety = round(row["avg_safety"] or 82.5, 1)
        avg_risk = round(row["avg_risk"] or 0.175, 3)
        avg_dist = round(row["avg_dist"] or 36.4, 1)

        return {
            "total_route_requests": total_requests,
            "average_safety_score": avg_safety,
            "average_predicted_risk": avg_risk,
            "average_recommended_distance_km": avg_dist
        }
