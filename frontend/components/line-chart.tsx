"use client";

import { useId } from "react";

import { ChartPoint } from "@/lib/types";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type LineChartProps = {
  title: string;
  points: ChartPoint[];
  strokeColor: string;
};

export function LineChart({ title, points, strokeColor }: LineChartProps) {
  const gradientId = useId().replace(/:/g, "");
  const chartData = points.map((point) => ({
    ...point,
    percentage: point.value,
  }));

  return (
    <section className="panel p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-primary">{title}</h3>
        <span className="text-xs uppercase tracking-[0.16em] text-secondary">Trend</span>
      </div>
      <div className="min-w-0 rounded-2xl bg-slate-50 p-4">
        <div className="h-56 min-w-0 md:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={strokeColor} stopOpacity={0.32} />
                  <stop offset="95%" stopColor={strokeColor} stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#dbe4ee" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                minTickGap={24}
                tick={{ fill: "#64748b", fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#64748b", fontSize: 12 }}
                width={42}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                cursor={{ stroke: strokeColor, strokeDasharray: "4 4" }}
                contentStyle={{
                  borderRadius: 16,
                  border: "1px solid #d1d5db",
                  backgroundColor: "#ffffff",
                  boxShadow: "0 12px 28px rgba(15, 23, 42, 0.08)",
                }}
                formatter={(value) => [`${Number(value ?? 0)}%`, title]}
              />
              <Area
                type="monotone"
                dataKey="percentage"
                stroke={strokeColor}
                strokeWidth={3}
                fill={`url(#${gradientId})`}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-secondary sm:grid-cols-4 xl:grid-cols-8">
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
