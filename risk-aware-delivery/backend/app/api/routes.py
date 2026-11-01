"""
Route Planning & Navigation API Endpoints
=========================================
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any

from app.schemas.route_schemas import RoutePlanRequest
from app.agents.routing_agent import DeliveryRoutingAgent
from app.services.graph_service import load_base_network
from app.database.db import save_route_history, get_recent_routes

router = APIRouter(prefix="/api/routes", tags=["Routes"])
agent = DeliveryRoutingAgent()

@router.post("/plan")
async def plan_route(req: RoutePlanRequest):
    try:
        result = await agent.execute_plan(
            origin=req.origin,
            destination=req.destination,
            profile=req.profile,
            custom_blocked=req.custom_blocked,
            weather_override=req.weather_override
        )

        # Save to database
        try:
            history_id = save_route_history(result)
            result["history_id"] = history_id
        except Exception as db_err:
            result["db_save_warning"] = str(db_err)

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Routing execution failed: {str(e)}")

@router.post("/compare")
async def compare_routes(req: RoutePlanRequest):
    try:
        result = await agent.execute_plan(
            origin=req.origin,
            destination=req.destination,
            profile=req.profile,
            custom_blocked=req.custom_blocked,
            weather_override=req.weather_override
        )
        return {
            "origin": result["origin"],
            "destination": result["destination"],
            "recommended_route": result["recommended_route"],
            "baseline_route": result["baseline_route"],
            "comparison": result["comparison"],
            "explanation": result["explanation"],
            "triggered_rules": result["triggered_rules"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Comparison failed: {str(e)}")

@router.get("/history")
async def fetch_history(limit: int = 20):
    try:
        records = get_recent_routes(limit=limit)
        return {"total": len(records), "history": records}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch history: {str(e)}")

@router.get("/nodes")
async def fetch_nodes():
    nodes, _ = load_base_network()
    node_list = []
    for nid, ninfo in nodes.items():
        node_list.append({
            "id": nid,
            "name": ninfo["name"],
            "lat": ninfo["lat"],
            "lon": ninfo["lon"],
            "elevation_m": ninfo.get("elevation_m", 500)
        })
    return {"count": len(node_list), "nodes": node_list}
