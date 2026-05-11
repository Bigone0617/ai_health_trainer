"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Routine, RoutineExercise } from "@/lib/types";
import { useNextSet } from "@/providers/nextset-provider";

function nowIso() {
  return new Date().toISOString();
}

function newId() {
  return crypto.randomUUID();
}

type DraftExercise = {
  clientKey: string;
  id: string;
  name: string;
  sets: string;
  targetReps: string;
  targetWeight: string;
  incrementWeight: string;
  order: number;
};

function exerciseToDraft(ex: RoutineExercise, order: number): DraftExercise {
  return {
    clientKey: ex.id,
    id: ex.id,
    name: ex.name,
    sets: String(ex.sets),
    targetReps: String(ex.targetReps),
    targetWeight: String(ex.targetWeight),
    incrementWeight: String(ex.incrementWeight),
    order,
  };
}

function parseDraft(
  d: DraftExercise
): Omit<RoutineExercise, "order"> | null {
  const sets = Number(d.sets);
  const targetReps = Number(d.targetReps);
  const targetWeight = Number(d.targetWeight.replace(",", "."));
  const incrementWeight = Number(d.incrementWeight.replace(",", "."));
  if (!d.name.trim()) return null;
  if (
    !Number.isFinite(sets) ||
    !Number.isFinite(targetReps) ||
    !Number.isFinite(targetWeight) ||
    !Number.isFinite(incrementWeight) ||
    sets <= 0 ||
    targetReps <= 0 ||
    targetWeight < 0 ||
    incrementWeight < 0
  ) {
    return null;
  }
  return {
    id: d.id,
    name: d.name.trim(),
    sets: Math.floor(sets),
    targetReps: Math.floor(targetReps),
    targetWeight,
    incrementWeight,
  };
}

