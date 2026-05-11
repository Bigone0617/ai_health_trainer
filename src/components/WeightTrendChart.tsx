"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { formatShortDate } from "@/lib/dateUtils";
import type { WeightChartPoint } from "@/lib/weightStats";

export function WeightTrendChart({ data }: { data: WeightChartPoint[] }) {
  if (data.length === 0) return null;

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
          <XAxis
            dataKey="date"
            tickFormatter={(v) => formatShortDate(String(v))}
            tick={{ fontSize: 11 }}
            className="text-zinc-500"
          />
          <YAxis
            domain={["auto", "auto"]}
            tick={{ fontSize: 11 }}
            width={40}
            className="text-zinc-500"
            tickFormatter={(v) => `${v}`}
          />
          <Tooltip
            labelFormatter={(label) => formatShortDate(String(label))}
            formatter={(value, name) => [
              `${Number(value).toFixed(1)} kg`,
              name === "weight" ? "체중" : "7일 평균",
            ]}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #e4e4e7",
            }}
          />
          <Line
            type="monotone"
            dataKey="weight"
            stroke="#059669"
            strokeWidth={2}
            dot={{ r: 3 }}
            name="weight"
          />
          <Line
            type="monotone"
            dataKey="avg7"
            stroke="#6366f1"
            strokeWidth={1.5}
            dot={false}
            name="avg7"
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
