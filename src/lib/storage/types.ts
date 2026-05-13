import type { Routine, WeeklySchedule, WorkoutSession, WeightLog } from "../types";

export type WorkoutDataBundle = {
  routines: Routine[];
  weeklySchedule: WeeklySchedule;
  workoutSessions: WorkoutSession[];
  weightLogs: WeightLog[];
};

/** 화면은 NextSet 컨텍스트만 쓰고, 프로바이더가 여기로 저장을 위임합니다. */
export type WorkoutStoragePort = {
  loadAll(): Promise<WorkoutDataBundle>;
  saveRoutines(routines: Routine[]): Promise<void>;
  saveWeeklySchedule(schedule: WeeklySchedule): Promise<void>;
  saveWorkoutSessions(sessions: WorkoutSession[]): Promise<void>;
  saveWeightLogs(logs: WeightLog[]): Promise<void>;
  resetAll(): Promise<void>;
};
