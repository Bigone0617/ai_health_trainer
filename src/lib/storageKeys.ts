export const STORAGE_ROUTINES = "nextset:routines";
export const STORAGE_WEEKLY_SCHEDULE = "nextset:weeklySchedule";
export const STORAGE_WORKOUT_SESSIONS = "nextset:workoutSessions";
export const STORAGE_WEIGHT_LOGS = "nextset:weightLogs";
export const STORAGE_REST_SECONDS = "nextset:restSeconds";
/** 기본 번들 루틴 이름을 사용자가 삭제한 경우, 자동 추가에서 제외 */
export const STORAGE_DISMISSED_DEFAULT_ROUTINES = "nextset:dismissedDefaultRoutineNames";
/** 로컬 → Supabase 마이그레이션 완료 후 true (로컬 데이터는 삭제하지 않음) */
export const STORAGE_SUPABASE_MIGRATED = "nextset:supabaseMigrated";

export function migrationUiResolvedKey(userId: string): string {
  return `nextset:migrationUiResolved:${userId}`;
}

/** 이 브라우저 탭/세션에서만 «나중에»로 닫았을 때 */
export const SESSION_MIGRATION_DISMISS = "nextset:migrationPromptSessionDismissed";