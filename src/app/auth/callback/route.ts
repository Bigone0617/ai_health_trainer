import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import {
  getSupabasePublicAnonKey,
  getSupabasePublicUrl,
} from "@/lib/supabase/publicEnv";

/**
 * OAuth 리다이렉트 처리. Supabase 대시보드 → Authentication → URL configuration에 등록:
 * - 사이트 URL: 예) http://localhost:3000(개발) 또는 프로덕션 origin
 * - 리다이렉트 URL: http://localhost:3000/auth/callback 및 https://<배포도메인>/auth/callback
 *
 * Authentication → Providers에서 Kakao를 켜세요.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  const url = getSupabasePublicUrl();
  const anon = getSupabasePublicAnonKey();
  if (!url || !anon) {
    return NextResponse.redirect(new URL("/login?error=auth", origin));
  }

  if (code) {
    const redirect = NextResponse.redirect(new URL(next, origin));
    const supabase = createServerClient(url, anon, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            redirect.cookies.set(name, value, options);
          });
        },
      },
    });
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return redirect;
    }
  }

  return NextResponse.redirect(new URL("/login?error=auth", origin));
}
