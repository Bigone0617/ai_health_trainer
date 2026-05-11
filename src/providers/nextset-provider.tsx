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
  loadRoutines,
  loadWeeklySchedule,
  loadWeightLogs,
  loadWorkoutSessions,
  saveRoutines,
  saveWeeklySchedule,
  saveWeightLogs,
  saveWorkoutSessions,
} from "@/lib/storage";
import { STORAGE_ROUTINES } from "@/lib/storageKeys";
import {
  createSampleRoutines,
  createSampleSchedule,
  createSampleWeightLog,
} from "@/lib/sampleData";
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

/** 최초 실행 시에만(스토리지에 루틴 키가 없을 때) 예시 데이터를 넣습니다. */
function seedIfFirstVisit(): void {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(STORAGE_ROUTINES) !== null) return;

  const sampleRoutines = createSampleRoutines();
  saveRoutines(sampleRoutines);
  saveWeeklySchedule(createSampleSchedule(sampleRoutines));
  const wl = createSampleWeightLog();
  saveWeightLogs([wl]);
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
  }) => { session: WorkoutSession; summary: WorkoutCompletionSummaryItem[] };
  resetAllData: () => void;
  exportJson: () => string;
  importJson: (json: string) => void;
};

const NextSetContext = createContext<NextSetContextValue | null>(null);

export function NextSetProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule>({});
  const [workoutSessions, setWorkoutSessions] = useState<WorkoutSession[]>([]);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);

  useEffect(() => {
    queueMicrotask(() => {
      seedIfFirstVisit();
      setRoutines(loadRoutines());
      setWeeklySchedule(loadWeeklySchedule());
      setWorkoutSessions(loadWorkoutSessions());
      setWeightLogs(loadWeightLogs());
      setReady(true);
    });
  }, []);

  const persistRoutines = useCallback((next: Routine[]) => {
    setRoutines(next);
    saveRoutines(next);
  }, []);

  const persistSchedule = useCallback((next: WeeklySchedule) => {
    setWeeklySchedule(next);
    saveWeeklySchedule(next);
  }, []);

  const persistSessions = useCallback((next: WorkoutSession[]) => {
    setWorkoutSessions(next);
    saveWorkoutSessions(next);
  }, []);

  const persistWeightLogs = useCallback((next: WeightLog[]) => {
    setWeightLogs(next);
    saveWeightLogs(next);
  }, []);

  const upsertRoutine = useCallback(
    (routine: Routine) => {
      const next = [...routines.filter((r) => r.id !== routine.id), routine];
      persistRoutines(next);
    },
    [persistRoutines, routines]
  );

  const deleteRoutine = useCallback(
    (id: string) => {
      persistRoutines(routines.filter((r) => r.id !== id));
      const sched = { ...weeklySchedule };
      (Object.keys(sched) as ScheduleDayKey[]).forEach((k) => {
        if (sched[k] === id) sched[k] = null;
      });
      persistSchedule(sched);
    },
    [persistRoutines, persistSchedule, routines, weeklySchedule]
  );

  const duplicateRoutine = useCallback(
    (id: string) => {
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
      persistRoutines([...routines, copy]);
    },
    [persistRoutines, routines]
  );

  const setScheduleDay = useCallback(
    (day: ScheduleDayKey, routineId: string | null) => {
      persistSchedule({ ...weeklySchedule, [day]: routineId });
    },
    [persistSchedule, weeklySchedule]
  );

  const saveSchedule = useCallback(
    (schedule: WeeklySchedule) => {
      persistSchedule(schedule);
    },
    [persistSchedule]
  );

  const upsertWeightForDate = useCallback(
    (date: string, weight: number) => {
      const t = nowIso();
      const existing = weightLogs.find((l) => l.date === date);
      if (existing) {
        const next = weightLogs.map((l) =>
          l.id === existing.id
            ? { ...l, weight, updatedAt: t }
            : l
        );
        persistWeightLogs(next);
        return;
      }
      const log: WeightLog = {
        id: newId(),
        date,
        weight,
        createdAt: t,
        updatedAt: t,
      };
      persistWeightLogs([...weightLogs, log]);
    },
    [persistWeightLogs, weightLogs]
  );

  const deleteWeightLog = useCallback(
    (id: string) => {
      persistWeightLogs(weightLogs.filter((l) => l.id !== id));
    },
    [persistWeightLogs, weightLogs]
  );

  const completeWorkout = useCallback(
    (args: {
      routineId: string;
      date: string;
      exercises: WorkoutCompletionExerciseInput[];
    }): { session: WorkoutSession; summary: WorkoutCompletionSummaryItem[] } => {
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
      persistRoutines(nextRoutines);
      persistSessions([session, ...workoutSessions]);

      return { session, summary };
    },
    [persistRoutines, persistSessions, routines, workoutSessions]
  );

  const resetAllData = useCallback(() => {
    localStorage.removeItem("nextset:routines");
    localStorage.removeItem("nextset:weeklySchedule");
    localStorage.removeItem("nextset:workoutSessions");
    localStorage.removeItem("nextset:weightLogs");
    setRoutines([]);
    setWeeklySchedule({});
    setWorkoutSessions([]);
    setWeightLogs([]);
  }, []);

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
    (json: string) => {
      const data = JSON.parse(json) as NextSetExport;
      if (!data || data.version !== 1) {
        throw new Error("백업 파일 형식이 올바르지 않습니다.");
      }
      saveRoutines(data.routines ?? []);
      saveWeeklySchedule(data.weeklySchedule ?? {});
      saveWorkoutSessions(data.workoutSessions ?? []);
      saveWeightLogs(data.weightLogs ?? []);
      setRoutines(loadRoutines());
      setWeeklySchedule(loadWeeklySchedule());
      setWorkoutSessions(loadWorkoutSessions());
      setWeightLogs(loadWeightLogs());
    },
    []
  );

  const value = useMemo<NextSetContextValue>(
    () => ({
      ready,
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
      exportJson,
      importJson,
    }),
    [
      ready,
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
      exportJson,
      importJson,
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
