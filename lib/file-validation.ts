import { ACCEPTED_MIME_TYPES, MAX_FILE_SIZE_BYTES, type AcceptedMimeType } from "./config";

export type FileKind = "pdf" | "image";

export type FileValidationResult =
  | { valid: true; kind: FileKind; mimeType: AcceptedMimeType }
  | { valid: false; message: string };

function hasBytes(bytes: Uint8Array, expected: number[]) {
  return expected.every((value, index) => bytes[index] === value);
}

export function detectFileKind(bytes: Uint8Array): FileKind | null {
  if (bytes.length >= 5 && new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-") return "pdf";
  if (hasBytes(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image";
  if (hasBytes(bytes, [0xff, 0xd8, 0xff])) return "image";
  return null;
}

export function validateFileMetadata(file: Pick<File, "name" | "size" | "type">) {
  if (!file.name.trim()) return { valid: false as const, message: "Please choose a file." };
  if (file.size === 0) return { valid: false as const, message: "That file is empty. Choose a file with readable content." };
  if (file.size > MAX_FILE_SIZE_BYTES) return { valid: false as const, message: "Files must be 10 MB or smaller." };
  if (!ACCEPTED_MIME_TYPES.includes(file.type as AcceptedMimeType)) {
    return { valid: false as const, message: "Unsupported file type. Upload a PDF, PNG, JPG, or JPEG." };
  }
  return { valid: true as const };
}

export function validateUploadedFile(file: { name: string; size: number; type: string }, bytes: Uint8Array): FileValidationResult {
  const metadata = validateFileMetadata(file);
  if (!metadata.valid) return metadata;
  const kind = detectFileKind(bytes);
  if (!kind) return { valid: false, message: "The file contents do not match a supported PDF or image." };
  if (kind === "pdf" && file.type !== "application/pdf") return { valid: false, message: "This file appears to be a PDF. Please upload it with a .pdf extension." };
  if (kind === "image" && file.type === "application/pdf") return { valid: false, message: "This file is not a readable PDF." };
  return { valid: true, kind, mimeType: file.type as AcceptedMimeType };
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
