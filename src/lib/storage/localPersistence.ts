import {
  STORAGE_ROUTINES,
  STORAGE_WEIGHT_LOGS,
  STORAGE_WEEKLY_SCHEDULE,
  STORAGE_WORKOUT_SESSIONS,
} from "../storageKeys";
import type {
  Routine,
  WeightLog,
  WeeklySchedule,
  WorkoutSession,
} from "../types";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadRoutines(): Routine[] {
  if (typeof window === "undefined") return [];
  return safeParse<Routine[]>(localStorage.getItem(STORAGE_ROUTINES), []);
}

export function saveRoutines(routines: Routine[]): void {
  localStorage.setItem(STORAGE_ROUTINES, JSON.stringify(routines));
}

export function loadWeeklySchedule(): WeeklySchedule {
  if (typeof window === "undefined") return {};
  return safeParse<WeeklySchedule>(
    localStorage.getItem(STORAGE_WEEKLY_SCHEDULE),
    {}
  );
}

export function saveWeeklySchedule(schedule: WeeklySchedule): void {
  localStorage.setItem(STORAGE_WEEKLY_SCHEDULE, JSON.stringify(schedule));
}

export function loadWorkoutSessions(): WorkoutSession[] {
  if (typeof window === "undefined") return [];
  return safeParse<WorkoutSession[]>(
    localStorage.getItem(STORAGE_WORKOUT_SESSIONS),
    []
  );
}

export function saveWorkoutSessions(sessions: WorkoutSession[]): void {
  localStorage.setItem(STORAGE_WORKOUT_SESSIONS, JSON.stringify(sessions));
}

export function loadWeightLogs(): WeightLog[] {
  if (typeof window === "undefined") return [];
  return safeParse<WeightLog[]>(localStorage.getItem(STORAGE_WEIGHT_LOGS), []);
}

export function saveWeightLogs(logs: WeightLog[]): void {
  localStorage.setItem(STORAGE_WEIGHT_LOGS, JSON.stringify(logs));
}
