import sharp from "sharp";
import { createWorker, OEM, PSM } from "tesseract.js";

const OCR_TARGET_WIDTH = 2_400;
const OCR_LOW_CONFIDENCE = 55;

type OcrPage = Tesseract.Page;

export type ImageExtractionResult = {
  text: string;
  confidence: number;
  warning?: string;
};

let workerPromise: Promise<Tesseract.Worker> | null = null;
let recognitionQueue = Promise.resolve();

function getOcrWorker() {
  if (!workerPromise) {
    workerPromise = createWorker("eng", OEM.LSTM_ONLY, { logger: () => undefined })
      .then(async (worker) => {
        await worker.setParameters({
          preserve_interword_spaces: "1",
          user_defined_dpi: "300",
        });
        return worker;
      });
    workerPromise.catch(() => {
      workerPromise = null;
    });
  }
  return workerPromise;
}

async function recognize(image: Buffer, pageSegmentationMode: PSM) {
  const previous = recognitionQueue;
  let release = () => {};
  recognitionQueue = new Promise<void>((resolve) => {
    release = resolve;
  });

  await previous;
  try {
    await (await getOcrWorker()).setParameters({
      tessedit_pageseg_mode: pageSegmentationMode,
    });
    return await (await getOcrWorker()).recognize(image);
  } finally {
    release();
  }
}

async function preprocessImage(buffer: Buffer, threshold = false) {
  let image = sharp(buffer)
    .rotate()
    .resize({
      width: OCR_TARGET_WIDTH,
      withoutEnlargement: false,
      kernel: sharp.kernel.lanczos3,
    })
    .grayscale()
    .linear(1.18, -12)
    .normalize()
    .sharpen({ sigma: 1.2 });

  if (threshold) image = image.threshold(175);

  return image.png({ compressionLevel: 6 }).toBuffer();
}

function pageText(page: OcrPage) {
  const lines = page.lines
    ?.map((line) => line.text.trim())
    .filter(Boolean);
  return normalizeExtractedText(lines?.length ? lines.join("\n") : page.text);
}

function pageResult(page: OcrPage): ImageExtractionResult {
  const text = pageText(page);
  const confidence = Math.round(page.confidence);
  return {
    text,
    confidence,
    ...(confidence < OCR_LOW_CONFIDENCE ? { warning: "Some text may be difficult to recognize." } : {}),
  };
}

function selectBetterResult(primary: ImageExtractionResult, fallback: ImageExtractionResult) {
  if (!primary.text) return fallback;
  if (!fallback.text) return primary;
  return fallback.confidence > primary.confidence ? fallback : primary;
}

export async function extractPdfText(buffer: Buffer) {
  const { default: pdfParse } = await import("pdf-parse");
  const result = await pdfParse(buffer);
  return normalizeExtractedText(result.text);
}

export async function extractImageText(buffer: Buffer): Promise<ImageExtractionResult> {
  const prepared = await preprocessImage(buffer);
  const primary = pageResult((await recognize(prepared, PSM.AUTO)).data);

  const sparse = pageResult((await recognize(prepared, PSM.SPARSE_TEXT)).data);
  const best = selectBetterResult(primary, sparse);

  if (best.confidence >= OCR_LOW_CONFIDENCE || !best.text) return best;

  const thresholded = await preprocessImage(buffer, true);
  const fallback = pageResult((await recognize(thresholded, PSM.SPARSE_TEXT)).data);
  return selectBetterResult(best, fallback);
}

export function normalizeExtractedText(value: string) {
  if (!value) return "";

  const lines = value
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim());

  const cleanedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Filter out standalone single-character noise symbols (+, ~, |, ®, ©, °, ^, etc.)
    if (/^[+~|°§©®*^\\/=#_]$/.test(line)) {
      continue;
    }

    // Clean stray OCR prefix artifacts e.g. "N 1. Training..." -> "1. Training...", "il For example..." -> "For example..."
    line = line.replace(/^[A-Za-z]\s+(\d+\.)/, "$1");
    line = line.replace(/^il\s+([A-Z])/, "$1");
    line = line.replace(/^[+&]\s+([A-Z])/, "$1");
    line = line.replace(/^O\s+(Steps:)/i, "$1");

    cleanedLines.push(line);
  }

  return cleanedLines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
