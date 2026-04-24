import { SimulationRecord } from "@/lib/types";

type HistoryPanelProps = {
  records: SimulationRecord[];
  isLoading: boolean;
  error: string | null;
  selectedSimulationId: string | null;
  onSelect(record: SimulationRecord): void;
  onRetry?: (() => void) | undefined;
};

function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleString();
}

export function HistoryPanel({
  records,
  isLoading,
  error,
  selectedSimulationId,
  onSelect,
  onRetry,
}: HistoryPanelProps) {
  return (
    <section className="panel p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-secondary">
            History
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-primary">Recent simulation runs</h2>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3" aria-live="polite">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : null}

      {!isLoading && error ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-warning">
          <span>{error}</span>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="focus-ring min-h-11 rounded-2xl border border-amber-300 bg-white px-4 py-2 font-semibold text-primary transition hover:bg-amber-50"
            >
              Retry history load
            </button>
          ) : null}
        </div>
      ) : null}

      {!isLoading && !error && records.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-slate-50 px-4 py-6 text-sm text-secondary">
          No simulations stored for this user yet. Run one to start building an auditable history.
        </div>
      ) : null}

      {!isLoading && !error && records.length > 0 ? (
        <div className="space-y-3">
          {records.map((record) => (
            <article
              key={record.result.simulation_id}
              className={`rounded-2xl border p-4 transition ${
                selectedSimulationId === record.result.simulation_id
                  ? "border-slate-900 bg-white shadow-sm"
                  : "border-border bg-slate-50"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-primary">{record.result.simulation_id}</h3>
                    <span className="rounded-full bg-white px-3 py-2 text-xs font-medium text-secondary">
                      {record.auth_method}
                    </span>
                    {record.result.proof.stored ? (
                      <span className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                        Proof stored
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-secondary">
                    Effectiveness {record.result.metrics.effectiveness_percent}% · Side effects{" "}
                    {record.result.metrics.side_effect_probability_percent}% · Dropout{" "}
                    {record.result.metrics.dropout_rate_percent}%
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.14em] text-secondary">
                    {formatTimestamp(record.result.proof.timestamp)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onSelect(record)}
                  className="focus-ring min-h-11 rounded-2xl border border-border bg-white px-4 py-2 text-sm font-semibold text-primary transition hover:bg-slate-100"
                >
                  {selectedSimulationId === record.result.simulation_id ? "Viewing result" : "View result"}
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
