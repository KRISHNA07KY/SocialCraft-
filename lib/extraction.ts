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
    .normalize()
    .sharpen({ sigma: 1 });

  if (threshold) image = image.threshold(180);

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

  // Screenshots and logo sheets often contain many small, disconnected text
  // regions. AUTO can focus on the dominant heading and skip those regions,
  // so compare it with Tesseract's sparse-text layout mode as well.
  const sparse = pageResult((await recognize(prepared, PSM.SPARSE_TEXT)).data);
  const best = selectBetterResult(primary, sparse);

  // A second, binarized pass is useful for faint or low-contrast scans, while
  // avoiding the detail loss of thresholding on every colourful screenshot.
  if (best.confidence >= OCR_LOW_CONFIDENCE || !best.text) return best;

  const thresholded = await preprocessImage(buffer, true);
  const fallback = pageResult((await recognize(thresholded, PSM.SPARSE_TEXT)).data);
  return selectBetterResult(best, fallback);
}

export function normalizeExtractedText(value: string) {
  return value
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}



