"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { Card } from "@/components/Card";
import { formatDisplayDate } from "@/lib/dateUtils";
import { workoutSessionVolume } from "@/lib/workoutStats";
import { useNextSet } from "@/providers/nextset-provider";

export default function HistoryDetailPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const { ready, workoutSessions } = useNextSet();
  const session = useMemo(
    () => workoutSessions.find((s) => s.id === id),
    [workoutSessions, id]
  );

  if (!ready) {
    return (
      <div className="flex flex-1 items-center justify-center py-20 text-zinc-500">
        불러오는 중…
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold">기록을 찾을 수 없어요</h1>
        <Link href="/history" className="text-emerald-700 hover:underline">
          기록 목록으로
        </Link>
      </div>
    );
  }

  const vol = workoutSessionVolume(session);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase text-zinc-500">세션</p>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            {session.routineName}
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {formatDisplayDate(session.date)}
          </p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            총 볼륨: {Math.round(vol)} kg·회
          </p>
        </div>
        <Link
          href="/history"
          className="text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
        >
          목록
        </Link>
      </div>

      {session.exercises.map((ex) => (
        <Card key={ex.routineExerciseId}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {ex.name}
            </h2>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                ex.successful
                  ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200"
                  : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              }`}
            >
              {ex.successful ? "증량" : "유지"}
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            당시 목표: {ex.targetWeight} kg × {ex.targetReps}회 · 다음 목표 무게:{" "}
            {ex.nextTargetWeight} kg
          </p>
          <ul className="mt-3 space-y-2">
            {ex.sets.map((set) => (
              <li
                key={set.setNumber}
                className="flex justify-between rounded-lg bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-950"
              >
                <span className="text-zinc-500">{set.setNumber}세트</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-50">
                  {set.actualWeight} kg × {set.actualReps}회
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}
