import { GoogleGenAI } from "@google/genai";
import { LocateResponseSchema, type LocateResponse } from "./schema";
import { SYSTEM_PROMPT } from "./prompts";
import type { SupportedMediaType } from "./types";

const MODEL = "gemini-2.5-flash";

let client: GoogleGenAI | null = null;
function getClient(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

export async function locateWithGemini(
  base64: string,
  mediaType: SupportedMediaType,
): Promise<LocateResponse> {
  const ai = getClient();

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType: mediaType, data: base64 } },
          {
            text: "נתח את התמונה והחזר JSON תקין בלבד לפי הסכמה במערכת.",
          },
        ],
      },
    ],
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      temperature: 0.3,
    },
  });

  const text = response.text;
  if (!text) throw new Error("Empty response from Gemini");

  const parsed = JSON.parse(text);
  return LocateResponseSchema.parse(parsed);
}
