/**
 * OAuth `redirectTo`에 쓸 사이트 베이스 URL.
 *
 * - **로컬**(`localhost` 등): 항상 현재 탭의 `origin`만 사용합니다.
 *   (`.env`에 프로덕션 URL이 있어도 로컬 카카오 테스트는 localhost로 갑니다.)
 *
 * - **배포**(Vercel 등): `NEXT_PUBLIC_SITE_URL`이 있고 localhost가 **아니면** 그 값을 쓰고,
 *   없거나 localhost로 잘못 넣었으면 **현재 탭 origin**을 씁니다.
 *   (Vercel에 실수로 localhost만 넣어도 배포 URL로 리다이렉트되게 합니다.)
 *
 * Supabase 대시보드 → Authentication → URL configuration에도
 * `https://<배포도메인>/auth/callback` 을 등록해야 합니다.
 */

function looksLikeLocalhost(url: string): boolean {
  const s = url.trim().toLowerCase();
  if (!s) return false;
  try {
    const u = new URL(s.includes("://") ? s : `https://${s}`);
    return (
      u.hostname === "localhost" ||
      u.hostname === "127.0.0.1" ||
      u.hostname === "[::1]"
    );
  } catch {
    return /localhost|127\.0\.0\.1/.test(s);
  }
}

export function getOAuthRedirectBase(): string {
  const fromEnv = (process.env.NEXT_PUBLIC_SITE_URL ?? "")
    .trim()
    .replace(/\/+$/, "");

  if (typeof window !== "undefined") {
    const origin = window.location.origin;

    if (looksLikeLocalhost(origin)) {
      return origin;
    }

    if (fromEnv && !looksLikeLocalhost(fromEnv)) {
      return fromEnv;
    }
    return origin;
  }

  if (fromEnv) return fromEnv;
  return "";
}
