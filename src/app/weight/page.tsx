"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/Card";
import { WeightTrendChart } from "@/components/WeightTrendChart";
import { formatLocalDate } from "@/lib/dateUtils";
import {
  averageLast7Days,
  buildWeightChartData,
  latestWeight,
  sortedByDate,
  startingWeight,
} from "@/lib/weightStats";
import { useNextSet } from "@/providers/nextset-provider";

export default function WeightPage() {
  const { ready, weightLogs, upsertWeightForDate, deleteWeightLog } =
    useNextSet();
  const [date, setDate] = useState(() => formatLocalDate(new Date()));
  const [weight, setWeight] = useState("");

  const chartData = useMemo(
    () => buildWeightChartData(weightLogs, 30),
    [weightLogs]
  );

  const sorted = useMemo(() => sortedByDate(weightLogs), [weightLogs]);
  const recent = useMemo(() => [...sorted].reverse().slice(0, 14), [sorted]);

  const lw = latestWeight(weightLogs);
  const sw = startingWeight(weightLogs);
  const avg7 = averageLast7Days(weightLogs);
  const change =
    lw !== null && sw !== null ? Math.round((lw - sw) * 10) / 10 : null;

  if (!ready) {
    return (
      <div className="flex flex-1 items-center justify-center py-20 text-zinc-500">
        불러오는 중…
      </div>
    );
  }

  const onSave = () => {
    const n = Number(weight.replace(",", "."));
    if (!Number.isFinite(n) || n <= 0) return;
    upsertWeightForDate(date, n);
    setWeight("");
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        체중
      </h1>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Card className="!p-3">
          <p className="text-xs text-zinc-500">최근</p>
          <p className="text-lg font-semibold">
            {lw !== null ? `${lw} kg` : "—"}
          </p>
        </Card>
        <Card className="!p-3">
          <p className="text-xs text-zinc-500">시작</p>
          <p className="text-lg font-semibold">
            {sw !== null ? `${sw} kg` : "—"}
          </p>
        </Card>
        <Card className="!p-3">
          <p className="text-xs text-zinc-500">변화</p>
          <p className="text-lg font-semibold">
            {change === null ? "—" : `${change >= 0 ? "+" : ""}${change} kg`}
          </p>
        </Card>
        <Card className="!p-3">
          <p className="text-xs text-zinc-500">7일 평균</p>
          <p className="text-lg font-semibold">
            {avg7 !== null ? `${avg7.toFixed(1)} kg` : "—"}
          </p>
        </Card>
      </div>

      <Card>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          날짜별 입력·수정
        </h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            날짜
            <input
              type="date"
              className="min-h-[48px] rounded-xl border border-zinc-200 bg-zinc-50 px-3 dark:border-zinc-700 dark:bg-zinc-950"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            체중 (kg)
            <input
              type="number"
              inputMode="decimal"
              className="min-h-[48px] rounded-xl border border-zinc-200 bg-zinc-50 px-3 dark:border-zinc-700 dark:bg-zinc-950"
              value={weight}
              placeholder={
                weightLogs.find((l) => l.date === date)
                  ? String(weightLogs.find((l) => l.date === date)!.weight)
                  : ""
              }
              onChange={(e) => setWeight(e.target.value)}
            />
          </label>
          <div className="flex items-end">
            <button
              type="button"
              onClick={onSave}
              className="min-h-[48px] w-full rounded-xl bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              저장
            </button>
          </div>
        </div>
      </Card>

      {weightLogs.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-300 p-6 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
          첫 체중을 기록해 보세요.
        </p>
      ) : (
        <Card>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            추세 (최근 30일 또는 기록 구간)
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            초록: 그날 체중. 보라: 기록이 있는 날만 반영한 7일 이동 평균.
          </p>
          <div className="mt-4">
            <WeightTrendChart data={chartData} />
          </div>
        </Card>
      )}

      {recent.length > 0 && (
        <Card>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            최근 기록
          </h2>
          <ul className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-800">
            {recent.map((log) => (
              <li
                key={log.id}
                className="flex items-center justify-between gap-2 py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">
                    {log.date}
                  </p>
                  <p className="text-zinc-500">{log.weight} kg</p>
                </div>
                <button
                  type="button"
                  className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 dark:border-red-900 dark:text-red-300"
                  onClick={() => {
                    if (confirm("이 체중 기록을 삭제할까요?")) {
                      deleteWeightLog(log.id);
                    }
                  }}
                >
                  삭제
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
