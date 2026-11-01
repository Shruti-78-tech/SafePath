import asyncio
from app.agents.routing_agent import DeliveryRoutingAgent

def test_agent_execution_safest_profile():
    agent = DeliveryRoutingAgent()
    result = asyncio.run(agent.execute_plan(
        origin="DEPOT_MAIN",
        destination="HOSPITAL_AIIMS",
        profile="safest",
        weather_override={"rainfall_intensity_mmh": 90.0, "wind_speed_kmh": 65.0}
    ))

    assert result["success"] is True
    assert "recommended_route" in result
    assert "baseline_route" in result
    assert "comparison" in result
    assert "triggered_rules" in result
    assert len(result["audit_trail"]) >= 8
    assert result["origin_name"] != ""
    assert result["destination_name"] != ""

def test_agent_infeasible_route():
    agent = DeliveryRoutingAgent()
    # Block all egress from DEPOT_MAIN: E01, E07
    result = asyncio.run(agent.execute_plan(
        origin="DEPOT_MAIN",
        destination="HOSPITAL_AIIMS",
        profile="safest",
        custom_blocked=["E01", "E07"]
    ))

    assert result["success"] is False
    assert result["recommended_route"] is None
    # Verify rule engine fired the infeasible route explanation
    rule_ids = [r["rule_id"] for r in result["triggered_rules"]]
    assert "RULE_04_NO_FEASIBLE_ROUTE" in rule_ids
