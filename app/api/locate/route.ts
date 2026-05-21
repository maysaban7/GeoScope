import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { locateImage, type SupportedMediaType } from "@/lib/anthropic";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES: SupportedMediaType[] = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "expected multipart/form-data with an `image` field" },
      { status: 400 },
    );
  }

  const file = form.get("image");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "missing `image` file field" },
      { status: 400 },
    );
  }

  if (!ALLOWED_TYPES.includes(file.type as SupportedMediaType)) {
    return NextResponse.json(
      {
        error: `unsupported media type: ${file.type || "unknown"}. supported: ${ALLOWED_TYPES.join(", ")}`,
      },
      { status: 415 },
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `image too large (max ${MAX_BYTES / 1024 / 1024} MB)` },
      { status: 413 },
    );
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const base64 = buf.toString("base64");

  try {
    const result = await locateImage(base64, file.type as SupportedMediaType);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        {
          error: "model output failed schema validation",
          details: err.issues,
        },
        { status: 502 },
      );
    }
    const message = err instanceof Error ? err.message : "unknown error";
    console.error("locate route error:", err);
    return NextResponse.json(
      { error: `failed to analyze image: ${message}` },
      { status: 500 },
    );
  }
}
