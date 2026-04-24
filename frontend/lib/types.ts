export type AuthMethod = "wallet" | "social";

export type Session = {
  userId: string;
  authMethod: AuthMethod;
  displayName: string;
  walletAddress: string;
};

export type SimulationFormValues = {
  dosage: string;
  populationSize: string;
  ageGroup: string;
  trialDurationDays: string;
};

export type SimulationFormErrors = Partial<Record<keyof SimulationFormValues, string>>;

export type ChartPoint = {
  label: string;
  value: number;
};

export type SimulationResult = {
  simulation_id: string;
  simulation_type: "drug_trial";
  insight_summary: string;
  metrics: {
    effectiveness_percent: number;
    side_effect_probability_percent: number;
    average_response_score: number;
    dropout_rate_percent: number;
    outcome_distribution: {
      improved: number;
      stable: number;
      declined: number;
    };
  };
  statistical_summary: {
    efficacy_confidence_interval: {
      lower: number;
      upper: number;
    };
    treatment_vs_control: {
      treatment_mean: number;
      control_mean: number;
      absolute_lift: number;
      relative_lift_percent: number;
    };
    p_value: number;
    adverse_event_breakdown: {
      mild_percent: number;
      moderate_percent: number;
      severe_percent: number;
    };
    completion_rate_percent: number;
    methodology: string;
  };
  effect_curve: ChartPoint[];
  side_effect_curve: ChartPoint[];
  payment: {
    success: boolean;
    transaction_id: string;
    tx_hash: string | null;
    amount: number;
    currency: string;
  };
  proof: {
    result_hash: string;
    stored: boolean;
    ledger_id: string;
    timestamp: string;
  };
};

export type SimulationRecord = {
  user_id: string;
  auth_method: AuthMethod;
  result: SimulationResult;
};

export type RequestPhase = "idle" | "loading" | "success" | "error";

export type WalletPaymentStatus = "idle" | "pending" | "success" | "failed";

export type WalletPaymentState = {
  status: WalletPaymentStatus;
  txHash: string | null;
  amount: string;
  denom: string;
  error: string | null;
};
