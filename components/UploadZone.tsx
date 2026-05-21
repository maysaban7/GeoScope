"use client";

import { useCallback, useRef, useState } from "react";

type Props = {
  onFile: (file: File) => void;
  disabled?: boolean;
};

export function UploadZone({ onFile, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const pickFile = useCallback(() => {
    if (disabled) return;
    inputRef.current?.click();
  }, [disabled]);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0 || disabled) return;
      const file = files[0];
      if (!file.type.startsWith("image/")) return;
      onFile(file);
    },
    [onFile, disabled],
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={pickFile}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          pickFile();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={[
        "w-full max-w-xl mx-auto rounded-2xl border-2 border-dashed",
        "px-8 py-12 text-center cursor-pointer select-none transition-colors",
        disabled
          ? "opacity-50 cursor-not-allowed border-zinc-300 dark:border-zinc-700"
          : dragOver
            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30"
            : "border-zinc-300 hover:border-indigo-400 dark:border-zinc-700 dark:hover:border-indigo-500",
      ].join(" ")}
    >
      <div className="text-5xl mb-3" aria-hidden>
        📷
      </div>
      <div className="text-lg font-medium">
        גרור תמונה לכאן או לחץ לבחירה
      </div>
      <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        JPEG · PNG · WebP · עד 10MB
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
        disabled={disabled}
      />
    </div>
  );
}
