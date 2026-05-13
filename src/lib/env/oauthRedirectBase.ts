/**
 * OAuth `redirectTo`에 쓸 사이트 베이스 URL.
 *
 * 배포 시 `.env` 또는 `.env.production`(또는 Vercel Production 환경 변수)에
 * `NEXT_PUBLIC_SITE_URL`을 넣으면 Kakao·Supabase에 등록한 리다이렉트 URI와
 * 정확히 일치시키기 쉽습니다. (끝 슬래시 없이, 예: https://my-app.vercel.app)
 *
 * 비어 있으면 브라우저 `window.location.origin`을 사용합니다(로컬 개발에 적합).
 */
export function getOAuthRedirectBase(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) {
    return raw.replace(/\/+$/, "");
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "";
}
