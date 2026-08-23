import { describe, expect, it } from "vitest";
import { normalizeEditorialText } from "@/components/AnalysisResults";

describe("editorial presentation cleanup", () => {
  it("removes decorative emojis while preserving the draft text", () => {
    expect(normalizeEditorialText("🤖 How models learn\n\n1️⃣Build a dataset\n💡Test the result")).toBe("How models learn\n\nBuild a dataset\nTest the result");
  });
});

