type OutcomeChartProps = {
  distribution: {
    improved: number;
    stable: number;
    declined: number;
  };
};

export function OutcomeChart({ distribution }: OutcomeChartProps) {
  const entries = [
    { label: "Improved", value: distribution.improved, color: "bg-emerald-600" },
    { label: "Stable", value: distribution.stable, color: "bg-slate-500" },
    { label: "Declined", value: distribution.declined, color: "bg-amber-600" },
  ];
  const maxValue = Math.max(...entries.map((entry) => entry.value), 1);

  return (
    <section className="panel p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-primary">Outcome distribution</h3>
        <span className="text-xs uppercase tracking-[0.16em] text-secondary">Population</span>
      </div>
      <div className="space-y-4">
        {entries.map((entry) => (
          <div key={entry.label} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-primary">{entry.label}</span>
              <span className="text-secondary">{entry.value}</span>
            </div>
            <div className="h-3 rounded-full bg-slate-100">
              <div
                className={`h-3 rounded-full ${entry.color}`}
                style={{ width: `${(entry.value / maxValue) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
