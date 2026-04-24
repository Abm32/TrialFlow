"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type OutcomeChartProps = {
  distribution: {
    improved: number;
    stable: number;
    declined: number;
  };
};

export function OutcomeChart({ distribution }: OutcomeChartProps) {
  const entries = [
    { label: "Improved", value: distribution.improved, color: "#059669" },
    { label: "Stable", value: distribution.stable, color: "#64748b" },
    { label: "Declined", value: distribution.declined, color: "#d97706" },
  ];

  return (
    <section className="panel p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-primary">Outcome distribution</h3>
        <span className="text-xs uppercase tracking-[0.16em] text-secondary">Population</span>
      </div>
      <div className="min-w-0 rounded-2xl bg-slate-50 p-4">
        <div className="h-56 min-w-0 md:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={entries} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
              <CartesianGrid stroke="#dbe4ee" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                interval={0}
                tick={{ fill: "#64748b", fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#64748b", fontSize: 12 }}
                width={38}
              />
              <Tooltip
                cursor={{ fill: "rgba(148, 163, 184, 0.14)" }}
                contentStyle={{
                  borderRadius: 16,
                  border: "1px solid #d1d5db",
                  backgroundColor: "#ffffff",
                  boxShadow: "0 12px 28px rgba(15, 23, 42, 0.08)",
                }}
                formatter={(value) => [Number(value ?? 0), "Participants"]}
              />
              <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                {entries.map((entry) => (
                  <Cell key={entry.label} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid gap-2 text-sm text-secondary">
          {entries.map((entry) => (
            <div key={entry.label} className="flex items-center justify-between rounded-xl bg-white px-3 py-2">
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                  aria-hidden="true"
                />
                <span className="font-medium text-primary">{entry.label}</span>
              </div>
              <span>{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
