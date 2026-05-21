"use client";

import { useState } from "react";
import { UploadZone } from "@/components/UploadZone";
import type { LocateResponse } from "@/lib/schema";

type Status = "idle" | "loading" | "done" | "error";

export default function Home() {
  const [status, setStatus] = useState<Status>("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<LocateResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleFile(file: File) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setStatus("loading");
    setResult(null);
    setErrorMessage(null);

    const form = new FormData();
    form.set("image", file);

    try {
      const res = await fetch("/api/locate", { method: "POST", body: form });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error ?? `שגיאה ${res.status}`);
      }
      const data = (await res.json()) as LocateResponse;
      setResult(data);
      setStatus("done");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "שגיאה לא ידועה");
      setStatus("error");
    }
  }

  function reset() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setResult(null);
    setErrorMessage(null);
    setStatus("idle");
  }

  return (
    <main className="flex flex-col flex-1 w-full max-w-3xl mx-auto px-6 py-12 gap-8">
      <header className="text-center">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          GeoScope
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          העלה תמונה — נגלה איפה בישראל היא צולמה.
        </p>
      </header>

      {status === "idle" && (
        <UploadZone onFile={handleFile} />
      )}

      {(status === "loading" || status === "done" || status === "error") && (
        <section className="flex flex-col gap-6">
          {previewUrl && (
            <div className="flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="התמונה שהועלתה"
                className="max-h-80 rounded-xl shadow-md object-contain"
              />
            </div>
          )}

          {status === "loading" && (
            <div className="text-center text-zinc-600 dark:text-zinc-400 animate-pulse">
              מנתח את הרמזים הויזואליים...
            </div>
          )}

          {status === "error" && errorMessage && (
            <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950/40 dark:border-red-900/60 dark:text-red-200">
              {errorMessage}
            </div>
          )}

          {status === "done" && result && <Results result={result} />}

          <div className="text-center">
            <button
              onClick={reset}
              className="text-sm text-indigo-600 hover:underline dark:text-indigo-400"
            >
              העלה תמונה אחרת
            </button>
          </div>
        </section>
      )}
    </main>
  );
}

function Results({ result }: { result: LocateResponse }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="text-xs uppercase tracking-wider text-zinc-500">
          סיכום · ביטחון {(result.overall_confidence * 100).toFixed(0)}%
        </div>
        <div className="mt-2 text-lg">{result.summary_he}</div>
      </div>

      <div>
        <h2 className="mb-3 text-sm uppercase tracking-wider text-zinc-500">
          מועמדים
        </h2>
        <ul className="flex flex-col gap-3">
          {result.candidates.map((c, i) => (
            <li
              key={i}
              className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-baseline justify-between gap-4">
                <div className="font-medium">
                  {c.specific_location
                    ? `${c.specific_location} · ${c.region}`
                    : c.region}
                </div>
                <div className="text-sm text-zinc-500">
                  {(c.confidence * 100).toFixed(0)}%
                </div>
              </div>
              <div className="mt-1 text-xs text-zinc-500">
                {c.lat.toFixed(4)}, {c.lng.toFixed(4)}
              </div>
              <div className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
                {c.reasoning}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="mb-3 text-sm uppercase tracking-wider text-zinc-500">
          רמזים שזוהו
        </h2>
        <ul className="flex flex-col gap-2">
          {result.clues.map((cl, i) => (
            <li
              key={i}
              className="rounded-lg bg-zinc-100 px-3 py-2 text-sm dark:bg-zinc-900/60"
            >
              <span className="font-medium">{cl.observation}</span>{" "}
              <span className="text-zinc-600 dark:text-zinc-400">
                — {cl.implication}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
