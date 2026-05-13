import type { SupabaseClient } from "@supabase/supabase-js";
import type { Routine, RoutineExercise } from "../types";
import type { WeeklySchedule, WorkoutSession, WeightLog } from "../types";
import type { WorkoutStoragePort, WorkoutDataBundle } from "./types";
import { workoutSessionVolume } from "../workoutStats";

type RoutineRow = {
  id: string;
  user_id: string;
  name: string;
  exercises: unknown;
  created_at: string;
  updated_at: string;
};

type WeeklyRow = {
  id: string;
  user_id: string;
  monday: string | null;
  tuesday: string | null;
  wednesday: string | null;
  thursday: string | null;
  friday: string | null;
  saturday: string | null;
  sunday: string | null;
};

type SessionRow = {
  id: string;
  user_id: string;
  routine_id: string | null;
  routine_name: string;
  date: string;
  exercises: unknown;
  total_volume: number;
  completed_at: string;
  created_at: string;
};

type WeightRow = {
  id: string;
  user_id: string;
  date: string;
  weight: number;
  created_at: string;
  updated_at: string;
};

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

function rowToRoutine(row: RoutineRow): Routine {
  return {
    id: row.id,
    name: row.name,
    exercises: (row.exercises as RoutineExercise[]) ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function weeklyRowToSchedule(row: WeeklyRow | null): WeeklySchedule {
  if (!row) return {};
  const s: WeeklySchedule = {};
  for (const d of DAYS) {
    const v = row[d];
    if (v !== null && v !== undefined) s[d] = v;
  }
  return s;
}

function sessionRowToSession(row: SessionRow): WorkoutSession {
  return {
    id: row.id,
    routineId: row.routine_id ?? "",
    routineName: row.routine_name,
    date: row.date,
    exercises: (row.exercises as WorkoutSession["exercises"]) ?? [],
    completedAt: row.completed_at,
  };
}

function weightRowToLog(row: WeightRow): WeightLog {
  return {
    id: row.id,
    date: row.date,
    weight: Number(row.weight),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createSupabaseWorkoutStorage(
  client: SupabaseClient,
  userId: string
): WorkoutStoragePort {
  return {
    async loadAll(): Promise<WorkoutDataBundle> {
      const [rRes, wRes, sRes, wlRes] = await Promise.all([
        client
          .from("routines")
          .select("*")
          .eq("user_id", userId)
          .order("updated_at", { ascending: false }),
        client
          .from("weekly_schedules")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle(),
        client
          .from("workout_sessions")
          .select("*")
          .eq("user_id", userId)
          .order("completed_at", { ascending: false }),
        client
          .from("weight_logs")
          .select("*")
          .eq("user_id", userId)
          .order("date", { ascending: false }),
      ]);

      if (rRes.error) throw rRes.error;
      if (wRes.error) throw wRes.error;
      if (sRes.error) throw sRes.error;
      if (wlRes.error) throw wlRes.error;

      const routines = (rRes.data as RoutineRow[] | null)?.map(rowToRoutine) ?? [];
      const weeklySchedule = weeklyRowToSchedule(wRes.data as WeeklyRow | null);
      const workoutSessions =
        (sRes.data as SessionRow[] | null)?.map(sessionRowToSession) ?? [];
      const weightLogs = (wlRes.data as WeightRow[] | null)?.map(weightRowToLog) ?? [];

      return { routines, weeklySchedule, workoutSessions, weightLogs };
    },

    async saveRoutines(routines) {
      const { data: existing } = await client
        .from("routines")
        .select("id")
        .eq("user_id", userId);
      const keep = new Set(routines.map((r) => r.id));
      const toRemove =
        existing?.map((r) => r.id).filter((id) => !keep.has(id)) ?? [];
      if (toRemove.length) {
        const { error } = await client.from("routines").delete().in("id", toRemove);
        if (error) throw error;
      }
      if (routines.length === 0) return;
      const rows = routines.map((r) => ({
        id: r.id,
        user_id: userId,
        name: r.name,
        exercises: r.exercises,
        created_at: r.createdAt,
        updated_at: r.updatedAt,
      }));
      const { error } = await client.from("routines").upsert(rows, {
        onConflict: "id",
      });
      if (error) throw error;
    },

    async saveWeeklySchedule(schedule) {
      const { data: row } = await client
        .from("weekly_schedules")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      const payload = {
        user_id: userId,
        monday: schedule.monday ?? null,
        tuesday: schedule.tuesday ?? null,
        wednesday: schedule.wednesday ?? null,
        thursday: schedule.thursday ?? null,
        friday: schedule.friday ?? null,
        saturday: schedule.saturday ?? null,
        sunday: schedule.sunday ?? null,
        updated_at: new Date().toISOString(),
      };

      if (row?.id) {
        const { error } = await client
          .from("weekly_schedules")
          .update(payload)
          .eq("id", row.id);
        if (error) throw error;
      } else {
        const { error } = await client.from("weekly_schedules").insert({
          ...payload,
          created_at: new Date().toISOString(),
        });
        if (error) throw error;
      }
    },

    async saveWorkoutSessions(sessions) {
      const { data: existing } = await client
        .from("workout_sessions")
        .select("id")
        .eq("user_id", userId);
      const keep = new Set(sessions.map((s) => s.id));
      const toRemove =
        existing?.map((r) => r.id).filter((id) => !keep.has(id)) ?? [];
      if (toRemove.length) {
        const { error } = await client
          .from("workout_sessions")
          .delete()
          .in("id", toRemove);
        if (error) throw error;
      }
      if (sessions.length === 0) return;
      const rows = sessions.map((s) => ({
        id: s.id,
        user_id: userId,
        routine_id: s.routineId || null,
        routine_name: s.routineName,
        date: s.date,
        exercises: s.exercises,
        total_volume: workoutSessionVolume(s),
        completed_at: s.completedAt,
      }));
      const { error } = await client.from("workout_sessions").upsert(rows, {
        onConflict: "id",
      });
      if (error) throw error;
    },

    async saveWeightLogs(logs) {
      const { data: existing } = await client
        .from("weight_logs")
        .select("id")
        .eq("user_id", userId);
      const keep = new Set(logs.map((l) => l.id));
      const toRemove =
        existing?.map((r) => r.id).filter((id) => !keep.has(id)) ?? [];
      if (toRemove.length) {
        const { error } = await client.from("weight_logs").delete().in("id", toRemove);
        if (error) throw error;
      }
      if (logs.length === 0) return;
      const rows = logs.map((l) => ({
        id: l.id,
        user_id: userId,
        date: l.date,
        weight: l.weight,
        created_at: l.createdAt,
        updated_at: l.updatedAt,
      }));
      const { error } = await client.from("weight_logs").upsert(rows, {
        onConflict: "id",
      });
      if (error) throw error;
    },

    async resetAll() {
      const { error: e1 } = await client
        .from("workout_sessions")
        .delete()
        .eq("user_id", userId);
      if (e1) throw e1;
      const { error: e2 } = await client
        .from("weekly_schedules")
        .delete()
        .eq("user_id", userId);
      if (e2) throw e2;
      const { error: e3 } = await client
        .from("weight_logs")
        .delete()
        .eq("user_id", userId);
      if (e3) throw e3;
      const { error: e4 } = await client.from("routines").delete().eq("user_id", userId);
      if (e4) throw e4;
    },
  };
}
