"use client";

import Link from "next/link";
import { useNextSet } from "@/providers/nextset-provider";

export default function RoutinesListPage() {
  const { ready, routines, deleteRoutine, duplicateRoutine } = useNextSet();

  if (!ready) {
    return (
      <div className="flex flex-1 items-center justify-center py-20 text-zinc-500">
        불러오는 중…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          루틴
        </h1>
        <Link
          href="/routines/new"
          className="min-h-[44px] rounded-xl bg-emerald-600 px-4 text-sm font-semibold leading-[44px] text-white hover:bg-emerald-700"
        >
          새로 만들기
        </Link>
      </div>

      {routines.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
          첫 루틴을 만들면 여기에서 시작할 수 있어요.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {routines.map((r) => (
            <li
              key={r.id}
              className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    {r.name}
                  </p>
                  <p className="text-sm text-zinc-500">
                    운동 {r.exercises.length}개
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/routines/${r.id}`}
                    className="min-h-[44px] flex-1 rounded-xl border border-zinc-200 px-3 text-center text-sm font-semibold leading-[44px] text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800 sm:flex-none"
                  >
                    편집
                  </Link>
                  <button
                    type="button"
                    onClick={() => duplicateRoutine(r.id)}
                    className="min-h-[44px] flex-1 rounded-xl border border-zinc-200 px-3 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800 sm:flex-none"
                  >
                    복제
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        confirm(
                          `「${r.name}」 루틴을 삭제할까요? 되돌릴 수 없어요. 스케줄에 배정돼 있으면 해당 요일은 비워져요.`
                        )
                      ) {
                        deleteRoutine(r.id);
                      }
                    }}
                    className="min-h-[44px] flex-1 rounded-xl border border-red-200 px-3 text-sm font-semibold text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40 sm:flex-none"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
