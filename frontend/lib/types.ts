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

export type ChartPoint = {
  label: string;
  value: number;
};

export type SimulationResult = {
  simulation_id: string;
  simulation_type: "drug_trial";
  metrics: {
    effectiveness_percent: number;
    side_effect_probability_percent: number;
    average_response_score: number;
    outcome_distribution: {
      improved: number;
      stable: number;
      declined: number;
    };
  };
  effect_curve: ChartPoint[];
  side_effect_curve: ChartPoint[];
  payment: {
    success: boolean;
    transaction_id: string;
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
