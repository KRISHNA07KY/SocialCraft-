import { AnalysisSchema, type Analysis } from "./analysis-schema";
import { MAX_ANALYSIS_CHARACTERS } from "./config";

const DEFAULT_MODEL = "openai/gpt-oss-120b";

function promptFor(text: string) {
  return `Analyze only the supplied social-media content as a thoughtful, practical editor. Do not promise or imply guaranteed performance. Keep each field concise enough for a web UI. Return ONLY valid JSON matching this exact shape: {"overallAssessment":"string","engagementScore":number,"strengths":["string"],"weaknesses":["string"],"hookAnalysis":"string","callToAction":"string","audienceAppeal":"string","readability":"string","suggestions":["string"],"improvedVersion":"string"}. engagementScore must be an integer from 1 to 100. Include 2-4 strengths, weaknesses, and suggestions.

CONTENT TO ANALYZE:
${text.slice(0, MAX_ANALYSIS_CHARACTERS)}`;
}

function responseText(payload: unknown) {
  const candidate = (payload as { choices?: Array<{ message?: { content?: string | null } }> }).choices?.[0];
  return candidate?.message?.content?.trim() || "";
}

function parseJson(value: string): unknown {
  const cleaned = value.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  return JSON.parse(cleaned);
}

export async function analyzeWithGroq(text: string): Promise<Analysis> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_NOT_CONFIGURED");

  const model = process.env.GROQ_MODEL || DEFAULT_MODEL;
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: "You are a precise social media editor. Follow the requested JSON contract exactly." },
        { role: "user", content: promptFor(text) },
      ],
      temperature: 0.2,
      max_tokens: 1800,
      response_format: { type: "json_object" },
    }),
    cache: "no-store",
  });

  if (!response.ok) throw new Error(response.status === 429 ? "GROQ_RATE_LIMITED" : "GROQ_REQUEST_FAILED");
  const payload: unknown = await response.json();
  const textResponse = responseText(payload);
  if (!textResponse) throw new Error("GROQ_EMPTY_RESPONSE");

  let parsed: unknown;
  try {
    parsed = parseJson(textResponse);
  } catch {
    throw new Error("GROQ_INVALID_RESPONSE");
  }

  const result = AnalysisSchema.safeParse(parsed);
  if (!result.success) throw new Error("GROQ_INVALID_RESPONSE");
  return result.data;
}
