from fastapi import APIRouter

from backend.models.simulation import SimulationRunRequest, SimulationRunResponse, StoredSimulationRecord
from backend.services.simulation_service import execute_simulation
from backend.services.storage_service import list_simulations_for_user

router = APIRouter(tags=["simulations"])


@router.post("/simulations/run", response_model=SimulationRunResponse)
def run_simulation_route(request: SimulationRunRequest) -> SimulationRunResponse:
    return execute_simulation(request)


@router.get("/simulations/history/{user_id}", response_model=list[StoredSimulationRecord])
def simulation_history_route(user_id: str) -> list[StoredSimulationRecord]:
    return list_simulations_for_user(user_id)
