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
    tx_hash: str | None = Field(default=None, description="On-chain transaction hash from the wallet payment")


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
    dropout_rate_percent: float


class ConfidenceInterval(BaseModel):
    lower: float
    upper: float


class TrialArmSummary(BaseModel):
    treatment_mean: float
    control_mean: float
    absolute_lift: float
    relative_lift_percent: float


class AdverseEventBreakdown(BaseModel):
    mild_percent: float
    moderate_percent: float
    severe_percent: float


class StatisticalSummary(BaseModel):
    efficacy_confidence_interval: ConfidenceInterval
    treatment_vs_control: TrialArmSummary
    p_value: float
    adverse_event_breakdown: AdverseEventBreakdown
    completion_rate_percent: float
    methodology: str


class BlockchainProof(BaseModel):
    result_hash: str
    stored: bool
    ledger_id: str
    timestamp: str


class PaymentReceipt(BaseModel):
    success: bool
    transaction_id: str
    tx_hash: str | None = None
    amount: float
    currency: str


class SimulationRunResponse(BaseModel):
    simulation_id: str
    simulation_type: SimulationType
    insight_summary: str
    metrics: SimulationMetrics
    statistical_summary: StatisticalSummary
    effect_curve: list[ChartPoint]
    side_effect_curve: list[ChartPoint]
    payment: PaymentReceipt
    proof: BlockchainProof


class StoredSimulationRecord(BaseModel):
    user_id: str
    auth_method: Literal["wallet", "social"]
    result: SimulationRunResponse
