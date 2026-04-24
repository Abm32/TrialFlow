from __future__ import annotations

from datetime import UTC, datetime
from uuid import uuid4

from backend.models.simulation import PaymentReceipt, PaymentRequest


def simulate_blockchain_payment(payment: PaymentRequest) -> PaymentReceipt:
    transaction_id = f"txn_{uuid4().hex[:12]}"
    return PaymentReceipt(
        success=True,
        transaction_id=transaction_id,
        tx_hash=payment.tx_hash,
        amount=payment.amount,
        currency=payment.currency,
    )


def payment_timestamp() -> str:
    return datetime.now(UTC).isoformat()
