"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { computeProgressiveOverload } from "@/lib/progressiveOverload";
import {
  createLocalWorkoutStorage,
  createSupabaseWorkoutStorage,
  type WorkoutStoragePort,
} from "@/lib/storage";
import { STORAGE_ROUTINES } from "@/lib/storageKeys";
import {
  buildDefaultScheduleIfApplicable,
  clearBundledDefaultDismissed,
  dismissBundledDefaultRoutineName,
  mergeBundledDefaultRoutines,
} from "@/lib/defaultRoutinesMerge";
import {
  createSampleRoutines,
  createSampleSchedule,
  createSampleWeightLog,
} from "@/lib/sampleData";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabasePublicConfigured } from "@/lib/supabase/publicEnv";
import { useAuth } from "@/providers/auth-provider";
import type {
  Routine,
  RoutineExercise,
  ScheduleDayKey,
  WeeklySchedule,
  WeightLog,
  WorkoutExerciseLog,
  WorkoutSession,
  WorkoutSetLog,
  NextSetExport,
} from "@/lib/types";

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  return crypto.randomUUID();
}

function sortExercises(exercises: RoutineExercise[]): RoutineExercise[] {
  return [...exercises].sort((a, b) => a.order - b.order);
}

function getSupabaseBrowserOrNull() {
  if (!isSupabasePublicConfigured()) return null;
  return createSupabaseBrowserClient();
}

/** 게스트만: 루틴 키가 없을 때 시드 */
function seedIfFirstVisitGuest(): void {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(STORAGE_ROUTINES) !== null) return;

  const sampleRoutines = createSampleRoutines();
  const local = createLocalWorkoutStorage();
  void local.saveRoutines(sampleRoutines);
  void local.saveWeeklySchedule(createSampleSchedule(sampleRoutines));
  void local.saveWeightLogs([createSampleWeightLog()]);
}

export type WorkoutCompletionExerciseInput = {
  routineExerciseId: string;
  name: string;
  targetReps: number;
  targetWeight: number;
  incrementWeight: number;
  sets: WorkoutSetLog[];
};

export type WorkoutCompletionSummaryItem = {
  name: string;
  previousTarget: number;
  nextTarget: number;
  increased: boolean;
  reason: string;
};

type NextSetContextValue = {
  ready: boolean;
  routines: Routine[];
  weeklySchedule: WeeklySchedule;
  workoutSessions: WorkoutSession[];
  weightLogs: WeightLog[];
  upsertRoutine: (routine: Routine) => void;
  deleteRoutine: (id: string) => void;
  duplicateRoutine: (id: string) => void;
  setScheduleDay: (day: ScheduleDayKey, routineId: string | null) => void;
  saveSchedule: (schedule: WeeklySchedule) => void;
  upsertWeightForDate: (date: string, weight: number) => void;
  deleteWeightLog: (id: string) => void;
  completeWorkout: (args: {
    routineId: string;
    date: string;
    exercises: WorkoutCompletionExerciseInput[];
  }) => Promise<{
    session: WorkoutSession;
    summary: WorkoutCompletionSummaryItem[];
  }>;
  resetAllData: () => void;
  applyDefaultRoutinesAndSchedule: () => void;
  exportJson: () => string;
  importJson: (json: string) => Promise<void>;
  /** 현재 저장소 백엔드에서 다시 불러오기(클라우드 마이그레이션 후 등). */
  reloadFromStorage: () => Promise<void>;
};

const NextSetContext = createContext<NextSetContextValue | null>(null);

async function loadAndApplyDefaults(
  storage: WorkoutStoragePort
): Promise<{
  routines: Routine[];
  weeklySchedule: WeeklySchedule;
  workoutSessions: WorkoutSession[];
  weightLogs: WeightLog[];
}> {
  const bundle = await storage.loadAll();
  let { routines, weeklySchedule } = bundle;
  const { workoutSessions, weightLogs } = bundle;

  const merged = mergeBundledDefaultRoutines(routines);
  if (merged.changed) {
    await storage.saveRoutines(merged.next);
    routines = merged.next;
  }
  const filled = buildDefaultScheduleIfApplicable(routines, weeklySchedule);
  if (filled) {
    await storage.saveWeeklySchedule(filled);
    weeklySchedule = filled;
  }

  return { routines, weeklySchedule, workoutSessions, weightLogs };
}

