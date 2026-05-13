"use client";

import { createBrowserClient } from "@supabase/ssr";
import {
  getSupabasePublicAnonKey,
  getSupabasePublicUrl,
} from "./publicEnv";

/**
 * 브라우저용 Supabase 클라이언트(OAuth + 세션 쿠키).
 * Vercel·`.env`·`.env.local`의 `NEXT_PUBLIC_SUPABASE_*`를 사용합니다.
 */
export function createSupabaseBrowserClient() {
  const url = getSupabasePublicUrl();
  const anon = getSupabasePublicAnonKey();
  if (!url || !anon) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL 또는 NEXT_PUBLIC_SUPABASE_ANON_KEY가 없습니다."
    );
  }
  return createBrowserClient(url, anon);
}
