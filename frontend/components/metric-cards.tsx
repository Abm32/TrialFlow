import { SimulationResult } from "@/lib/types";

type MetricCardsProps = {
  result: SimulationResult;
};

const cards = [
  {
    key: "effectiveness_percent",
    label: "Effectiveness",
    suffix: "%",
  },
  {
    key: "side_effect_probability_percent",
    label: "Side effects",
    suffix: "%",
  },
  {
    key: "average_response_score",
    label: "Response score",
    suffix: "",
  },
] as const;

export function MetricCards({ result }: MetricCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => (
        <article key={card.key} className="panel p-5">
          <p className="text-sm font-medium text-secondary">{card.label}</p>
          <p className="mt-3 text-3xl font-semibold text-primary">
            {result.metrics[card.key]}
            {card.suffix}
          </p>
        </article>
      ))}
    </div>
  );
}
