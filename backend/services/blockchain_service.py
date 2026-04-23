from __future__ import annotations

import hashlib
import json
from datetime import UTC, datetime
from uuid import uuid4

from backend.models.simulation import BlockchainProof


_mock_ledger: list[dict] = []


def create_result_hash(result_payload: dict) -> str:
    serialized = json.dumps(result_payload, sort_keys=True).encode("utf-8")
    return hashlib.sha256(serialized).hexdigest()


def store_result_hash(result_hash: str) -> BlockchainProof:
    timestamp = datetime.now(UTC).isoformat()
    ledger_id = f"ledger_{uuid4().hex[:10]}"
    _mock_ledger.append(
        {
            "ledger_id": ledger_id,
            "result_hash": result_hash,
            "timestamp": timestamp,
        }
    )
    return BlockchainProof(
        result_hash=result_hash,
        stored=True,
        ledger_id=ledger_id,
        timestamp=timestamp,
    )


def get_ledger_entries() -> list[dict]:
    return _mock_ledger
