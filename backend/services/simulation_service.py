from __future__ import annotations

from uuid import uuid4

from backend.models.simulation import SimulationRunRequest, SimulationRunResponse, StoredSimulationRecord
from backend.services.blockchain_service import create_result_hash, store_result_hash
from backend.services.payment_service import simulate_blockchain_payment
from backend.services.storage_service import save_simulation
from backend.simulation.engine import run_simulation


def execute_simulation(request: SimulationRunRequest) -> SimulationRunResponse:
    payment_receipt = simulate_blockchain_payment(request.payment)
    simulation_payload = run_simulation(
        request.simulation_type,
        request.params.model_dump(),
    )
    result_hash = create_result_hash(simulation_payload)
    proof = store_result_hash(result_hash)

    result = SimulationRunResponse(
        simulation_id=f"sim_{uuid4().hex[:12]}",
        simulation_type=request.simulation_type,
        insight_summary=simulation_payload["insight_summary"],
        metrics=simulation_payload["metrics"],
        statistical_summary=simulation_payload["statistical_summary"],
        effect_curve=simulation_payload["effect_curve"],
        side_effect_curve=simulation_payload["side_effect_curve"],
        payment=payment_receipt,
        proof=proof,
    )

    save_simulation(
        StoredSimulationRecord(
            user_id=request.user_id,
            auth_method=request.auth_method,
            result=result,
        )
    )
    return result
