import { SimulationResult } from "@/lib/types";

import { LineChart } from "@/components/line-chart";
import { MetricCards } from "@/components/metric-cards";
import { OutcomeChart } from "@/components/outcome-chart";

type ResultPanelProps = {
  result: SimulationResult | null;
};

export function ResultPanel({ result }: ResultPanelProps) {
  if (!result) {
    return (
      <section className="panel flex min-h-72 flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="h-14 w-14 rounded-full bg-slate-100" aria-hidden="true" />
        <div>
          <h2 className="text-xl font-semibold text-primary">No simulation run yet</h2>
          <p className="mt-2 max-w-xl text-sm text-secondary">
            Connect a session, enter drug trial parameters, and trigger the payment flow to generate your first simulation result.
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

      <MetricCards result={result} />

      <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
        <LineChart title="Effectiveness over time" points={result.effect_curve} strokeColor="#0f766e" />
        <OutcomeChart distribution={result.metrics.outcome_distribution} />
      </div>

      <LineChart title="Side effect probability over time" points={result.side_effect_curve} strokeColor="#b45309" />

      <div className="panel grid gap-4 p-5 md:grid-cols-2">
        <div>
          <p className="text-sm font-medium text-secondary">Payment transaction</p>
          <p className="mt-2 text-base font-semibold text-primary">{result.payment.transaction_id}</p>
          <p className="mt-1 text-sm text-secondary">
            {result.payment.amount} {result.payment.currency}
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
