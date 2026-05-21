"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Card } from "@/components/Card";
import { formatLocalDate, getScheduleDayKey } from "@/lib/dateUtils";
import { useNextSet } from "@/providers/nextset-provider";

const DATE_LOCALE = "ko-KR";

const SHARE_APP_URL = "https://ai-health-trainer.vercel.app/";

export default function HomePage() {
  const {
    ready,
    routines,
    weeklySchedule,
    weightLogs,
    upsertWeightForDate,
  } = useNextSet();

  const today = useMemo(() => new Date(), []);
  const todayStr = formatLocalDate(today);
  const dayKey = getScheduleDayKey(today);
  const routineId = weeklySchedule[dayKey] ?? null;
  const todayRoutine = routineId
    ? routines.find((r) => r.id === routineId)
    : null;
  const todayWeight = weightLogs.find((l) => l.date === todayStr);

  const [weightInput, setWeightInput] = useState("");
  const [shareHint, setShareHint] = useState<string | null>(null);

  const onShareApp = async () => {
    setShareHint(null);
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: "NextSet — 운동 기록",
          text: "NextSet 운동 기록 앱",
          url: SHARE_APP_URL,
        });
        return;
      }
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(SHARE_APP_URL);
        setShareHint("링크를 복사했어요.");
        window.setTimeout(() => setShareHint(null), 2500);
        return;
      }
      window.prompt("아래 링크를 복사해 주세요.", SHARE_APP_URL);
    } catch (err: unknown) {
      const aborted =
        err &&
        typeof err === "object" &&
        "name" in err &&
        (err as { name: string }).name === "AbortError";
      if (aborted) return;
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(SHARE_APP_URL);
          setShareHint("링크를 복사했어요.");
          window.setTimeout(() => setShareHint(null), 2500);
        }
      } catch {
        setShareHint("공유에 실패했어요. 링크를 직접 복사해 주세요.");
        window.setTimeout(() => setShareHint(null), 3000);
      }
    }
  };

  if (!ready) {
    return (
      <div className="flex flex-1 items-center justify-center py-20 text-zinc-500">
        불러오는 중…
      </div>
    );
  }

  const onSaveWeight = () => {
    const n = Number(weightInput.replace(",", "."));
    if (!Number.isFinite(n) || n <= 0) return;
    upsertWeightForDate(todayStr, n);
    setWeightInput("");
  };

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          NextSet
        </h1>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => void onShareApp()}
            className="min-h-[40px] rounded-lg border border-zinc-300 bg-white px-3 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            공유하기
          </button>
          <Link
            href="/settings"
            className="min-h-[40px] inline-flex items-center text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
          >
            데이터
          </Link>
        </div>
      </header>
      {shareHint && (
        <p className="-mt-2 text-sm text-zinc-600 dark:text-zinc-400" role="status">
          {shareHint}
        </p>
      )}

      <Card>
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          오늘
        </p>
        <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {today.toLocaleDateString(DATE_LOCALE, {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          체중 (kg)
        </h2>
        {todayWeight ? (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            오늘 저장됨:{" "}
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {todayWeight.weight} kg
            </span>
          </p>
        ) : (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            오늘 체중이 아직 없습니다.
          </p>
        )}
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <label className="sr-only" htmlFor="today-weight">
            오늘 체중 (kg)
          </label>
          <input
            id="today-weight"
            type="number"
            inputMode="decimal"
            placeholder={todayWeight ? String(todayWeight.weight) : "예: 78.5"}
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            className="min-h-[48px] flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-lg outline-none ring-emerald-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950"
          />
          <button
            type="button"
            onClick={onSaveWeight}
            className="min-h-[48px] rounded-xl bg-emerald-600 px-5 text-base font-semibold text-white hover:bg-emerald-700 active:bg-emerald-800"
          >
            저장
          </button>
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          오늘의 루틴
        </h2>
        {routines.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            첫 루틴을 만들면 여기에서 시작할 수 있어요.
          </p>
        ) : !todayRoutine ? (
          <p className="mt-3 text-sm text-amber-800 dark:text-amber-200/90">
            오늘은 휴식이거나 배정된 루틴이 없어요. 체중은 그대로 기록할 수
            있어요.
          </p>
        ) : (
          <>
            <p className="mt-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {todayRoutine.name}
            </p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              운동 {todayRoutine.exercises.length}개
            </p>
            <Link
              href="/workout/today?start=1"
              className="mt-4 flex min-h-[52px] items-center justify-center rounded-xl bg-emerald-600 text-center text-base font-semibold text-white hover:bg-emerald-700"
            >
              운동 시작
            </Link>
          </>
        )}
      </Card>

      <Card className="border-dashed">
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          바로 가기
        </p>
        <ul className="mt-3 flex flex-col gap-2 text-sm">
          <li>
            <Link className="text-emerald-700 hover:underline dark:text-emerald-400" href="/routines">
              루틴 관리
            </Link>
          </li>
          <li>
            <Link className="text-emerald-700 hover:underline dark:text-emerald-400" href="/schedule">
              주간 스케줄
            </Link>
          </li>
          <li>
            <Link className="text-emerald-700 hover:underline dark:text-emerald-400" href="/weight">
              체중 그래프
            </Link>
          </li>
          <li>
            <Link className="text-emerald-700 hover:underline dark:text-emerald-400" href="/history">
              운동 기록
            </Link>
          </li>
        </ul>
      </Card>
    </div>
  );
}
