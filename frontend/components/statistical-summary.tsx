import { SimulationResult } from "@/lib/types";

type StatisticalSummaryProps = {
  result: SimulationResult;
};

export function StatisticalSummary({ result }: StatisticalSummaryProps) {
  const { efficacy_confidence_interval, treatment_vs_control, adverse_event_breakdown } =
    result.statistical_summary;

  return (
    <section className="panel p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-primary">Statistical summary</h3>
        <span className="text-xs uppercase tracking-[0.16em] text-secondary">Trial model</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm font-medium text-secondary">Treatment vs control</p>
          <p className="mt-2 text-sm text-primary">
            Treatment mean {treatment_vs_control.treatment_mean}% vs control mean{" "}
            {treatment_vs_control.control_mean}%
          </p>
          <p className="mt-1 text-sm text-secondary">
            Absolute lift {treatment_vs_control.absolute_lift}% · Relative lift{" "}
            {treatment_vs_control.relative_lift_percent}%
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm font-medium text-secondary">Uncertainty</p>
          <p className="mt-2 text-sm text-primary">
            95% CI {efficacy_confidence_interval.lower}% to {efficacy_confidence_interval.upper}%
          </p>
          <p className="mt-1 text-sm text-secondary">p-value {result.statistical_summary.p_value}</p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm font-medium text-secondary">Adverse event severity</p>
          <p className="mt-2 text-sm text-primary">
            Mild {adverse_event_breakdown.mild_percent}% · Moderate {adverse_event_breakdown.moderate_percent}%
          </p>
          <p className="mt-1 text-sm text-secondary">Severe {adverse_event_breakdown.severe_percent}%</p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm font-medium text-secondary">Completion</p>
          <p className="mt-2 text-sm text-primary">
            {result.statistical_summary.completion_rate_percent}% completed the trial
          </p>
          <p className="mt-1 text-sm text-secondary">{result.statistical_summary.methodology}</p>
        </div>
      </div>
    </section>
  );
}
