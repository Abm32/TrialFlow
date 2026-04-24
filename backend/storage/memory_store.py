from __future__ import annotations

from backend.models.simulation import StoredSimulationRecord


class InMemorySimulationStore:
    def __init__(self) -> None:
        self._records: list[StoredSimulationRecord] = []

    def save(self, record: StoredSimulationRecord) -> None:
        self._records.append(record)

    def list_by_user(self, user_id: str) -> list[StoredSimulationRecord]:
        return [record for record in self._records if record.user_id == user_id][::-1]


simulation_store = InMemorySimulationStore()