export function NextSetProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [ready, setReady] = useState(false);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule>({});
  const [workoutSessions, setWorkoutSessions] = useState<WorkoutSession[]>([]);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);

  const storage: WorkoutStoragePort | null = useMemo(() => {
    if (authLoading) return null;
    if (user) {
      const client = getSupabaseBrowserOrNull();
      if (!client) return null;
      return createSupabaseWorkoutStorage(client, user.id);
    }
    return createLocalWorkoutStorage();
  }, [authLoading, user]);

  const reloadFromStorage = useCallback(async () => {
    if (!storage) return;
    setReady(false);
    try {
      if (!user) {
        seedIfFirstVisitGuest();
      }
      const data = await loadAndApplyDefaults(storage);
      setRoutines(data.routines);
      setWeeklySchedule(data.weeklySchedule);
      setWorkoutSessions(data.workoutSessions);
      setWeightLogs(data.weightLogs);
    } finally {
      setReady(true);
    }
  }, [storage, user]);

  useEffect(() => {
    if (authLoading || !storage) return;
    let cancelled = false;
    queueMicrotask(() => setReady(false));
    void (async () => {
      try {
        if (!user) {
          seedIfFirstVisitGuest();
        }
        const data = await loadAndApplyDefaults(storage);
        if (cancelled) return;
        setRoutines(data.routines);
        setWeeklySchedule(data.weeklySchedule);
        setWorkoutSessions(data.workoutSessions);
        setWeightLogs(data.weightLogs);
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setRoutines([]);
          setWeeklySchedule({});
          setWorkoutSessions([]);
          setWeightLogs([]);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, storage, user]);

  const persistRoutines = useCallback(
    async (next: Routine[]) => {
      if (!storage) return;
      setRoutines(next);
      await storage.saveRoutines(next);
    },
    [storage]
  );

  const persistSchedule = useCallback(
    async (next: WeeklySchedule) => {
      if (!storage) return;
      setWeeklySchedule(next);
      await storage.saveWeeklySchedule(next);
    },
    [storage]
  );

  const persistSessions = useCallback(
    async (next: WorkoutSession[]) => {
      if (!storage) return;
      setWorkoutSessions(next);
      await storage.saveWorkoutSessions(next);
    },
    [storage]
  );

  const persistWeightLogs = useCallback(
    async (next: WeightLog[]) => {
      if (!storage) return;
      setWeightLogs(next);
      await storage.saveWeightLogs(next);
    },
    [storage]
  );

  const upsertRoutine = useCallback(
    (routine: Routine) => {
      void (async () => {
        const next = [...routines.filter((r) => r.id !== routine.id), routine];
        await persistRoutines(next);
      })().catch(console.error);
    },
    [persistRoutines, routines]
  );

  const deleteRoutine = useCallback(
    (id: string) => {
      void (async () => {
        const removed = routines.find((r) => r.id === id);
        if (removed) dismissBundledDefaultRoutineName(removed.name);
        await persistRoutines(routines.filter((r) => r.id !== id));
        const sched = { ...weeklySchedule };
        (Object.keys(sched) as ScheduleDayKey[]).forEach((k) => {
          if (sched[k] === id) sched[k] = null;
        });
        await persistSchedule(sched);
      })().catch(console.error);
    },
    [persistRoutines, persistSchedule, routines, weeklySchedule]
  );

  const duplicateRoutine = useCallback(
    (id: string) => {
      void (async () => {
        const source = routines.find((r) => r.id === id);
        if (!source) return;
        const t = nowIso();
        const copy: Routine = {
          id: newId(),
          name: `${source.name} (복사)`,
          createdAt: t,
          updatedAt: t,
          exercises: sortExercises(source.exercises).map((ex, i) => ({
            ...ex,
            id: newId(),
            order: i,
          })),
        };
        await persistRoutines([...routines, copy]);
      })().catch(console.error);
    },
    [persistRoutines, routines]
  );

  const setScheduleDay = useCallback(
    (day: ScheduleDayKey, routineId: string | null) => {
      void persistSchedule({ ...weeklySchedule, [day]: routineId }).catch(
        console.error
      );
    },
    [persistSchedule, weeklySchedule]
  );

  const saveSchedule = useCallback(
    (schedule: WeeklySchedule) => {
      void persistSchedule(schedule).catch(console.error);
    },
    [persistSchedule]
  );

  const upsertWeightForDate = useCallback(
    (date: string, weight: number) => {
      void (async () => {
        const t = nowIso();
        const existing = weightLogs.find((l) => l.date === date);
        if (existing) {
          const next = weightLogs.map((l) =>
            l.id === existing.id ? { ...l, weight, updatedAt: t } : l
          );
          await persistWeightLogs(next);
          return;
        }
        const log: WeightLog = {
          id: newId(),
          date,
          weight,
          createdAt: t,
          updatedAt: t,
        };
        await persistWeightLogs([...weightLogs, log]);
      })().catch(console.error);
    },
    [persistWeightLogs, weightLogs]
  );

  const deleteWeightLog = useCallback(
    (id: string) => {
      void persistWeightLogs(weightLogs.filter((l) => l.id !== id)).catch(
        console.error
      );
    },
    [persistWeightLogs, weightLogs]
  );

  const completeWorkout = useCallback(
    (args: {
      routineId: string;
      date: string;
      exercises: WorkoutCompletionExerciseInput[];
    }): Promise<{
      session: WorkoutSession;
      summary: WorkoutCompletionSummaryItem[];
    }> =>
      (async () => {
        const routine = routines.find((r) => r.id === args.routineId);
        if (!routine) {
          throw new Error("루틴을 찾을 수 없습니다.");
        }

        const summary: WorkoutCompletionSummaryItem[] = [];
        const exerciseLogs: WorkoutExerciseLog[] = [];

        for (const ex of args.exercises) {
          const overloadInput = {
            targetReps: ex.targetReps,
            targetWeight: ex.targetWeight,
            incrementWeight: ex.incrementWeight,
            sets: ex.sets,
          };
          const { successful, nextTargetWeight, reason } =
            computeProgressiveOverload(overloadInput);

          exerciseLogs.push({
            routineExerciseId: ex.routineExerciseId,
            name: ex.name,
            targetSets: ex.sets.length,
            targetReps: ex.targetReps,
            targetWeight: ex.targetWeight,
            incrementWeight: ex.incrementWeight,
            successful,
            nextTargetWeight,
            sets: ex.sets,
          });

          summary.push({
            name: ex.name,
            previousTarget: ex.targetWeight,
            nextTarget: nextTargetWeight,
            increased: successful,
            reason,
          });
        }

        const session: WorkoutSession = {
          id: newId(),
          routineId: routine.id,
          routineName: routine.name,
          date: args.date,
          exercises: exerciseLogs,
          completedAt: nowIso(),
        };

        const updatedRoutine: Routine = {
          ...routine,
          updatedAt: nowIso(),
          exercises: sortExercises(routine.exercises).map((ex) => {
            const log = exerciseLogs.find(
              (l) => l.routineExerciseId === ex.id
            );
            if (!log) return ex;
            return { ...ex, targetWeight: log.nextTargetWeight };
          }),
        };

        const nextRoutines = routines.map((r) =>
          r.id === updatedRoutine.id ? updatedRoutine : r
        );
        await persistRoutines(nextRoutines);
        await persistSessions([session, ...workoutSessions]);

        return { session, summary };
      })(),
    [persistRoutines, persistSessions, routines, workoutSessions]
  );

  const resetAllData = useCallback(() => {
    void (async () => {
      if (!storage) return;
      await storage.resetAll();
      setRoutines([]);
      setWeeklySchedule({});
      setWorkoutSessions([]);
      setWeightLogs([]);
    })().catch(console.error);
  }, [storage]);

  const applyDefaultRoutinesAndSchedule = useCallback(() => {
    void (async () => {
      clearBundledDefaultDismissed();
      const sampleRoutines = createSampleRoutines();
      const schedule = createSampleSchedule(sampleRoutines);
      await persistRoutines(sampleRoutines);
      await persistSchedule(schedule);
    })().catch(console.error);
  }, [persistRoutines, persistSchedule]);

  const exportJson = useCallback(() => {
    const payload: NextSetExport = {
      version: 1,
      exportedAt: nowIso(),
      routines,
      weeklySchedule,
      workoutSessions,
      weightLogs,
    };
    return JSON.stringify(payload, null, 2);
  }, [routines, weeklySchedule, workoutSessions, weightLogs]);

  const importJson = useCallback(
    async (json: string) => {
      if (!storage) return;
      const data = JSON.parse(json) as NextSetExport;
      if (!data || data.version !== 1) {
        throw new Error("백업 파일 형식이 올바르지 않습니다.");
      }
      const r = data.routines ?? [];
      const w = data.weeklySchedule ?? {};
      const s = data.workoutSessions ?? [];
      const wl = data.weightLogs ?? [];
      await storage.saveRoutines(r);
      await storage.saveWeeklySchedule(w);
      await storage.saveWorkoutSessions(s);
      await storage.saveWeightLogs(wl);
      setRoutines(r);
      setWeeklySchedule(w);
      setWorkoutSessions(s);
      setWeightLogs(wl);
    },
    [storage]
  );

  const value = useMemo<NextSetContextValue>(
    () => ({
      ready: ready && !authLoading && storage !== null,
      routines,
      weeklySchedule,
      workoutSessions,
      weightLogs,
      upsertRoutine,
      deleteRoutine,
      duplicateRoutine,
      setScheduleDay,
      saveSchedule,
      upsertWeightForDate,
      deleteWeightLog,
      completeWorkout,
      resetAllData,
      applyDefaultRoutinesAndSchedule,
      exportJson,
      importJson,
      reloadFromStorage,
    }),
    [
      ready,
      authLoading,
      storage,
      routines,
      weeklySchedule,
      workoutSessions,
      weightLogs,
      upsertRoutine,
      deleteRoutine,
      duplicateRoutine,
      setScheduleDay,
      saveSchedule,
      upsertWeightForDate,
      deleteWeightLog,
      completeWorkout,
      resetAllData,
      applyDefaultRoutinesAndSchedule,
      exportJson,
      importJson,
      reloadFromStorage,
    ]
  );

  return (
    <NextSetContext.Provider value={value}>{children}</NextSetContext.Provider>
  );
}

export function useNextSet(): NextSetContextValue {
  const ctx = useContext(NextSetContext);
  if (!ctx) {
    throw new Error("useNextSet은 NextSetProvider 안에서만 사용할 수 있습니다.");
  }
  return ctx;
}
