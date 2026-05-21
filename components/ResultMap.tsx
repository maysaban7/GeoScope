"use client";

import dynamic from "next/dynamic";
import type { Candidate } from "@/lib/schema";

const MapInner = dynamic(() => import("./MapInner"), {
  ssr: false,
  loading: () => (
    <div
      className="w-full rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 text-sm"
      style={{ height: "380px" }}
    >
      טוען מפה…
    </div>
  ),
});

export function ResultMap({ candidates }: { candidates: Candidate[] }) {
  return <MapInner candidates={candidates} />;
}
