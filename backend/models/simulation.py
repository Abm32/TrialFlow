from typing import Literal

from pydantic import BaseModel, Field


SimulationType = Literal["drug_trial"]


class DrugTrialParams(BaseModel):
    dosage: float = Field(..., gt=0, description="Drug dosage in milligrams")
    population_size: int = Field(..., ge=10, le=100000)
    age_group: str = Field(..., min_length=2, max_length=50)
    trial_duration_days: int = Field(..., ge=1, le=3650)


class PaymentRequest(BaseModel):
    wallet_address: str = Field(..., min_length=4)
    amount: float = Field(..., gt=0)
    currency: str = Field(default="INIT")


class SimulationRunRequest(BaseModel):
    user_id: str = Field(..., min_length=3)
    auth_method: Literal["wallet", "social"]
    simulation_type: SimulationType
    payment: PaymentRequest
    params: DrugTrialParams


class ChartPoint(BaseModel):
    label: str
    value: float


class OutcomeDistribution(BaseModel):
    improved: int
    stable: int
    declined: int


class SimulationMetrics(BaseModel):
    effectiveness_percent: float
    side_effect_probability_percent: float
    outcome_distribution: OutcomeDistribution
    average_response_score: float


class BlockchainProof(BaseModel):
    result_hash: str
    stored: bool
    ledger_id: str
    timestamp: str


class PaymentReceipt(BaseModel):
    success: bool
    transaction_id: str
    amount: float
    currency: str


class SimulationRunResponse(BaseModel):
    simulation_id: str
    simulation_type: SimulationType
    metrics: SimulationMetrics
    effect_curve: list[ChartPoint]
    side_effect_curve: list[ChartPoint]
    payment: PaymentReceipt
    proof: BlockchainProof


class StoredSimulationRecord(BaseModel):
    user_id: str
    auth_method: Literal["wallet", "social"]
    result: SimulationRunResponse
