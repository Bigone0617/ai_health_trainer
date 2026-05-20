"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/Card";
import { formatLocalDate, getScheduleDayKey } from "@/lib/dateUtils";
import {
  cancelRestEndInServiceWorker,
  registerRestTimerServiceWorker,
  requestRestNotificationPermissionIfDefault,
  scheduleRestEndInServiceWorker,
  showRestEndedNotification,
} from "@/lib/restEndNotification";
import { loadRestSeconds } from "@/lib/restTimerSettings";
import { useWorkoutScrollRestore } from "@/lib/useWorkoutScrollRestore";
import type { Routine, RoutineExercise } from "@/lib/types";
import {
  clearRestTimerState,
  clearWorkoutDraft,
  loadRestTimerState,
  loadWorkoutDraft,
  saveRestTimerState,
  saveWorkoutDraft,
} from "@/lib/workoutDraftStorage";
import {
  useNextSet,
  type WorkoutCompletionSummaryItem,
} from "@/providers/nextset-provider";

function sortExercises(exercises: RoutineExercise[]): RoutineExercise[] {
  return [...exercises].sort((a, b) => a.order - b.order);
}

type SetInput = { actualWeight: string; actualReps: string };

function buildInitialInputs(routine: Routine): Record<string, SetInput[]> {
  const next: Record<string, SetInput[]> = {};
  for (const ex of sortExercises(routine.exercises)) {
    next[ex.id] = Array.from({ length: ex.sets }, () => ({
      actualWeight: String(ex.targetWeight),
      actualReps: String(ex.targetReps),
    }));
  }
  return next;
}

function buildInitialChecks(routine: Routine): Record<string, boolean[]> {
  const next: Record<string, boolean[]> = {};
  for (const ex of sortExercises(routine.exercises)) {
    next[ex.id] = Array.from({ length: ex.sets }, () => false);
  }
  return next;
}

const REST_LAST_SECONDS_CHIME_SRC = "/audio/4second.mp3";
/** 휴식 종료 N초 전 알림음 (mp3 길이와 맞추면 자연스럽게 이어짐) */
const REST_CHIME_MS_BEFORE_END = 4000;

function formatRestClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

