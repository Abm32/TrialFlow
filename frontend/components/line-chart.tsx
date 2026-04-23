import { ChartPoint } from "@/lib/types";

type LineChartProps = {
  title: string;
  points: ChartPoint[];
  strokeColor: string;
};

export function LineChart({ title, points, strokeColor }: LineChartProps) {
  const maxValue = Math.max(...points.map((point) => point.value), 1);
  const coordinates = points
    .map((point, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * 100;
      const y = 100 - (point.value / maxValue) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <section className="panel p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-primary">{title}</h3>
        <span className="text-xs uppercase tracking-[0.16em] text-secondary">Trend</span>
      </div>
      <div className="rounded-2xl bg-slate-50 p-4">
        <svg viewBox="0 0 100 100" className="h-48 w-full" preserveAspectRatio="none" aria-label={title} role="img">
          <polyline
            fill="none"
            stroke={strokeColor}
            strokeWidth="3"
            points={coordinates}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <div className="mt-4 grid grid-cols-4 gap-2 text-xs text-secondary md:grid-cols-8">
          {points.map((point) => (
            <div key={point.label} className="rounded-xl bg-white px-2 py-2 text-center">
              <p>{point.label}</p>
              <p className="mt-1 font-semibold text-primary">{point.value}%</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
