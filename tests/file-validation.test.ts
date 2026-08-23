import { describe, expect, it } from "vitest";
import { detectFileKind, validateFileMetadata, validateUploadedFile } from "@/lib/file-validation";

const pdfBytes = new TextEncoder().encode("%PDF-1.7");
const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

describe("file validation", () => {
  it("detects PDF and image signatures", () => {
    expect(detectFileKind(pdfBytes)).toBe("pdf");
    expect(detectFileKind(pngBytes)).toBe("image");
    expect(detectFileKind(new Uint8Array([1, 2, 3]))).toBeNull();
  });

  it("accepts supported metadata and rejects unsupported formats", () => {
    expect(validateFileMetadata({ name: "post.pdf", size: 100, type: "application/pdf" }).valid).toBe(true);
    const result = validateFileMetadata({ name: "post.docx", size: 100, type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
    expect(result).toEqual({ valid: false, message: "Unsupported file type. Upload a PDF, PNG, JPG, or JPEG." });
  });

  it("validates content signatures rather than trusting MIME alone", () => {
    expect(validateUploadedFile({ name: "post.pdf", size: pdfBytes.length, type: "application/pdf" }, pdfBytes).valid).toBe(true);
    expect(validateUploadedFile({ name: "post.png", size: pngBytes.length, type: "image/png" }, new Uint8Array([0, 1])).valid).toBe(false);
  });
});
