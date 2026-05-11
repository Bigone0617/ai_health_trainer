import { formatLocalDate } from "./dateUtils";
import type { WeightLog } from "./types";

export type WeightChartPoint = {
  date: string;
  weight: number;
  avg7?: number;
};

export function sortedByDate(logs: WeightLog[]): WeightLog[] {
  return [...logs].sort((a, b) => a.date.localeCompare(b.date));
}

/** Chart rows: last `windowDays` calendar days from today, or all logs if none fall in window. */
export function buildWeightChartData(
  logs: WeightLog[],
  windowDays = 30
): WeightChartPoint[] {
  const sorted = sortedByDate(logs);
  if (sorted.length === 0) return [];

  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - (windowDays - 1));
  const startStr = formatLocalDate(start);

  let slice = sorted.filter((l) => l.date >= startStr);
  if (slice.length === 0) slice = sorted;

  const rows = slice.map((l) => ({ date: l.date, weight: l.weight }));
  return addMovingAverage(rows);
}

function addMovingAverage(
  rows: { date: string; weight: number }[]
): WeightChartPoint[] {
  const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));
  const byDate = new Map(sorted.map((r) => [r.date, r.weight]));

  return sorted.map((row) => {
    const end = parseIso(row.date);
    const windowWeights: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(end);
      d.setDate(end.getDate() - i);
      const key = formatLocalDate(d);
      const w = byDate.get(key);
      if (w !== undefined) windowWeights.push(w);
    }
    const avg7 =
      windowWeights.length > 0
        ? windowWeights.reduce((a, b) => a + b, 0) / windowWeights.length
        : undefined;
    return { date: row.date, weight: row.weight, avg7 };
  });
}

function parseIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function latestWeight(logs: WeightLog[]): number | null {
  const s = sortedByDate(logs);
  if (s.length === 0) return null;
  return s[s.length - 1].weight;
}

export function startingWeight(logs: WeightLog[]): number | null {
  const s = sortedByDate(logs);
  if (s.length === 0) return null;
  return s[0].weight;
}

export function averageLast7Days(logs: WeightLog[]): number | null {
  const s = sortedByDate(logs);
  if (s.length === 0) return null;
  const last = s.slice(-7).map((l) => l.weight);
  return last.reduce((a, b) => a + b, 0) / last.length;
}
