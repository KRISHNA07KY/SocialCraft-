import { NextResponse } from "next/server";
import { extractImageText, extractPdfText } from "@/lib/extraction";
import { validateUploadedFile } from "@/lib/file-validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return errorResponse("No file was provided.", 400);
    const bytes = new Uint8Array(await file.arrayBuffer());
    const validation = validateUploadedFile(file, bytes);
    if (!validation.valid) return errorResponse(validation.message, 400);

    const buffer = Buffer.from(bytes);
    if (validation.kind === "pdf") {
      const text = await extractPdfText(buffer);
      if (!text) return errorResponse("No readable text was detected. Try a clearer document or image.", 422);
      return NextResponse.json({ text, sourceType: "PDF text" });
    }

    const extraction = await extractImageText(buffer);
    if (!extraction.text) return errorResponse("No readable text was detected. Try a clearer document or image.", 422);
    return NextResponse.json({
      text: extraction.text,
      sourceType: "OCR",
      ocrConfidence: extraction.confidence,
      ocrWarning: extraction.warning,
    });
  } catch (error) {
    console.error("Document extraction failed", error instanceof Error ? error.message : "unknown error");
    return errorResponse("We couldn't read that document. Check the file and try again.", 422);
  }
}
