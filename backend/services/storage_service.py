from backend.models.simulation import StoredSimulationRecord
from backend.storage.memory_store import simulation_store


def save_simulation(record: StoredSimulationRecord) -> None:
    simulation_store.save(record)


def list_simulations_for_user(user_id: str) -> list[StoredSimulationRecord]:
    return simulation_store.list_by_user(user_id)
