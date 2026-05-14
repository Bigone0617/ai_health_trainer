"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { migrationUiResolvedKey } from "@/lib/storageKeys";

function displayIdentity(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown>;
  id: string;
}): string {
  if (user.email) return user.email;
  const name = user.user_metadata?.full_name;
  if (typeof name === "string" && name.trim()) return name;
  const prov = user.user_metadata?.provider;
  if (typeof prov === "string" && prov.trim()) return prov;
  return user.id.slice(0, 8);
}

export function AccountStrip() {
  const pathname = usePathname();
  const { user, loading, supabaseConfigured, signOut } = useAuth();

  const handleLogout = async () => {
    if (user?.id && typeof window !== "undefined") {
      localStorage.removeItem(migrationUiResolvedKey(user.id));
      sessionStorage.removeItem("nextset:migrationPromptSessionDismissed");
    }
    await signOut();
  };

  if (pathname === "/login") return null;

  if (loading) {
    return (
      <div className="mb-3 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
        계정 확인 중…
      </div>
    );
  }

  if (user) {
    return (
      <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-xs dark:border-emerald-900 dark:bg-emerald-950/40">
        <p className="font-semibold text-emerald-900 dark:text-emerald-100">
          클라우드 동기화 사용 중
        </p>
        <p className="mt-0.5 text-emerald-800 dark:text-emerald-200">
          {displayIdentity(user)}
        </p>
        <button
          type="button"
          onClick={() => void handleLogout()}
          className="mt-2 text-left text-xs font-semibold text-emerald-900 underline hover:no-underline dark:text-emerald-200"
        >
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <div className="mb-3 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-900">
      <p className="font-semibold text-zinc-800 dark:text-zinc-100">
        게스트 모드: 데이터는 이 기기에만 저장됩니다.
      </p>
      <p className="mt-1 text-zinc-600 dark:text-zinc-400">
        Kakao로 로그인하면 루틴·운동·체중을 백업하고 다른 기기에서도 쓸 수
        있어요.
      </p>
      {supabaseConfigured ? (
        <Link
          href="/login"
          className="mt-2 inline-block font-semibold text-emerald-700 underline hover:no-underline dark:text-emerald-400"
        >
          로그인해 동기화
        </Link>
      ) : (
        <p className="mt-2 text-amber-800 dark:text-amber-200">
          클라우드를 쓰려면 `.env.local`(또는 배포 환경 변수)에 Supabase URL과
          anon 키를 넣어 주세요.
        </p>
      )}
    </div>
  );
}
