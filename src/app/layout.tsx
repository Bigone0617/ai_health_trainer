import type { Metadata } from "next";
import { Geist_Mono, Noto_Sans_KR } from "next/font/google";
import { AppFrame } from "@/components/AppFrame";
import { NextSetProvider } from "@/providers/nextset-provider";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-app-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NextSet — 운동 기록",
  description:
    "개인용 루틴 관리, 운동 기록, 체중 추적, 점진적 과부하(무게 자동 조정).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${notoSansKr.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans">
        <NextSetProvider>
          <AppFrame>{children}</AppFrame>
        </NextSetProvider>
      </body>
    </html>
  );
}
