import { z } from "zod";

const nonEmptyString = z.string().trim().min(1);

export const AnalysisSchema = z.object({
  overallAssessment: nonEmptyString,
  engagementScore: z.number().int().min(1).max(100),
  strengths: z.array(nonEmptyString).min(1).max(6),
  weaknesses: z.array(nonEmptyString).min(1).max(6),
  hookAnalysis: nonEmptyString,
  callToAction: nonEmptyString,
  audienceAppeal: nonEmptyString,
  readability: nonEmptyString,
  suggestions: z.array(nonEmptyString).min(1).max(8),
  improvedVersion: nonEmptyString
});

export type Analysis = z.infer<typeof AnalysisSchema>;
