"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Card } from "@/components/Card";
import { WorkoutHistoryCalendar } from "@/components/WorkoutHistoryCalendar";
import { formatShortDate } from "@/lib/dateUtils";
import { workoutSessionVolume } from "@/lib/workoutStats";
import { useNextSet } from "@/providers/nextset-provider";

type ViewMode = "list" | "calendar";

export default function HistoryPage() {
  const { ready, workoutSessions } = useNextSet();
  const [view, setView] = useState<ViewMode>("list");

  const sorted = useMemo(
    () =>
      [...workoutSessions].sort((a, b) =>
        (b.date + b.completedAt).localeCompare(a.date + a.completedAt)
      ),
    [workoutSessions]
  );

  if (!ready) {
    return (
      <div className="flex flex-1 items-center justify-center py-20 text-zinc-500">
        불러오는 중…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          운동 기록
        </h1>
        {sorted.length > 0 && (
          <div
            className="flex rounded-xl border border-zinc-200 p-1 dark:border-zinc-700"
            role="tablist"
            aria-label="보기 방식"
          >
            <button
              type="button"
              role="tab"
              aria-selected={view === "list"}
              onClick={() => setView("list")}
              className={`min-h-[44px] flex-1 rounded-lg px-4 text-sm font-semibold transition-colors ${
                view === "list"
                  ? "bg-emerald-600 text-white"
                  : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              목록
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === "calendar"}
              onClick={() => setView("calendar")}
              className={`min-h-[44px] flex-1 rounded-lg px-4 text-sm font-semibold transition-colors ${
                view === "calendar"
                  ? "bg-emerald-600 text-white"
                  : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              달력
            </button>
          </div>
        )}
      </div>

      {sorted.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-300 p-6 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
          첫 운동을 완료하면 여기에 쌓여요.
        </p>
      ) : view === "calendar" ? (
        <WorkoutHistoryCalendar sessions={workoutSessions} />
      ) : (
        <ul className="flex flex-col gap-3">
          {sorted.map((s) => {
            const vol = workoutSessionVolume(s);
            return (
              <li key={s.id}>
                <Link href={`/history/${s.id}`}>
                  <Card className="transition hover:border-emerald-300 hover:shadow-md dark:hover:border-emerald-800">
                    <p className="text-sm font-medium text-zinc-500">
                      {formatShortDate(s.date)}
                    </p>
                    <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                      {s.routineName}
                    </p>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      운동 {s.exercises.length}개 · 총 볼륨{" "}
                      {Math.round(vol)} kg·회
                    </p>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
