"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/Card";
import { useAuth } from "@/providers/auth-provider";

function LoginContent() {
  const { signInWithOAuth, supabaseConfigured } = useAuth();
  const searchParams = useSearchParams();
  const err = searchParams.get("error");
  const [busy, setBusy] = useState(false);

  const onOAuth = async (provider: "google" | "kakao") => {
    if (!supabaseConfigured) return;
    setBusy(true);
    try {
      await signInWithOAuth(provider);
    } catch {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 py-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          운동 데이터 백업
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          계정 없이도 NextSet을 쓸 수 있어요. Kakao로 로그인하면 루틴·운동
          기록·체중을 기기 간에 동기화할 수 있어요.
        </p>
      </div>

      {err === "auth" && (
        <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          로그인을 완료하지 못했어요. 다시 시도해 주세요.
        </p>
      )}

      {!supabaseConfigured && (
        <p className="rounded-lg border border-zinc-300 bg-zinc-100 px-3 py-2 text-sm text-zinc-800 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200">
          Supabase가 설정되지 않았어요.{" "}
          <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">
            NEXT_PUBLIC_SUPABASE_URL
          </code>{" "}
          와{" "}
          <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">
            NEXT_PUBLIC_SUPABASE_ANON_KEY
          </code>
          를{" "}
          <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">
            .env.local
          </code>
          에 넣어 주세요. Supabase 대시보드에서 Google·Kakao 제공자를 켜고,
          리다이렉트 URL에{" "}
          <code className="break-all rounded bg-zinc-200 px-1 dark:bg-zinc-800">
            http://localhost:3000/auth/callback
          </code>
          과 배포 주소용{" "}
          <code className="break-all rounded bg-zinc-200 px-1 dark:bg-zinc-800">
            https://&lt;도메인&gt;/auth/callback
          </code>
          을 등록하세요. 배포 URL을 고정하려면 루트{" "}
          <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">
            .env
          </code>
          또는 Vercel 환경 변수에{" "}
          <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">
            NEXT_PUBLIC_SITE_URL
          </code>
          (끝 슬래시 없이)을 넣을 수 있어요.
        </p>
      )}

      <Card>
        <div className="flex flex-col gap-3">
          {/* <button
            type="button"
            disabled={!supabaseConfigured || busy}
            onClick={() => onOAuth("google")}
            className="min-h-[48px] rounded-xl bg-white text-sm font-semibold text-zinc-900 shadow ring-1 ring-zinc-200 hover:bg-zinc-50 disabled:opacity-50 dark:bg-zinc-900 dark:text-zinc-50 dark:ring-zinc-700 dark:hover:bg-zinc-800"
          >
            Google로 계속하기
          </button> */}
          <button
            type="button"
            disabled={!supabaseConfigured || busy}
            onClick={() => onOAuth("kakao")}
            className="min-h-[48px] rounded-xl bg-[#FEE500] text-sm font-semibold text-[#191919] hover:bg-[#fdd835] disabled:opacity-50"
          >
            Kakao로 계속하기
          </button>
          <Link
            href="/"
            className="flex min-h-[48px] items-center justify-center rounded-xl border border-zinc-200 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            게스트로 계속하기
          </Link>
        </div>
      </Card>

      <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
        로그인하면 데이터를 동기화할 수 있어요 · 게스트: 데이터는 이 기기에만
        저장됩니다.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-sm text-zinc-500">
          불러오는 중…
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
