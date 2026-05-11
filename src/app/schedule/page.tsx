"use client";

import { Card } from "@/components/Card";
import { SCHEDULE_DAYS } from "@/lib/scheduleLabels";
import type { ScheduleDayKey } from "@/lib/types";
import { useNextSet } from "@/providers/nextset-provider";

export default function SchedulePage() {
  const { ready, routines, weeklySchedule, setScheduleDay } = useNextSet();

  if (!ready) {
    return (
      <div className="flex flex-1 items-center justify-center py-20 text-zinc-500">
        불러오는 중…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        주간 스케줄
      </h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        요일마다 루틴을 고르면 바로 저장돼요.
      </p>

      <div className="flex flex-col gap-3">
        {SCHEDULE_DAYS.map(({ key, label }) => {
          const value = weeklySchedule[key as ScheduleDayKey] ?? "";
          return (
            <Card key={key}>
              <label
                className="flex flex-col gap-2 text-sm font-medium text-zinc-800 dark:text-zinc-200"
                htmlFor={`day-${key}`}
              >
                {label}
                <select
                  id={`day-${key}`}
                  className="min-h-[48px] rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-base dark:border-zinc-700 dark:bg-zinc-950"
                  value={value === null || value === undefined ? "" : value}
                  onChange={(e) => {
                    const v = e.target.value;
                    setScheduleDay(
                      key as ScheduleDayKey,
                      v === "" ? null : v
                    );
                  }}
                >
                  <option value="">휴식</option>
                  {routines.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </label>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
