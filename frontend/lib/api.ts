import { Session, SimulationFormValues, SimulationRecord, SimulationResult } from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

function getPaymentAmount(values: SimulationFormValues): number {
  const dosage = Number(values.dosage);
  const populationSize = Number(values.populationSize);
  const duration = Number(values.trialDurationDays);

  const amount = 1 + dosage * 0.01 + populationSize * 0.002 + duration * 0.015;
  return Number(amount.toFixed(2));
}

export async function runSimulation(
  session: Session,
  values: SimulationFormValues,
): Promise<SimulationResult> {
  const response = await fetch(`${API_BASE_URL}/simulations/run`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_id: session.userId,
      auth_method: session.authMethod,
      simulation_type: "drug_trial",
      payment: {
        wallet_address: session.walletAddress,
        amount: getPaymentAmount(values),
        currency: "INIT",
      },
      params: {
        dosage: Number(values.dosage),
        population_size: Number(values.populationSize),
        age_group: values.ageGroup,
        trial_duration_days: Number(values.trialDurationDays),
      },
    }),
  });

  if (!response.ok) {
    throw new Error("Simulation request failed");
  }

  return (await response.json()) as SimulationResult;
}

export async function fetchHistory(userId: string): Promise<SimulationRecord[]> {
  const response = await fetch(`${API_BASE_URL}/simulations/history/${userId}`, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Could not load simulation history");
  }

  return (await response.json()) as SimulationRecord[];
}

export function estimatePayment(values: SimulationFormValues): string {
  return getPaymentAmount(values).toFixed(2);
}
