export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_ANALYSIS_CHARACTERS = 12_000;
export const ACCEPTED_MIME_TYPES = ["application/pdf", "image/png", "image/jpeg"] as const;
export const ACCEPTED_EXTENSIONS = ["PDF", "PNG", "JPG", "JPEG"] as const;

export type AcceptedMimeType = (typeof ACCEPTED_MIME_TYPES)[number];
