import { formatLocalDate } from "./dateUtils";
import type { WorkoutSession } from "./types";

/** 한 달 그리드용 42칸(6주×7일). 각 칸은 날짜와, 표시 중인 월에 속하는지 여부. */
export function getCalendarCells(
  year: number,
  monthIndex: number
): { date: Date; inMonth: boolean }[] {
  const first = new Date(year, monthIndex, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());

  const cells: { date: Date; inMonth: boolean }[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    cells.push({
      date: d,
      inMonth: d.getMonth() === monthIndex && d.getFullYear() === year,
    });
  }
  return cells;
}

export function groupSessionsByDate(
  sessions: WorkoutSession[]
): Map<string, WorkoutSession[]> {
  const m = new Map<string, WorkoutSession[]>();
  for (const s of sessions) {
    const arr = m.get(s.date) ?? [];
    arr.push(s);
    m.set(s.date, arr);
  }
  for (const arr of m.values()) {
    arr.sort((a, b) => b.completedAt.localeCompare(a.completedAt));
  }
  return m;
}

export function dateKey(d: Date): string {
  return formatLocalDate(d);
}
