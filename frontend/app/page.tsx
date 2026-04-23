"use client";

import { useEffect, useState, useTransition } from "react";

import { AuthPanel } from "@/components/auth-panel";
import { HistoryPanel } from "@/components/history-panel";
import { ResultPanel } from "@/components/result-panel";
import { SimulationForm } from "@/components/simulation-form";
import { fetchHistory, runSimulation } from "@/lib/api";
import { loadSession, saveSession } from "@/lib/session";
import { AuthMethod, Session, SimulationFormValues, SimulationRecord, SimulationResult } from "@/lib/types";

const initialValues: SimulationFormValues = {
  dosage: "75",
  populationSize: "120",
  ageGroup: "31-45",
  trialDurationDays: "45",
};

function buildMockSession(authMethod: AuthMethod): Session {
  const token = Math.random().toString(36).slice(2, 8);
  return {
    userId: `${authMethod}_user_${token}`,
    authMethod,
    displayName: authMethod === "wallet" ? "Wallet Operator" : "Research Analyst",
    walletAddress: authMethod === "wallet" ? `initia1${token}demo` : `social-${token}@trialflow`,
  };
}

export default function HomePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [formValues, setFormValues] = useState<SimulationFormValues>(initialValues);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [history, setHistory] = useState<SimulationRecord[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const existingSession = loadSession();
    if (existingSession) {
      setSession(existingSession);
    }
  }, []);

  useEffect(() => {
    if (!session) {
      setHistory([]);
      return;
    }

    setIsHistoryLoading(true);
    setHistoryError(null);
    fetchHistory(session.userId)
      .then((records) => setHistory(records))
      .catch(() => setHistoryError("History could not be loaded. Verify the backend is running on port 8000."))
      .finally(() => setIsHistoryLoading(false));
  }, [session]);

  function handleAuth(method: AuthMethod) {
    const nextSession = buildMockSession(method);
    saveSession(nextSession);
    setSession(nextSession);
    setResult(null);
  }

  function handleRunSimulation() {
    if (!session) {
      setSubmitError("Connect a wallet or social session before running a simulation.");
      return;
    }

    setSubmitError(null);
    startTransition(() => {
      void (async () => {
        try {
          const nextResult = await runSimulation(session, formValues);
          setResult(nextResult);
          const records = await fetchHistory(session.userId);
          setHistory(records);
        } catch {
          setSubmitError("Simulation failed. Make sure the FastAPI backend is running at http://localhost:8000.");
        }
      })();
    });
  }

  return (
    <main className="min-h-screen px-4 py-8 md:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="fade-up panel overflow-hidden p-6 md:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-secondary">
                TrialFlow
              </p>
              <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-primary md:text-5xl">
                Simulation-as-a-Service for drug trial modeling and on-chain proofing.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-secondary">
                This MVP connects a mock session, prices each simulation run, executes a backend model, returns clinical-style metrics, and anchors the result hash to a mock blockchain ledger.
              </p>
            </div>
            <div className="rounded-[28px] border border-white/70 bg-white/75 p-5 backdrop-blur">
              <p className="text-sm font-medium text-secondary">Current MVP flow</p>
              <ol className="mt-4 space-y-3 text-sm text-primary">
                <li>1. Create a wallet or social session.</li>
                <li>2. Submit the drug trial parameters.</li>
                <li>3. Trigger the payment-backed simulation run.</li>
                <li>4. Inspect metrics, charts, history, and proof hash.</li>
              </ol>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <AuthPanel
              session={session}
              onAuth={handleAuth}
              onLogout={() => {
                setSession(null);
                setResult(null);
              }}
            />
            <SimulationForm
              values={formValues}
              isSubmitting={isPending}
              disabled={!session}
              error={submitError}
              onChange={setFormValues}
              onSubmit={handleRunSimulation}
            />
          </div>

          <ResultPanel result={result} />
        </div>

        <HistoryPanel
          records={history}
          isLoading={isHistoryLoading}
          error={historyError}
        />
      </div>
    </main>
  );
}
