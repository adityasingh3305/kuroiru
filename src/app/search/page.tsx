import { Suspense } from "react";
import type { Metadata } from "next";
import SearchView from "@/components/anime/SearchView";

export const metadata: Metadata = { title: "Browse anime" };

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="skeleton h-40 rounded-xl" />}>
      <SearchView />
    </Suspense>
  );
}
