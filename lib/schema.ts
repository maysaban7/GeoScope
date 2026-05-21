import { z } from "zod";

export const ClueSchema = z.object({
  observation: z.string().min(1),
  implication: z.string().min(1),
});

export const CandidateSchema = z.object({
  region: z.string().min(1),
  specific_location: z.string().optional(),
  lat: z.number().min(29.5).max(33.4),
  lng: z.number().min(34.2).max(35.95),
  confidence: z.number().min(0).max(1),
  reasoning: z.string().min(1),
});

export const LocateResponseSchema = z.object({
  clues: z.array(ClueSchema).min(1).max(10),
  candidates: z.array(CandidateSchema).min(1).max(3),
  summary_he: z.string().min(1),
  overall_confidence: z.number().min(0).max(1),
});

export type Clue = z.infer<typeof ClueSchema>;
export type Candidate = z.infer<typeof CandidateSchema>;
export type LocateResponse = z.infer<typeof LocateResponseSchema>;
