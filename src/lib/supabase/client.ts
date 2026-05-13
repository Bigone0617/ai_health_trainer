"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * 브라우저용 Supabase 클라이언트(OAuth + 세션 쿠키).
 * `.env.local` 및 Vercel에 설정:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY
 *
 * 서비스 롤 키는 브라우저에 넣지 마세요.
 */
export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL 또는 NEXT_PUBLIC_SUPABASE_ANON_KEY가 없습니다."
    );
  }
  return createBrowserClient(url, anon);
}
