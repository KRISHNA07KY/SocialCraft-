import { describe, expect, it } from "vitest";
import { AnalysisSchema } from "@/lib/analysis-schema";

const valid = { overallAssessment: "Clear post.", engagementScore: 72, strengths: ["Specific topic"], weaknesses: ["Weak ending"], hookAnalysis: "The opening is direct.", callToAction: "The CTA is easy to miss.", audienceAppeal: "Useful for creators.", readability: "Easy to scan.", suggestions: ["Make the CTA explicit."], improvedVersion: "Try this: ..." };

describe("analysis schema", () => {
  it("accepts a well-formed analysis", () => expect(AnalysisSchema.safeParse(valid).success).toBe(true));
  it("rejects scores outside the safe range", () => expect(AnalysisSchema.safeParse({ ...valid, engagementScore: 101 }).success).toBe(false));
  it("rejects missing required content", () => expect(AnalysisSchema.safeParse({ ...valid, improvedVersion: "" }).success).toBe(false));
});
