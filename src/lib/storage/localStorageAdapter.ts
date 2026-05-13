import type { WorkoutStoragePort } from "./types";
import {
  loadRoutines,
  loadWeeklySchedule,
  loadWorkoutSessions,
  loadWeightLogs,
  saveRoutines as persistRoutinesToLocal,
  saveWeeklySchedule as persistScheduleToLocal,
  saveWorkoutSessions as persistSessionsToLocal,
  saveWeightLogs as persistWeightLogsToLocal,
} from "./localPersistence";
import {
  STORAGE_ROUTINES,
  STORAGE_WEEKLY_SCHEDULE,
  STORAGE_WORKOUT_SESSIONS,
  STORAGE_WEIGHT_LOGS,
  STORAGE_DISMISSED_DEFAULT_ROUTINES,
  STORAGE_SUPABASE_MIGRATED,
} from "../storageKeys";

export function createLocalWorkoutStorage(): WorkoutStoragePort {
  return {
    async loadAll() {
      return {
        routines: loadRoutines(),
        weeklySchedule: loadWeeklySchedule(),
        workoutSessions: loadWorkoutSessions(),
        weightLogs: loadWeightLogs(),
      };
    },
    saveRoutines(routines) {
      persistRoutinesToLocal(routines);
      return Promise.resolve();
    },
    saveWeeklySchedule(schedule) {
      persistScheduleToLocal(schedule);
      return Promise.resolve();
    },
    saveWorkoutSessions(sessions) {
      persistSessionsToLocal(sessions);
      return Promise.resolve();
    },
    saveWeightLogs(logs) {
      persistWeightLogsToLocal(logs);
      return Promise.resolve();
    },
    async resetAll() {
      localStorage.removeItem(STORAGE_ROUTINES);
      localStorage.removeItem(STORAGE_WEEKLY_SCHEDULE);
      localStorage.removeItem(STORAGE_WORKOUT_SESSIONS);
      localStorage.removeItem(STORAGE_WEIGHT_LOGS);
      localStorage.removeItem(STORAGE_DISMISSED_DEFAULT_ROUTINES);
      localStorage.removeItem(STORAGE_SUPABASE_MIGRATED);
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k?.startsWith("nextset:migrationUiResolved:")) {
          localStorage.removeItem(k);
        }
      }
    },
  };
}
