/**
 * Supabase 브라우저·미들웨어·OAuth 콜백에서 공통으로 쓰는 공개 환경 변수.
 *
 * Vercel: Project → Environment Variables에
 * `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`를 넣은 뒤
 * **Redeploy**해야 `next build` 시 클라이언트 번들에 반영됩니다.
 * (변수만 추가하고 재배포하지 않으면 Kakao 로그인에 예전 빌드 값이 남을 수 있어요.)
 *
 * Kakao 로그인은 Supabase Auth를 거치므로, 위 두 값이 맞으면 배포 URL에서도 동일하게 동작합니다.
 * 리다이렉트 URI는 Supabase 대시보드에 `https://<배포도메인>/auth/callback`을 등록하세요.
 * (선택) `NEXT_PUBLIC_SITE_URL` — 배포 도메인 고정. **localhost 문자열은 넣지 마세요.**
 *   배포 사이트에서는 비우거나 실제 `https://…vercel.app`만 넣으면 됩니다.
 */

export function getSupabasePublicUrl(): string {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
}

export function getSupabasePublicAnonKey(): string {
  return (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
}

export function isSupabasePublicConfigured(): boolean {
  return Boolean(getSupabasePublicUrl() && getSupabasePublicAnonKey());
}
