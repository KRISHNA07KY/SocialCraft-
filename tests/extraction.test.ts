import { describe, expect, it } from "vitest";
import { normalizeExtractedText } from "@/lib/extraction";

describe("OCR text normalization", () => {
  it("keeps useful line structure while cleaning whitespace", () => {
    expect(normalizeExtractedText("  Our   Collaborators  \r\n\r\n  Printed logos   here  \n\n\nNext line ")).toBe(
      "Our Collaborators\n\nPrinted logos here\n\nNext line"
    );
  });

  it("cleans stray single-character OCR noise symbols and prefix artifacts", () => {
    expect(normalizeExtractedText("How Models Learn & Predict\n+\nO Steps:\nN 1. Training...\nil For example...")).toBe(
      "How Models Learn & Predict\nSteps:\n1. Training...\nFor example..."
    );
  });

  it("does not invent text when the OCR result is empty", () => {
    expect(normalizeExtractedText(" \n\t\n ")).toBe("");
  });
});
