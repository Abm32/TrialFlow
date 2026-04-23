import { SimulationRecord } from "@/lib/types";

type HistoryPanelProps = {
  records: SimulationRecord[];
  isLoading: boolean;
  error: string | null;
};

export function HistoryPanel({ records, isLoading, error }: HistoryPanelProps) {
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
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-warning">
          {error}
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
            <article key={record.result.simulation_id} className="rounded-2xl border border-border bg-slate-50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-primary">{record.result.simulation_id}</h3>
                  <p className="mt-1 text-sm text-secondary">
                    Effectiveness {record.result.metrics.effectiveness_percent}% · Side effects{" "}
                    {record.result.metrics.side_effect_probability_percent}%
                  </p>
                </div>
                <span className="rounded-full bg-white px-3 py-2 text-xs font-medium text-secondary">
                  {record.auth_method}
                </span>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
