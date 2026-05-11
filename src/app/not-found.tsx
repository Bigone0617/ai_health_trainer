import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        페이지를 찾을 수 없어요
      </h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        주소가 바뀌었거나 잘못된 링크일 수 있어요.
      </p>
      <Link
        href="/"
        className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
      >
        홈으로
      </Link>
    </div>
  );
}
