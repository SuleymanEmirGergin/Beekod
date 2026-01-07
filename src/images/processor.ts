import sharp from "sharp";
import { ImageFormat, ImageProfile } from "./imageProfiles.js";

function outputExt(format: ImageFormat | undefined) {
  if (format === "png") return ".png";
  if (format === "webp") return ".webp";
  return ".jpg";
}

function clampNumber(value: number | undefined, fallback: number, minValue: number, maxValue: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return Math.max(minValue, Math.min(maxValue, value));
}

function estimateBackgroundColor(data: Buffer, width: number, height: number, channels: number) {
  const sampleSize = Math.max(1, Math.round(Math.min(width, height) * 0.05));
  const corners = [
    { x: 0, y: 0 },
    { x: width - sampleSize, y: 0 },
    { x: 0, y: height - sampleSize },
    { x: width - sampleSize, y: height - sampleSize },
  ];
  let r = 0,
    g = 0,
    b = 0,
    count = 0;
  for (const corner of corners) {
    for (let y = 0; y < sampleSize; y++) {
      for (let x = 0; x < sampleSize; x++) {
        const px = Math.min(width - 1, Math.max(0, corner.x + x));
        const py = Math.min(height - 1, Math.max(0, corner.y + y));
        const idx = (py * width + px) * channels;
        r += data[idx];
        g += data[idx + 1];
        b += data[idx + 2];
        count++;
      }
    }
  }
  if (!count) return { r: 255, g: 255, b: 255 };
  return { r: Math.round(r / count), g: Math.round(g / count), b: Math.round(b / count) };
}

async function buildSubjectMaskAlpha(buffer: Buffer, options: { threshold: number; minFill: number }) {
  const { data, info } = await sharp(buffer)
    .rotate()
    .resize({ width: 256, height: 256, fit: "inside" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const background = estimateBackgroundColor(data, width, height, channels);
  const mask = Buffer.alloc(width * height);
  let foreground = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const r = data[idx],
        g = data[idx + 1],
        b = data[idx + 2],
        a = data[idx + 3];
      if (a <= 5) {
        mask[y * width + x] = 0;
        continue;
      }
      const dist = Math.sqrt(
        Math.pow(r - background.r, 2) + Math.pow(g - background.g, 2) + Math.pow(b - background.b, 2),
      );
      if (dist >= options.threshold) {
        mask[y * width + x] = 255;
        foreground++;
      } else {
        mask[y * width + x] = 0;
      }
    }
  }
  if (foreground < width * height * options.minFill) mask.fill(255);
  return { mask, width, height };
}

function resolveQuality(profile: ImageProfile, format: ImageFormat, width?: number, height?: number) {
  const fallback = format === "webp" ? 80 : 85;
  if (profile.autoQuality !== true) return Math.max(1, Math.min(100, Math.round(profile.quality ?? fallback)));

  const pixels = width && height ? width * height : 0;
  let quality = fallback;
  if (pixels > 6000000) quality -= 16;
  else if (pixels > 3000000) quality -= 12;
  else if (pixels > 2000000) quality -= 8;
  else if (pixels > 1200000) quality -= 4;
  else if (pixels > 0 && pixels < 600000) quality += 4;

  const minQ = clampNumber(profile.qualityMin, format === "webp" ? 55 : 60, 1, 100);
  const maxQ = clampNumber(profile.qualityMax, format === "webp" ? 90 : 92, 1, 100);
  return Math.round(Math.min(Math.max(minQ, maxQ), Math.max(Math.min(minQ, maxQ), quality)));
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildWatermarkSvg(width: number, height: number, watermark: ImageProfile["watermark"]) {
  if (!watermark || !watermark.text) return null;
  const text = escapeXml(watermark.text);
  const opacity = typeof watermark.opacity === "number" ? Math.max(0, Math.min(1, watermark.opacity)) : 0.35;
  const padding = typeof watermark.padding === "number" ? Math.max(0, watermark.padding) : 24;
  const position = watermark.position ?? "bottom-right";
  const fontSize = Math.max(12, Math.round(Math.min(width, height) * 0.04));
  let x = padding,
    y = padding + fontSize,
    anchor = "start",
    baseline = "alphabetic";

  if (position === "top-right") {
    x = width - padding;
    anchor = "end";
  } else if (position === "bottom-left") {
    y = height - padding;
  } else if (position === "bottom-right") {
    x = width - padding;
    y = height - padding;
    anchor = "end";
  } else if (position === "center") {
    x = width / 2;
    y = height / 2;
    anchor = "middle";
    baseline = "middle";
  }

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <text x="${x}" y="${y}" fill="#ffffff" fill-opacity="${opacity}" font-size="${fontSize}" font-family="sans-serif" text-anchor="${anchor}" dominant-baseline="${baseline}">${text}</text>
  </svg>`;
}

export async function buildProcessedBuffer(buffer: Buffer, profile: ImageProfile) {
  let base = sharp(buffer).rotate();
  const meta = await base.metadata();
  const subjectMaskEnabled = profile.subjectMask === true;

  if (subjectMaskEnabled && meta.width && meta.height) {
    const { mask, width, height } = await buildSubjectMaskAlpha(buffer, {
      threshold: clampNumber(profile.subjectMaskThreshold, 28, 5, 150),
      minFill: 0.01,
    });
    let maskPipeline = sharp(mask, { raw: { width, height, channels: 1 } }).resize(meta.width, meta.height, {
      fit: "fill",
    });
    const feather = clampNumber(profile.subjectMaskFeather, 2, 0, 20);
    if (feather > 0) maskPipeline = maskPipeline.blur(feather);
    const maskFull = await maskPipeline.toBuffer();
    base = base.removeAlpha().joinChannel(maskFull, { raw: { width: meta.width, height: meta.height, channels: 1 } });
  }

  const resize: sharp.ResizeOptions = {};
  if (profile.width) resize.width = Math.round(profile.width);
  if (profile.height) resize.height = Math.round(profile.height);
  if (resize.width || resize.height) {
    resize.fit = profile.fit === "cover" ? "cover" : "contain";
    if (resize.fit === "contain")
      resize.background =
        profile.background ?? (profile.format === "png" || profile.format === "webp" ? "#00000000" : "#ffffff");
    if (profile.position) resize.position = profile.position;
  }

  let pipeline = resize.width || resize.height ? base.resize(resize) : base;
  let tW = resize.width || meta.width || 0,
    tH = resize.height || meta.height || 0;

  if (profile.watermark?.text && tW && tH) {
    const svg = buildWatermarkSvg(tW, tH, profile.watermark);
    if (svg) pipeline = pipeline.composite([{ input: Buffer.from(svg), top: 0, left: 0 }]);
  }

  const format = profile.format ?? "jpg";
  const quality = resolveQuality(profile, format, tW, tH);
  let p = pipeline.clone();
  if (format === "jpg" && (subjectMaskEnabled || meta.hasAlpha)) {
    p = p.flatten({ background: profile.background ?? "#ffffff" });
  }

  const out = format === "png" ? p.png({ quality }) : format === "webp" ? p.webp({ quality }) : p.jpeg({ quality });
  const finalBuffer = await out.toBuffer();
  const finalMeta = await sharp(finalBuffer).metadata();

  return { outputBuffer: finalBuffer, outputMeta: finalMeta, outputFormat: format, outputExt: outputExt(format) };
}
