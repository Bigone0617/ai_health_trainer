import {
  loadRoutines,
  loadWeeklySchedule,
  loadWorkoutSessions,
  loadWeightLogs,
} from "./localPersistence";
import type { WorkoutDataBundle } from "./types";

export function readLocalGuestSnapshot(): WorkoutDataBundle {
  if (typeof window === "undefined") {
    return {
      routines: [],
      weeklySchedule: {},
      workoutSessions: [],
      weightLogs: [],
    };
  }
  return {
    routines: loadRoutines(),
    weeklySchedule: loadWeeklySchedule(),
    workoutSessions: loadWorkoutSessions(),
    weightLogs: loadWeightLogs(),
  };
}

export function hasMeaningfulGuestData(b: WorkoutDataBundle): boolean {
  return (
    b.routines.length > 0 ||
    b.workoutSessions.length > 0 ||
    b.weightLogs.length > 0
  );
}

export function hasMeaningfulCloudData(b: WorkoutDataBundle): boolean {
  return hasMeaningfulGuestData(b);
}
