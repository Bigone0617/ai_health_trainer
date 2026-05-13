import type { SupabaseClient } from "@supabase/supabase-js";
import type { WeeklySchedule } from "../types";
import { workoutSessionVolume } from "../workoutStats";
import { STORAGE_SUPABASE_MIGRATED } from "../storageKeys";
import { readLocalGuestSnapshot } from "./readLocalSnapshot";
import { createSupabaseWorkoutStorage } from "./supabaseAdapter";

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export type MigrateLocalOptions = {
  /** true면 클라우드 주간 행을 로컬 스케줄로 덮어씀(루틴 id는 새 id로 매핑). */
  overwriteWeeklyScheduleWithLocal: boolean;
};

/**
 * 로컬 게스트 루틴·세션을 클라우드에 새 행으로 넣고 루틴 ID를 매핑합니다.
 * localStorage는 지우지 않습니다. 완료 시 `nextset:supabaseMigrated`를 설정합니다.
 */
export async function migrateLocalIntoSupabase(
  client: SupabaseClient,
  userId: string,
  options: MigrateLocalOptions
): Promise<void> {
  const local = readLocalGuestSnapshot();
  const idMap = new Map<string, string>();

  for (const r of local.routines) {
    const newId = crypto.randomUUID();
    idMap.set(r.id, newId);
    const { error } = await client.from("routines").insert({
      id: newId,
      user_id: userId,
      name: r.name,
      exercises: r.exercises,
      created_at: r.createdAt,
      updated_at: r.updatedAt,
    });
    if (error) throw error;
  }

  if (options.overwriteWeeklyScheduleWithLocal) {
    const mapped: WeeklySchedule = {};
    for (const d of DAYS) {
      const rid = local.weeklySchedule[d];
      if (!rid) {
        mapped[d] = null;
        continue;
      }
      mapped[d] = idMap.get(rid) ?? null;
    }
    const storage = createSupabaseWorkoutStorage(client, userId);
    await storage.saveWeeklySchedule(mapped);
  }

  for (const s of local.workoutSessions) {
    const mappedRoutineId =
      s.routineId && idMap.has(s.routineId) ? idMap.get(s.routineId)! : null;
    const { error } = await client.from("workout_sessions").insert({
      id: crypto.randomUUID(),
      user_id: userId,
      routine_id: mappedRoutineId,
      routine_name: s.routineName,
      date: s.date,
      exercises: s.exercises,
      total_volume: workoutSessionVolume(s),
      completed_at: s.completedAt,
    });
    if (error) throw error;
  }

  for (const l of local.weightLogs) {
    const { data: existing } = await client
      .from("weight_logs")
      .select("id")
      .eq("user_id", userId)
      .eq("date", l.date)
      .maybeSingle();

    if (existing?.id) {
      const { error } = await client
        .from("weight_logs")
        .update({
          weight: l.weight,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await client.from("weight_logs").insert({
        id: crypto.randomUUID(),
        user_id: userId,
        date: l.date,
        weight: l.weight,
        created_at: l.createdAt,
        updated_at: l.updatedAt,
      });
      if (error) throw error;
    }
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_SUPABASE_MIGRATED, "true");
  }
}
