import fs from "fs/promises";
import vision from "@google-cloud/vision";

export type OcrResult = {
  text: string;
  raw?: unknown;
};

export type WebDetectionResult = {
  bestGuessLabels: string[];
  fullMatchingImages: string[];
  partialMatchingImages: string[];
  pagesWithMatchingImages: Array<{ url: string; pageTitle: string; partialMatchingImages: string[] }>;
  visuallySimilarImages: string[];
  raw?: unknown;
};

export type LabelDetectionResult = {
  labels: Array<{ description: string; score: number }>;
  raw?: unknown;
};

export type VisionInput = {
  filePath?: string;
  buffer?: Buffer;
  languageHints?: string[];
  features?: Array<"TEXT_DETECTION" | "WEB_DETECTION" | "LABEL_DETECTION">;
};

let cachedClient: vision.ImageAnnotatorClient | null = null;

function getClient() {
  if (!cachedClient) {
    const options: any = {};
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      // Try fallback keys
      const visionKey = (process.env.GOOGLE_VISION_API_KEY ?? "").trim();
      const cseKey = (process.env.GOOGLE_CSE_API_KEY ?? "").trim();
      const apiKey = visionKey || cseKey;
      if (apiKey) {
        options.apiKey = apiKey;
      }
    }
    cachedClient = new vision.ImageAnnotatorClient(options);
  }
  return cachedClient;
}

export async function analyzeImage(input: VisionInput): Promise<{
  text?: OcrResult;
  web?: WebDetectionResult;
  labels?: LabelDetectionResult;
}> {
  const { filePath, buffer, languageHints } = input;
  const features = input.features || ["TEXT_DETECTION"];

  if (!filePath && !buffer) {
    throw new Error("analyzeImage requires filePath or buffer");
  }

  const content = buffer ?? (filePath ? await fs.readFile(filePath) : undefined);
  if (!content) {
    throw new Error("analyzeImage requires filePath or buffer");
  }

  const featureConfigs = features.map((type) => ({ type }));

  const request = {
    image: { content },
    features: featureConfigs,
    imageContext: languageHints?.length ? { languageHints } : undefined,
  };

  const [response] = await getClient().annotateImage(request);

  const result: any = {};

  if (features.includes("TEXT_DETECTION")) {
    result.text = {
      text: response.fullTextAnnotation?.text?.trim() ?? "",
      raw: response.fullTextAnnotation ?? response.textAnnotations,
    };
  }

  if (features.includes("WEB_DETECTION") && response.webDetection) {
    const web = response.webDetection;
    result.web = {
      bestGuessLabels: web.bestGuessLabels?.map((l) => l.label || "").filter(Boolean) || [],
      fullMatchingImages: web.fullMatchingImages?.map((i) => i.url || "").filter(Boolean) || [],
      partialMatchingImages: web.partialMatchingImages?.map((i) => i.url || "").filter(Boolean) || [],
      pagesWithMatchingImages:
        web.pagesWithMatchingImages?.map((p) => ({
          url: p.url || "",
          pageTitle: p.pageTitle || "",
          partialMatchingImages: p.partialMatchingImages?.map((i) => i.url || "").filter(Boolean) || [],
        })) || [],
      visuallySimilarImages: web.visuallySimilarImages?.map((i) => i.url || "").filter(Boolean) || [],
      raw: web,
    };
  }

  if (features.includes("LABEL_DETECTION") && response.labelAnnotations) {
    result.labels = {
      labels: response.labelAnnotations.map((l) => ({
        description: l.description || "",
        score: l.score || 0,
      })),
      raw: response.labelAnnotations,
    };
  }

  return result;
}

// Legacy wrapper to maintain backward compatibility if needed,
// though we should migrate calls to use analyzeImage directly.
export async function googleVisionOcr(input: {
  filePath?: string;
  buffer?: Buffer;
  languageHints?: string[];
}): Promise<OcrResult> {
  const res = await analyzeImage({ ...input, features: ["TEXT_DETECTION"] });
  return res.text!;
}

export async function googleVisionOcrFromFile(filePath: string, languageHints?: string[]) {
  return googleVisionOcr({ filePath, languageHints });
}

export async function googleVisionOcrFromBuffer(buffer: Buffer, languageHints?: string[]) {
  return googleVisionOcr({ buffer, languageHints });
}
