"use client";

import { useEffect, useState } from "react";
import { UploadZone } from "@/components/UploadZone";
import { ResultMap } from "@/components/ResultMap";
import type { LocateResponse } from "@/lib/schema";

type Status = "idle" | "loading" | "done" | "error";

const EXAMPLES: { label: string; src: string; resultSrc: string }[] = [
  { label: "מכתש רמון · נגב", src: "/examples/negev.jpg", resultSrc: "/examples/results/negev.json" },
  { label: "יפו · גוש דן", src: "/examples/jaffa.jpg", resultSrc: "/examples/results/jaffa.json" },
  { label: "חיפה", src: "/examples/haifa.jpg", resultSrc: "/examples/results/haifa.json" },
  { label: "הכנרת · גליל", src: "/examples/kinneret.jpg", resultSrc: "/examples/results/kinneret.json" },
  { label: "רמת הגולן", src: "/examples/golan.jpg", resultSrc: "/examples/results/golan.json" },
  { label: "תל אביב", src: "/examples/telaviv.jpg", resultSrc: "/examples/results/telaviv.json" },
];

function encodeResult(r: LocateResponse): string {
  return btoa(encodeURIComponent(JSON.stringify(r)));
}

function decodeResult(s: string): LocateResponse | null {
  try {
    return JSON.parse(decodeURIComponent(atob(s))) as LocateResponse;
  } catch {
    return null;
  }
}

export default function Home() {
  const [status, setStatus] = useState<Status>("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<LocateResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // on mount — decode result from URL hash if present
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const params = new URLSearchParams(hash);
    const encoded = params.get("r");
    if (!encoded) return;
    const decoded = decodeResult(encoded);
    if (decoded) {
      setResult(decoded);
      setStatus("done");
    }
  }, []);

  async function handleFile(file: File) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setStatus("loading");
    setResult(null);
    setErrorMessage(null);
    window.location.hash = "";

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
      window.location.hash = `r=${encodeResult(data)}`;
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "שגיאה לא ידועה");
      setStatus("error");
    }
  }

  async function handleExampleClick(src: string, resultSrc: string) {
    setPreviewUrl(src);
    setStatus("loading");
    setResult(null);
    setErrorMessage(null);
    window.location.hash = "";
    // load pre-baked result — no API call needed
    try {
      const res = await fetch(resultSrc);
      const data = (await res.json()) as LocateResponse;
      setResult(data);
      setStatus("done");
      window.location.hash = `r=${encodeResult(data)}`;
    } catch {
      setErrorMessage("שגיאה בטעינת הדגמה");
      setStatus("error");
    }
  }

  async function copyShareUrl() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function reset() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setResult(null);
    setErrorMessage(null);
    setStatus("idle");
    window.location.hash = "";
  }

  return (
    <div className="flex flex-col flex-1 w-full">
      {/* header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
        <button
          onClick={reset}
          className="text-2xl font-bold tracking-tight hover:opacity-70 transition-opacity"
        >
          GeoScope
        </button>
        <span className="text-xs text-zinc-400 hidden sm:block">
          AI · VISINT · ישראל
        </span>
      </header>

      <main className="flex flex-col flex-1 w-full max-w-5xl mx-auto px-4 py-8 gap-8">
        {/* idle — upload + gallery */}
        {status === "idle" && (
          <>
            <div className="text-center">
              <p className="text-zinc-500 dark:text-zinc-400">
                העלה תמונה שצולמה בישראל — Claude Vision ינתח את הרמזים הויזואליים
                וישער איפה היא צולמה.
              </p>
            </div>

            <UploadZone onFile={handleFile} />

            {EXAMPLES.length > 0 && (
              <section>
                <h2 className="text-sm text-center text-zinc-400 mb-4">
                  או נסה אחת מהדוגמאות
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {EXAMPLES.map((ex) => (
                    <button
                      key={ex.src}
                      onClick={() => handleExampleClick(ex.src, ex.resultSrc)}
                      className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 hover:border-indigo-400 transition-colors"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={ex.src}
                        alt={ex.label}
                        className="w-full h-28 object-cover"
                      />
                      <div className="px-3 py-2 text-sm font-medium text-right">
                        {ex.label}
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* active — loading / done / error */}
        {status !== "idle" && (
          <div className="flex flex-col gap-6">
            {/* image preview strip */}
            {previewUrl && (
              <div className="flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="התמונה שהועלתה"
                  className="max-h-64 rounded-xl shadow object-contain"
                />
              </div>
            )}

            {/* loading */}
            {status === "loading" && (
              <div className="flex flex-col items-center gap-3 py-8">
                <div className="w-8 h-8 rounded-full border-4 border-indigo-400 border-t-transparent animate-spin" />
                <p className="text-zinc-500 text-sm">
                  מנתח רמזים ויזואליים…
                </p>
              </div>
            )}

            {/* error */}
            {status === "error" && errorMessage && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950/30 dark:border-red-900/40 dark:text-red-200">
                {errorMessage}
              </div>
            )}

            {/* results */}
            {status === "done" && result && (
              <>
                {/* summary bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="flex-1">
                    <div className="text-xs text-zinc-400 mb-1">
                      ביטחון כללי:{" "}
                      <span className="font-semibold text-zinc-700 dark:text-zinc-200">
                        {(result.overall_confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="text-base leading-relaxed">
                      {result.summary_he}
                    </div>
                  </div>
                  <button
                    onClick={copyShareUrl}
                    className="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-300 dark:hover:bg-indigo-900/60 transition-colors"
                  >
                    {copied ? "✓ הועתק!" : "🔗 שתף תוצאה"}
                  </button>
                </div>

                {/* map + panel */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  <div className="lg:col-span-3">
                    <ResultMap candidates={result.candidates} />
                  </div>
                  <div className="lg:col-span-2 flex flex-col gap-4">
                    {/* candidates */}
                    <div>
                      <h2 className="text-xs uppercase tracking-wider text-zinc-400 mb-2">
                        מועמדים
                      </h2>
                      <ul className="flex flex-col gap-2">
                        {result.candidates.map((c, i) => (
                          <li
                            key={i}
                            className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                          >
                            <div className="flex items-baseline justify-between">
                              <span className="font-medium text-sm">
                                {c.specific_location
                                  ? `${c.specific_location} · ${c.region}`
                                  : c.region}
                              </span>
                              <ConfidencePill value={c.confidence} />
                            </div>
                            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                              {c.reasoning}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* clues */}
                    <div>
                      <h2 className="text-xs uppercase tracking-wider text-zinc-400 mb-2">
                        רמזים שזוהו
                      </h2>
                      <ul className="flex flex-col gap-1.5">
                        {result.clues.map((cl, i) => (
                          <li
                            key={i}
                            className="rounded-lg bg-zinc-50 px-3 py-2 text-xs dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800"
                          >
                            <span className="font-medium">{cl.observation}</span>{" "}
                            <span className="text-zinc-500">
                              — {cl.implication}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="text-center">
              <button
                onClick={reset}
                className="text-sm text-indigo-600 hover:underline dark:text-indigo-400"
              >
                ← העלה תמונה אחרת
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-800 px-6 py-3 text-xs text-zinc-400 text-center">
        GeoScope · מבוסס Claude Vision · נבנה ע״י מאי סבן
      </footer>
    </div>
  );
}

function ConfidencePill({ value }: { value: number }) {
  const pct = (value * 100).toFixed(0) + "%";
  const cls =
    value >= 0.65
      ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
      : value >= 0.4
        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300"
        : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300";
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>
      {pct}
    </span>
  );
}
