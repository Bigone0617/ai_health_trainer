"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Card } from "@/components/Card";
import { formatDisplayDate, formatLocalDate } from "@/lib/dateUtils";
import {
  dateKey,
  getCalendarCells,
  groupSessionsByDate,
} from "@/lib/workoutCalendar";
import { workoutSessionVolume } from "@/lib/workoutStats";
import type { WorkoutSession } from "@/lib/types";

const WEEK_LABELS = ["일", "월", "화", "수", "목", "금", "토"] as const;

export function WorkoutHistoryCalendar({
  sessions,
}: {
  sessions: WorkoutSession[];
}) {
  const today = useMemo(() => formatLocalDate(new Date()), []);
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = viewMonth.getFullYear();
  const monthIndex = viewMonth.getMonth();

  const byDate = useMemo(() => groupSessionsByDate(sessions), [sessions]);
  const cells = useMemo(
    () => getCalendarCells(year, monthIndex),
    [year, monthIndex]
  );

  const monthTitle = viewMonth.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
  });

  const goPrev = () => {
    setViewMonth(new Date(year, monthIndex - 1, 1));
    setSelectedDate(null);
  };
  const goNext = () => {
    setViewMonth(new Date(year, monthIndex + 1, 1));
    setSelectedDate(null);
  };

  const selectedSessions = selectedDate ? (byDate.get(selectedDate) ?? []) : [];

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={goPrev}
            className="min-h-[44px] min-w-[44px] rounded-xl border border-zinc-200 text-lg font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
            aria-label="이전 달"
          >
            ‹
          </button>
          <h2 className="text-center text-base font-semibold text-zinc-900 dark:text-zinc-50">
            {monthTitle}
          </h2>
          <button
            type="button"
            onClick={goNext}
            className="min-h-[44px] min-w-[44px] rounded-xl border border-zinc-200 text-lg font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
            aria-label="다음 달"
          >
            ›
          </button>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-medium text-zinc-500">
          {WEEK_LABELS.map((w) => (
            <div key={w} className="py-1">
              {w}
            </div>
          ))}
        </div>

        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map(({ date, inMonth }) => {
            const key = dateKey(date);
            const dayNum = date.getDate();
            const list = byDate.get(key) ?? [];
            const has = list.length > 0;
            const isToday = key === today;
            const isSelected = key === selectedDate;

            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  if (!inMonth) {
                    setViewMonth(new Date(date.getFullYear(), date.getMonth(), 1));
                  }
                  setSelectedDate(key);
                }}
                className={`flex min-h-[44px] flex-col items-center justify-center rounded-xl border text-sm font-medium transition-colors ${
                  isSelected
                    ? "border-emerald-500 bg-emerald-50 text-emerald-900 dark:border-emerald-500 dark:bg-emerald-950/50 dark:text-emerald-100"
                    : !inMonth
                      ? "border-transparent text-zinc-300 dark:text-zinc-600"
                      : has
                        ? "border-emerald-200 bg-emerald-50/80 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100"
                        : "border-transparent text-zinc-800 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800"
                } ${isToday && inMonth && !isSelected ? "ring-2 ring-emerald-400 ring-offset-1 dark:ring-offset-zinc-900" : ""}`}
              >
                <span>{dayNum}</span>
                {has && (
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {selectedDate && (
        <Card>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {formatDisplayDate(selectedDate)}
          </h3>
          {selectedSessions.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              이 날 완료한 운동 기록이 없어요.
            </p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {selectedSessions.map((s) => {
                const vol = workoutSessionVolume(s);
                return (
                  <li key={s.id}>
                    <Link
                      href={`/history/${s.id}`}
                      className="block rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-left transition hover:border-emerald-300 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:border-emerald-800"
                    >
                      <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                        {s.routineName}
                      </p>
                      <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                        운동 {s.exercises.length}개 · 총 볼륨 {Math.round(vol)}{" "}
                        kg·회
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}
