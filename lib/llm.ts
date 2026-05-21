import type { LocateResponse } from "./schema";
import type { SupportedMediaType } from "./types";
import { locateWithGemini } from "./gemini";
import { locateWithClaude } from "./anthropic";

export type Provider = "gemini" | "claude";

export function resolveProvider(): Provider {
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.ANTHROPIC_API_KEY) return "claude";
  throw new Error(
    "No vision API key configured (set GEMINI_API_KEY or ANTHROPIC_API_KEY)",
  );
}

export async function locateImage(
  base64: string,
  mediaType: SupportedMediaType,
): Promise<{ result: LocateResponse; provider: Provider }> {
  const provider = resolveProvider();
  const result =
    provider === "gemini"
      ? await locateWithGemini(base64, mediaType)
      : await locateWithClaude(base64, mediaType);
  return { result, provider };
}