export function RoutineEditor({
  initialRoutine,
}: {
  initialRoutine: Routine | null;
}) {
  const router = useRouter();
  const { upsertRoutine } = useNextSet();
  const isNew = !initialRoutine;
  const [generatedRoutineId] = useState(() => crypto.randomUUID());
  const routineId = initialRoutine?.id ?? generatedRoutineId;
  const [name, setName] = useState(initialRoutine?.name ?? "새 루틴");
  const [exercises, setExercises] = useState<DraftExercise[]>(() => {
    if (initialRoutine && initialRoutine.exercises.length > 0) {
      return [...initialRoutine.exercises]
        .sort((a, b) => a.order - b.order)
        .map((ex, i) => exerciseToDraft(ex, i));
    }
    return [
      {
        clientKey: newId(),
        id: newId(),
        name: "",
        sets: "3",
        targetReps: "8",
        targetWeight: "0",
        incrementWeight: "2.5",
        order: 0,
      },
    ];
  });

  const addExercise = () => {
    setExercises((prev) => {
      const nextOrder = prev.length;
      return [
        ...prev,
        {
          clientKey: newId(),
          id: newId(),
          name: "",
          sets: "3",
          targetReps: "8",
          targetWeight: "0",
          incrementWeight: "2.5",
          order: nextOrder,
        },
      ];
    });
  };

  const removeExercise = (clientKey: string) => {
    setExercises((prev) =>
      prev
        .filter((e) => e.clientKey !== clientKey)
        .map((e, i) => ({ ...e, order: i }))
    );
  };

  const move = (clientKey: string, dir: -1 | 1) => {
    setExercises((prev) => {
      const idx = prev.findIndex((e) => e.clientKey === clientKey);
      const j = idx + dir;
      if (idx < 0 || j < 0 || j >= prev.length) return prev;
      const copy = [...prev];
      const tmp = copy[idx];
      copy[idx] = copy[j]!;
      copy[j] = tmp!;
      return copy.map((e, i) => ({ ...e, order: i }));
    });
  };

  const patchExercise = (
    clientKey: string,
    patch: Partial<DraftExercise>
  ) => {
    setExercises((prev) =>
      prev.map((e) => (e.clientKey === clientKey ? { ...e, ...patch } : e))
    );
  };

  const onSave = () => {
    const parsed: RoutineExercise[] = [];
    for (const row of exercises) {
      const p = parseDraft(row);
      if (!p) {
        alert(
          "운동마다 이름을 입력하고, 세트·횟수·무게는 올바른 양수인지 확인해 주세요."
        );
        return;
      }
      parsed.push({ ...p, order: parsed.length });
    }

    const t = nowIso();
    const routine: Routine = {
      id: routineId,
      name: name.trim() || "이름 없는 루틴",
      exercises: parsed,
      createdAt: initialRoutine?.createdAt ?? t,
      updatedAt: t,
    };
    upsertRoutine(routine);
    router.push("/routines");
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          {isNew ? "새 루틴" : "루틴 편집"}
        </h1>
        <Link
          href="/routines"
          className="text-sm font-medium text-zinc-600 hover:underline dark:text-zinc-400"
        >
          취소
        </Link>
      </div>

      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        루틴 이름
        <input
          className="min-h-[48px] rounded-xl border border-zinc-200 bg-white px-3 text-base outline-none ring-emerald-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          운동 목록
        </h2>
        <button
          type="button"
          onClick={addExercise}
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          운동 추가
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {exercises.map((ex, idx) => (
          <div
            key={ex.clientKey}
            className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-zinc-500">
                운동 {idx + 1}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-zinc-200 px-2 py-1 text-xs font-semibold dark:border-zinc-700"
                  onClick={() => move(ex.clientKey, -1)}
                  disabled={idx === 0}
                >
                  위로
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-zinc-200 px-2 py-1 text-xs font-semibold dark:border-zinc-700"
                  onClick={() => move(ex.clientKey, 1)}
                  disabled={idx === exercises.length - 1}
                >
                  아래로
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-red-200 px-2 py-1 text-xs font-semibold text-red-700 dark:border-red-900 dark:text-red-300"
                  onClick={() => removeExercise(ex.clientKey)}
                >
                  삭제
                </button>
              </div>
            </div>

            <label className="mt-3 flex flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
              운동 이름
              <input
                className="min-h-[48px] rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-base dark:border-zinc-700 dark:bg-zinc-950"
                value={ex.name}
                onChange={(e) =>
                  patchExercise(ex.clientKey, { name: e.target.value })
                }
              />
            </label>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                세트 수
                <input
                  type="number"
                  inputMode="numeric"
                  className="min-h-[48px] rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-base dark:border-zinc-700 dark:bg-zinc-950"
                  value={ex.sets}
                  onChange={(e) =>
                    patchExercise(ex.clientKey, { sets: e.target.value })
                  }
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                목표 횟수 (회)
                <input
                  type="number"
                  inputMode="numeric"
                  className="min-h-[48px] rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-base dark:border-zinc-700 dark:bg-zinc-950"
                  value={ex.targetReps}
                  onChange={(e) =>
                    patchExercise(ex.clientKey, { targetReps: e.target.value })
                  }
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                목표 무게 (kg)
                <input
                  type="number"
                  inputMode="decimal"
                  className="min-h-[48px] rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-base dark:border-zinc-700 dark:bg-zinc-950"
                  value={ex.targetWeight}
                  onChange={(e) =>
                    patchExercise(ex.clientKey, {
                      targetWeight: e.target.value,
                    })
                  }
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                증량 (kg)
                <input
                  type="number"
                  inputMode="decimal"
                  className="min-h-[48px] rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-base dark:border-zinc-700 dark:bg-zinc-950"
                  value={ex.incrementWeight}
                  onChange={(e) =>
                    patchExercise(ex.clientKey, {
                      incrementWeight: e.target.value,
                    })
                  }
                />
              </label>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onSave}
        className="min-h-[52px] rounded-2xl bg-emerald-600 text-base font-semibold text-white hover:bg-emerald-700"
      >
        루틴 저장
      </button>
    </div>
  );
}