function WorkoutRoutineInputs({
  routine,
  todayStr,
  onCompleted,
}: {
  routine: Routine;
  todayStr: string;
  onCompleted: (summary: WorkoutCompletionSummaryItem[]) => void;
}) {
  const { completeWorkout } = useNextSet();
  const [inputs, setInputs] = useState<Record<string, SetInput[]>>(() => {
    const d = loadWorkoutDraft(routine.id, todayStr, routine);
    return d?.inputs ?? buildInitialInputs(routine);
  });
  const [setChecks, setSetChecks] = useState<Record<string, boolean[]>>(
    () => {
      const d = loadWorkoutDraft(routine.id, todayStr, routine);
      return d?.setChecks ?? buildInitialChecks(routine);
    }
  );
  const [restSession, setRestSession] = useState<{
    endsAt: number;
    totalSec: number;
  } | null>(() => loadRestTimerState(routine.id, todayStr));
  /** 타이머 UI를 주기적으로 다시 그리기 위한 틱(백그라운드 복귀 시에도 endsAt 기준으로 맞춤) */
  const [restTick, setRestTick] = useState(0);
  const restSessionRef = useRef(restSession);
  const hideAfterZeroRef = useRef(false);
  const hideRestTimeoutRef = useRef<number | null>(null);
  const restChimePlayedRef = useRef(false);
  const restChimeAudioRef = useRef<HTMLAudioElement | null>(null);
  const restEndNotifiedRef = useRef(false);

  const clearHideRestTimeout = useCallback(() => {
    if (hideRestTimeoutRef.current != null) {
      window.clearTimeout(hideRestTimeoutRef.current);
      hideRestTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    void registerRestTimerServiceWorker();
    const restored = loadRestTimerState(routine.id, todayStr);
    if (restored) {
      scheduleRestEndInServiceWorker(restored.endsAt);
    }
  }, [routine.id, todayStr]);

  useEffect(() => {
    restSessionRef.current = restSession;
  }, [restSession]);

  useEffect(() => {
    if (restSession) {
      saveRestTimerState(routine.id, todayStr, restSession);
    } else {
      clearRestTimerState(routine.id, todayStr);
    }
  }, [restSession, routine.id, todayStr]);

  void restTick;
  const restSecondsLeft =
    restSession === null
      ? null
      : Math.max(
          0,
          // eslint-disable-next-line react-hooks/purity -- 휴식 타이머는 시계 기준 남은 초
          Math.ceil((restSession.endsAt - Date.now()) / 1000)
        );
  const restTotal = restSession?.totalSec ?? 1;

  useEffect(() => {
    if (restSession === null) {
      clearHideRestTimeout();
      hideAfterZeroRef.current = false;
      restChimePlayedRef.current = false;
      restEndNotifiedRef.current = false;
      cancelRestEndInServiceWorker();
      return;
    }

    const tick = () => {
      setRestTick((n) => n + 1);
      const s = restSessionRef.current;
      if (!s) return;
      const now = Date.now();
      const msLeft = s.endsAt - now;
      if (
        msLeft > 0 &&
        msLeft <= REST_CHIME_MS_BEFORE_END &&
        !restChimePlayedRef.current
      ) {
        restChimePlayedRef.current = true;
        if (!restChimeAudioRef.current) {
          restChimeAudioRef.current = new Audio(REST_LAST_SECONDS_CHIME_SRC);
        }
        const a = restChimeAudioRef.current;
        a.currentTime = 0;
        void a.play().catch(() => {});
      }
      const left = Math.max(0, Math.ceil((s.endsAt - now) / 1000));
      if (left <= 0) {
        if (!restEndNotifiedRef.current) {
          restEndNotifiedRef.current = true;
          void showRestEndedNotification();
        }
        if (!hideAfterZeroRef.current) {
          hideAfterZeroRef.current = true;
          clearHideRestTimeout();
          hideRestTimeoutRef.current = window.setTimeout(() => {
            hideRestTimeoutRef.current = null;
            const current = restSessionRef.current;
            if (current && Date.now() >= current.endsAt) {
              setRestSession(null);
            }
            hideAfterZeroRef.current = false;
          }, 600);
        }
      }
    };

    tick();
    const id = window.setInterval(tick, 500);

    const onResume = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onResume);
    window.addEventListener("pageshow", onResume);

    return () => {
      window.clearInterval(id);
      clearHideRestTimeout();
      document.removeEventListener("visibilitychange", onResume);
      window.removeEventListener("pageshow", onResume);
    };
  }, [restSession, clearHideRestTimeout]);

  useEffect(() => {
    const restoreRestIfNeeded = () => {
      if (document.visibilityState !== "visible") return;
      const saved = loadRestTimerState(routine.id, todayStr);
      if (!saved) return;
      const current = restSessionRef.current;
      if (current?.endsAt === saved.endsAt) return;
      hideAfterZeroRef.current = false;
      clearHideRestTimeout();
      setRestSession(saved);
      scheduleRestEndInServiceWorker(saved.endsAt);
      setRestTick((n) => n + 1);
    };
    document.addEventListener("visibilitychange", restoreRestIfNeeded);
    window.addEventListener("pageshow", restoreRestIfNeeded);
    return () => {
      document.removeEventListener("visibilitychange", restoreRestIfNeeded);
      window.removeEventListener("pageshow", restoreRestIfNeeded);
    };
  }, [routine.id, todayStr, clearHideRestTimeout]);

  const draftRef = useRef({ inputs, setChecks });
  useEffect(() => {
    draftRef.current = { inputs, setChecks };
  }, [inputs, setChecks]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      saveWorkoutDraft(routine.id, todayStr, {
        inputs: draftRef.current.inputs,
        setChecks: draftRef.current.setChecks,
      });
    }, 400);
    return () => window.clearTimeout(id);
  }, [inputs, setChecks, routine.id, todayStr]);

  useEffect(() => {
    const flush = () => {
      saveWorkoutDraft(routine.id, todayStr, draftRef.current);
    };
    const onVis = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [routine.id, todayStr]);

  const startRestTimer = useCallback(() => {
    clearHideRestTimeout();
    hideAfterZeroRef.current = false;
    restChimePlayedRef.current = false;
    restEndNotifiedRef.current = false;
    requestRestNotificationPermissionIfDefault();
    const prev = restChimeAudioRef.current;
    if (prev) {
      prev.pause();
      prev.currentTime = 0;
    }
    const sec = loadRestSeconds();
    const endsAt = Date.now() + sec * 1000;
    scheduleRestEndInServiceWorker(endsAt);
    const session = { endsAt, totalSec: sec };
    saveRestTimerState(routine.id, todayStr, session);
    setRestSession(session);
    setRestTick((n) => n + 1);
  }, [clearHideRestTimeout, routine.id, todayStr]);

  const skipRestTimer = useCallback(() => {
    clearHideRestTimeout();
    const a = restChimeAudioRef.current;
    if (a) {
      a.pause();
      a.currentTime = 0;
    }
    restChimePlayedRef.current = false;
    restEndNotifiedRef.current = false;
    cancelRestEndInServiceWorker();
    clearRestTimerState(routine.id, todayStr);
    setRestSession(null);
    hideAfterZeroRef.current = false;
  }, [clearHideRestTimeout, routine.id, todayStr]);

  const updateSet = useCallback(
    (exerciseId: string, setIndex: number, patch: Partial<SetInput>) => {
      setInputs((prev) => {
        const row = prev[exerciseId];
        if (!row) return prev;
        const copy = row.map((s, i) =>
          i === setIndex ? { ...s, ...patch } : s
        );
        return { ...prev, [exerciseId]: copy };
      });
    },
    []
  );

  const toggleSetDone = useCallback(
    (exerciseId: string, setIndex: number, checked: boolean) => {
      setSetChecks((prev) => {
        const row = [...(prev[exerciseId] ?? [])];
        row[setIndex] = checked;
        return { ...prev, [exerciseId]: row };
      });
      if (checked) startRestTimer();
    },
    [startRestTimer]
  );

  const onComplete = async () => {
    const exercises = sortExercises(routine.exercises).map((ex) => {
      const rows = inputs[ex.id];
      if (!rows || rows.length !== ex.sets) {
        throw new Error("세트 입력이 비어 있어요.");
      }
      const sets = rows.map((row, i) => ({
        setNumber: i + 1,
        targetWeight: ex.targetWeight,
        targetReps: ex.targetReps,
        actualWeight: Number(row.actualWeight.replace(",", ".")),
        actualReps: Number(row.actualReps.replace(",", ".")),
      }));
      return {
        routineExerciseId: ex.id,
        name: ex.name,
        targetReps: ex.targetReps,
        targetWeight: ex.targetWeight,
        incrementWeight: ex.incrementWeight,
        sets,
      };
    });

    if (
      exercises.some((ex) =>
        ex.sets.some(
          (s) =>
            !Number.isFinite(s.actualWeight) ||
            !Number.isFinite(s.actualReps) ||
            s.actualWeight < 0 ||
            s.actualReps < 0
        )
      )
    ) {
      alert("모든 세트에 올바른 숫자를 입력해 주세요.");
      return;
    }

    const { summary } = await completeWorkout({
      routineId: routine.id,
      date: todayStr,
      exercises,
    });
    clearWorkoutDraft(routine.id, todayStr);
    onCompleted(summary);
  };

  return (
    <>
      {restSecondsLeft !== null && (
        <div
          className="fixed bottom-20 left-0 right-0 z-[45] mx-auto max-w-lg px-4 pb-2"
          role="status"
          aria-live="polite"
          aria-label="쉬는 시간 타이머"
        >
          <div className="rounded-2xl border border-emerald-600/40 bg-zinc-900 p-4 text-white shadow-xl dark:bg-zinc-950">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-emerald-200">쉬는 중</p>
              <button
                type="button"
                onClick={skipRestTimer}
                className="rounded-lg border border-zinc-600 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-800"
              >
                건너뛰기
              </button>
            </div>
            <p className="mt-1 font-mono text-3xl font-semibold tabular-nums">
              {formatRestClock(restSecondsLeft)}
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-700">
              <div
                className="h-full rounded-full bg-emerald-500 transition-[width] duration-1000 ease-linear"
                style={{
                  width: `${Math.min(100, Math.max(0, (restSecondsLeft / restTotal) * 100))}%`,
                }}
              />
            </div>
            <p className="mt-3 text-center">
              <Link
                href="/settings#rest-timer"
                className="text-xs font-medium text-emerald-300 underline hover:text-emerald-200"
              >
                설정에서 쉬는 시간 바꾸기
              </Link>
            </p>
          </div>
        </div>
      )}

      {sortExercises(routine.exercises).map((ex) => {
        const rows = inputs[ex.id] ?? [];
        const checks = setChecks[ex.id] ?? [];
        return (
          <Card key={ex.id}>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {ex.name}
            </h2>
            <dl className="mt-2 grid grid-cols-2 gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <div>
                <dt className="text-xs uppercase text-zinc-500">목표 무게</dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-100">
                  {ex.targetWeight} kg
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-zinc-500">목표 횟수</dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-100">
                  {ex.targetReps}회
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-zinc-500">세트</dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-100">
                  {ex.sets}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-zinc-500">증량</dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-100">
                  +{ex.incrementWeight} kg
                </dd>
              </div>
            </dl>

            <div className="mt-4 space-y-3">
              {rows.map((row, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <p className="text-xs font-semibold text-zinc-500">
                    {idx + 1}세트
                  </p>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                    <div>
                      <label
                        className="text-xs font-medium text-zinc-600 dark:text-zinc-400"
                        htmlFor={`w-${ex.id}-${idx}`}
                      >
                        실제 무게 (kg)
                      </label>
                      <input
                        id={`w-${ex.id}-${idx}`}
                        type="number"
                        inputMode="decimal"
                        className="mt-1 w-full min-h-[48px] rounded-lg border border-zinc-200 bg-white px-3 text-lg outline-none ring-emerald-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900"
                        value={row.actualWeight}
                        onChange={(e) =>
                          updateSet(ex.id, idx, {
                            actualWeight: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label
                        className="text-xs font-medium text-zinc-600 dark:text-zinc-400"
                        htmlFor={`r-${ex.id}-${idx}`}
                      >
                        실제 횟수
                      </label>
                      <input
                        id={`r-${ex.id}-${idx}`}
                        type="number"
                        inputMode="numeric"
                        className="mt-1 w-full min-h-[48px] rounded-lg border border-zinc-200 bg-white px-3 text-lg outline-none ring-emerald-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900"
                        value={row.actualReps}
                        onChange={(e) =>
                          updateSet(ex.id, idx, {
                            actualReps: e.target.value,
                          })
                        }
                      />
                    </div>
                    <label
                      htmlFor={`done-${ex.id}-${idx}`}
                      className="flex min-h-[48px] cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900 sm:flex-col sm:items-center sm:justify-center sm:py-3"
                    >
                      <input
                        id={`done-${ex.id}-${idx}`}
                        type="checkbox"
                        checked={checks[idx] ?? false}
                        onChange={(e) =>
                          toggleSetDone(ex.id, idx, e.target.checked)
                        }
                        className="h-6 w-6 shrink-0 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        완료
                      </span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        );
      })}

      <button
        type="button"
        onClick={onComplete}
        className="min-h-[56px] rounded-2xl bg-emerald-600 text-lg font-semibold text-white hover:bg-emerald-700"
      >
        운동 완료
      </button>
    </>
  );
}

export default function WorkoutTodayPage() {
  const router = useRouter();
  const { ready, routines, weeklySchedule } = useNextSet();

  const today = useMemo(() => new Date(), []);
  const todayStr = formatLocalDate(today);
  const dayKey = getScheduleDayKey(today);
  const routineId = weeklySchedule[dayKey] ?? null;
  const routine = routineId
    ? routines.find((r) => r.id === routineId)
    : null;

  const [summary, setSummary] = useState<WorkoutCompletionSummaryItem[] | null>(
    null
  );

  useWorkoutScrollRestore(routine?.id ?? null, todayStr, Boolean(ready && routine));

  if (!ready) {
    return (
      <div className="flex flex-1 items-center justify-center py-20 text-zinc-500">
        불러오는 중…
      </div>
    );
  }

  if (!routine) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          오늘의 운동
        </h1>
        <Card>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            오늘은 휴식이거나 배정된 루틴이 없어요. 스케줄에서 루틴을 배정한 뒤
            다시 열어 주세요.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            홈으로
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase text-zinc-500">오늘</p>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            {routine.name}
          </h1>
        </div>
        <Link
          href="/"
          className="text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
        >
          홈
        </Link>
      </div>

      <WorkoutRoutineInputs
        key={`${routine.id}-${routine.updatedAt}`}
        routine={routine}
        todayStr={todayStr}
        onCompleted={setSummary}
      />

      {summary && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="summary-title"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl dark:bg-zinc-900">
            <h2
              id="summary-title"
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
            >
              운동을 완료했어요
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              다음에 이 루틴을 할 때 적용될 목표 무게예요.
            </p>
            <ul className="mt-4 space-y-3">
              {summary.map((item) => (
                <li
                  key={item.name}
                  className={`rounded-xl border p-3 text-sm ${
                    item.increased
                      ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"
                      : "border-zinc-200 bg-zinc-50 text-zinc-800 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
                  }`}
                >
                  <p className="font-semibold">{item.name}</p>
                  <p className="mt-1">
                    {item.previousTarget} kg → {item.nextTarget} kg
                    {!item.increased && " (유지)"}
                  </p>
                  <p className="mt-1 text-xs opacity-90">{item.reason}</p>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="mt-6 w-full min-h-[52px] rounded-xl bg-zinc-900 text-base font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
              onClick={() => {
                setSummary(null);
                router.push("/");
              }}
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
