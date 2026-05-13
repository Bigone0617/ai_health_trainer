"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  hasMeaningfulCloudData,
  hasMeaningfulGuestData,
  migrateLocalIntoSupabase,
  readLocalGuestSnapshot,
} from "@/lib/storage";
import {
  migrationUiResolvedKey,
  SESSION_MIGRATION_DISMISS,
} from "@/lib/storageKeys";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabasePublicConfigured } from "@/lib/supabase/publicEnv";
import { useAuth } from "@/providers/auth-provider";
import { useNextSet } from "@/providers/nextset-provider";

export function MigrationGate() {
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();
  const { ready, reloadFromStorage, routines, workoutSessions, weightLogs } =
    useNextSet();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [dismissTick, setDismissTick] = useState(0);

  const { open, conflict } = useMemo(() => {
    void dismissTick;
    if (pathname === "/login" || authLoading || !user || !ready) {
      return { open: false, conflict: false };
    }
    if (typeof window === "undefined") {
      return { open: false, conflict: false };
    }
    if (sessionStorage.getItem(SESSION_MIGRATION_DISMISS)) {
      return { open: false, conflict: false };
    }
    const local = readLocalGuestSnapshot();
    if (!hasMeaningfulGuestData(local)) {
      return { open: false, conflict: false };
    }
    if (localStorage.getItem(migrationUiResolvedKey(user.id)) === "1") {
      return { open: false, conflict: false };
    }
    const cloudHas = hasMeaningfulCloudData({
      routines,
      weeklySchedule: {},
      workoutSessions,
      weightLogs,
    });
    return { open: true, conflict: cloudHas };
  }, [
    pathname,
    authLoading,
    user,
    ready,
    routines,
    workoutSessions,
    weightLogs,
    dismissTick,
  ]);

  const markResolved = () => {
    if (user?.id) {
      localStorage.setItem(migrationUiResolvedKey(user.id), "1");
    }
    setDismissTick((n) => n + 1);
  };

  const dismissSession = () => {
    sessionStorage.setItem(SESSION_MIGRATION_DISMISS, "1");
    setMessage(null);
    setDismissTick((n) => n + 1);
  };

  const runSync = async (overwriteSchedule: boolean) => {
    if (!user) return;
    setBusy(true);
    setMessage(null);
    try {
      if (!isSupabasePublicConfigured()) {
        throw new Error("Supabase가 설정되지 않았습니다.");
      }
      const client = createSupabaseBrowserClient();
      await migrateLocalIntoSupabase(client, user.id, {
        overwriteWeeklyScheduleWithLocal: overwriteSchedule,
      });
      setMessage("동기화했어요.");
      markResolved();
      await reloadFromStorage();
    } catch (e) {
      console.error(e);
      setMessage("동기화에 실패했어요. 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  };

  const onCloudOnly = () => {
    markResolved();
    void reloadFromStorage();
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="migration-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
    >
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
        <h2
          id="migration-title"
          className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
        >
          이 기기에 저장된 운동 데이터가 있어요
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          이 기기에 있는 데이터를 계정으로 옮기면 백업하고 다른 기기에서도 쓰기
          편해져요.
        </p>
        {conflict && (
          <p className="mt-2 text-sm font-medium text-amber-800 dark:text-amber-200">
            이미 클라우드에 데이터가 있어요. 이 기기 데이터를 계정에 합칠지,
            클라우드만 둘지 선택해 주세요.
          </p>
        )}
        {message && (
          <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-300">
            {message}
          </p>
        )}
        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void runSync(true)}
            className="min-h-[44px] rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {conflict ? "이 기기 데이터를 계정에 합치기" : "지금 동기화"}
          </button>
          {conflict ? (
            <button
              type="button"
              disabled={busy}
              onClick={onCloudOnly}
              className="min-h-[44px] rounded-xl border border-zinc-300 px-4 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              클라우드 데이터만 사용
            </button>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={onCloudOnly}
              className="min-h-[44px] rounded-xl border border-zinc-300 px-4 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              이 기기에만 두기
            </button>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={dismissSession}
            className="min-h-[44px] rounded-xl border border-transparent px-4 text-sm font-semibold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            나중에
          </button>
        </div>
      </div>
    </div>
  );
}
