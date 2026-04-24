import { Session, SimulationFormValues, SimulationRecord, SimulationResult } from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";
const REQUEST_TIMEOUT_MS = 20000;

export class ApiError extends Error {
  status: number | null;

  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function getPaymentAmount(values: SimulationFormValues): number {
  const dosage = Number(values.dosage);
  const populationSize = Number(values.populationSize);
  const duration = Number(values.trialDurationDays);

  const amount = 1 + dosage * 0.01 + populationSize * 0.002 + duration * 0.015;
  return Number(amount.toFixed(2));
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { detail?: string; message?: string; error?: string };
    return payload.detail ?? payload.message ?? payload.error ?? `Request failed with status ${response.status}.`;
  } catch {
    return `Request failed with status ${response.status}.`;
  }
}

async function requestJson<T>(path: string, init: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new ApiError(await readErrorMessage(response), response.status);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("The request timed out. Please check that the backend is running and try again.");
    }

    throw new ApiError("Unable to reach the backend. Verify the API is running and retry.");
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function runSimulation(
  session: Session,
  values: SimulationFormValues,
  txHash?: string | null,
): Promise<SimulationResult> {
  return requestJson<SimulationResult>("/simulations/run", {
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
        tx_hash: txHash ?? null,
      },
      params: {
        dosage: Number(values.dosage),
        population_size: Number(values.populationSize),
        age_group: values.ageGroup,
        trial_duration_days: Number(values.trialDurationDays),
      },
    }),
  });
}

export async function fetchHistory(userId: string): Promise<SimulationRecord[]> {
  return requestJson<SimulationRecord[]>(`/simulations/history/${userId}`, {
    method: "GET",
    cache: "no-store",
  });
}

export function estimatePayment(values: SimulationFormValues): string {
  return getPaymentAmount(values).toFixed(2);
}

export function getDisplayError(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
