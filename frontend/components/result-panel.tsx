import { SimulationResult, WalletPaymentState } from "@/lib/types";

import { LineChart } from "@/components/line-chart";
import { MetricCards } from "@/components/metric-cards";
import { OutcomeChart } from "@/components/outcome-chart";
import { StatisticalSummary } from "@/components/statistical-summary";

type ResultPanelProps = {
  result: SimulationResult | null;
  isLoading: boolean;
  loadingLabel: string | null;
  error: string | null;
  walletPayment: WalletPaymentState;
  onRetry?: (() => void) | undefined;
};

export function ResultPanel({
  result,
  isLoading,
  loadingLabel,
  error,
  walletPayment,
  onRetry,
}: ResultPanelProps) {
  if (isLoading) {
    return (
      <section className="panel flex min-h-72 flex-col justify-center gap-5 p-8">
        <div className="flex items-center gap-3 text-sm font-medium text-primary">
          <span
            className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700"
            aria-hidden="true"
          />
          <span>{loadingLabel ?? "Running the simulation..."}</span>
        </div>
        <div className="space-y-3" aria-live="polite">
          <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-48 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </section>
    );
  }

  if (error && !result) {
    return (
      <section className="panel flex min-h-72 flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="h-14 w-14 rounded-full bg-amber-100" aria-hidden="true" />
        <div>
          <h2 className="text-xl font-semibold text-primary">Simulation could not be completed</h2>
          <p className="mt-2 max-w-xl text-sm text-secondary">{error}</p>
        </div>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="focus-ring min-h-11 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Retry simulation
          </button>
        ) : null}
      </section>
    );
  }

  if (!result) {
    return (
      <section className="panel flex min-h-72 flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="h-14 w-14 rounded-full bg-slate-100" aria-hidden="true" />
        <div>
          <h2 className="text-xl font-semibold text-primary">No simulation run yet</h2>
          <p className="mt-2 max-w-xl text-sm text-secondary">
            Connect a wallet, approve the Initia transaction, and then the backend simulation will run.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div className="panel p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-secondary">
              Latest result
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-primary">{result.simulation_id}</h2>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-secondary">
            Hash stored on mock chain: <span className="font-medium text-primary">{result.proof.ledger_id}</span>
          </div>
        </div>
      </div>

      <section className="panel border-slate-200 bg-gradient-to-br from-amber-50 via-white to-slate-50 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <span className="text-lg font-semibold" aria-hidden="true">
              i
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-secondary">
              Insight Summary
            </p>
            <p className="mt-2 text-base leading-7 text-primary">{result.insight_summary}</p>
          </div>
        </div>
      </section>

      <MetricCards result={result} />
      <StatisticalSummary result={result} />

      <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
        <LineChart title="Effectiveness over time" points={result.effect_curve} strokeColor="#0f766e" />
        <OutcomeChart distribution={result.metrics.outcome_distribution} />
      </div>

      <LineChart title="Side effect probability over time" points={result.side_effect_curve} strokeColor="#b45309" />

      <div className="panel grid gap-4 p-5 md:grid-cols-2">
        <div>
          <p className="text-sm font-medium text-secondary">Wallet payment transaction</p>
          <p className="mt-2 text-base font-semibold text-primary">
            {walletPayment.txHash ?? result.payment.transaction_id}
          </p>
          <p className="mt-1 text-sm text-secondary">
            Status:{" "}
            {walletPayment.status === "success"
              ? "Success"
              : walletPayment.status === "failed"
                ? "Failed"
                : "Recorded"}
          </p>
          <p className="mt-1 text-sm text-secondary">
            {walletPayment.amount} {walletPayment.denom}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-secondary">Result proof hash</p>
          <p className="mt-2 break-all text-sm font-semibold text-primary">{result.proof.result_hash}</p>
          <p className="mt-1 text-sm text-secondary">{new Date(result.proof.timestamp).toLocaleString()}</p>
        </div>
      </div>
    </section>
  );
}
