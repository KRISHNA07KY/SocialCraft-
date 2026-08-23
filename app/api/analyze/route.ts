import { NextResponse } from "next/server";
import { analyzeWithGroq } from "@/lib/groq";
import { MAX_ANALYSIS_CHARACTERS } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { text?: unknown };
    if (typeof body.text !== "string" || !body.text.trim()) {
      return NextResponse.json({ error: "There is no extracted text to analyze." }, { status: 400 });
    }
    if (body.text.length > MAX_ANALYSIS_CHARACTERS) {
      return NextResponse.json({ error: "The extracted content is too long to analyze at once." }, { status: 413 });
    }
    const analysis = await analyzeWithGroq(body.text);
    return NextResponse.json({ analysis });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    if (code === "GROQ_NOT_CONFIGURED") return NextResponse.json({ error: "AI analysis is not configured yet. Add GROQ_API_KEY to your environment." }, { status: 503 });
    if (code === "GROQ_RATE_LIMITED") return NextResponse.json({ error: "The AI service is temporarily rate-limited. Please wait a moment and try again." }, { status: 429 });
    if (code === "GROQ_INVALID_RESPONSE" || code === "GROQ_EMPTY_RESPONSE") return NextResponse.json({ error: "The AI returned an unexpected response. Please try again." }, { status: 502 });
    console.error("AI analysis failed", code);
    return NextResponse.json({ error: "AI analysis is temporarily unavailable. Please try again." }, { status: 502 });
  }
}
