import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { Roboto } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/header/Navbar";
import ScrollProgress from "@/components/layout/ScrollProgress";
import StoreSync from "@/components/user/StoreSync";
import ModalHost from "@/components/anime/ModalHost";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Kuroiru — Anime tracker & database", template: "%s · Kuroiru" },
  description:
    "Discover trending anime, browse the airing calendar, listen to OP/ED themes and track your watchlist with optional AniList sync.",
  manifest: "/manifest.json",
  icons: { icon: "/icon.svg" },
  appleWebApp: { capable: true, title: "Kuroiru", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#151515",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={roboto.variable}>
      <body className="flex min-h-screen flex-col bg-bg text-white antialiased">
        <StoreSync />
        <Suspense fallback={<div className="h-14 border-b border-line bg-bg" />}>
          <Navbar />
        </Suspense>
        <ScrollProgress />
        <main className="mx-auto w-full max-w-[1800px] flex-1 px-3 pb-8 pt-4 sm:px-6">{children}</main>
        <footer className="border-t border-line px-6 pb-24 pt-8 text-center text-xs text-dim md:pb-8">
          Data from AniList &amp; AnimeThemes. Kuroiru is an unofficial fan project.
        </footer>
        <Suspense fallback={null}>
          <ModalHost />
        </Suspense>
      </body>
    </html>
  );
}
