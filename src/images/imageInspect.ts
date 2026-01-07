import sharp from "sharp";
import { ImageProfile, ImageFormat } from "./imageProfiles.js";

export type InspectCheck = {
  id: string;
  label: string;
  ok: boolean;
  expected?: string;
  actual?: string;
  severity: "warn" | "fail";
  detail?: string;
  detailTr?: string;
  hint?: string;
  hintTr?: string;
};

type InspectBackground = {
  r: number;
  g: number;
  b: number;
  hex: string;
  distance: number;
};

export type InspectReport = {
  ok: boolean;
  width?: number;
  height?: number;
  format?: string;
  sizeBytes: number;
  sizeKb: number;
  aspectRatio?: number;
  background: InspectBackground;
  profile: string | null;
  marketplace: string | null;
  checks: InspectCheck[];
  score: number;
  warnings: string[];
  issues: string[];
  hints: string[];
  hintsTr: string[];
  failChecks: InspectCheck[];
  warningChecks: InspectCheck[];
  failCount: number;
  warnCount: number;
  summaryEn: string;
  summaryTr: string;
};

function normalizeFormat(format?: string | null): ImageFormat | undefined {
  if (!format) {
    return undefined;
  }
  const lower = format.toLowerCase();
  if (lower === "jpeg") {
    return "jpg";
  }
  if (lower === "jpg" || lower === "png" || lower === "webp") {
    return lower as ImageFormat;
  }
  return undefined;
}

function formatHex(value: number) {
  return value.toString(16).padStart(2, "0");
}

function toHex(r: number, g: number, b: number) {
  return `#${formatHex(r)}${formatHex(g)}${formatHex(b)}`;
}

function parseHexColor(value?: string | null) {
  if (!value) {
    return null;
  }
  const normalized = value.trim().toLowerCase();
  const match = normalized.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!match) {
    return null;
  }
  const hex = match[1];
  if (hex.length === 3) {
    const r = parseInt(hex[0] + hex[0], 16);
    const g = parseInt(hex[1] + hex[1], 16);
    const b = parseInt(hex[2] + hex[2], 16);
    return { r, g, b };
  }
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return { r, g, b };
}

function colorDistance(a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }) {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

async function estimateBackground(buffer: Buffer): Promise<InspectBackground> {
  const { data, info } = await sharp(buffer)
    .rotate()
    .resize({ width: 256, height: 256, fit: "inside" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  const channels = info.channels;
  const sampleSize = Math.max(1, Math.round(Math.min(width, height) * 0.05));
  const corners = [
    { x: 0, y: 0 },
    { x: width - sampleSize, y: 0 },
    { x: 0, y: height - sampleSize },
    { x: width - sampleSize, y: height - sampleSize },
  ];

  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;

  for (const corner of corners) {
    for (let y = 0; y < sampleSize; y += 1) {
      for (let x = 0; x < sampleSize; x += 1) {
        const px = Math.min(width - 1, Math.max(0, corner.x + x));
        const py = Math.min(height - 1, Math.max(0, corner.y + y));
        const idx = (py * width + px) * channels;
        r += data[idx];
        g += data[idx + 1];
        b += data[idx + 2];
        count += 1;
      }
    }
  }

  if (!count) {
    const fallback = { r: 255, g: 255, b: 255 };
    return { ...fallback, hex: "#ffffff", distance: 0 };
  }

  const avg = {
    r: Math.round(r / count),
    g: Math.round(g / count),
    b: Math.round(b / count),
  };
  const distance = colorDistance(avg, { r: 255, g: 255, b: 255 });

  return {
    ...avg,
    hex: toHex(avg.r, avg.g, avg.b),
    distance,
  };
}

function getFormatCandidates(profile?: ImageProfile | null): ImageFormat[] | null {
  if (!profile) {
    return null;
  }
  const base = profile.format ?? "jpg";
  if (profile.autoFormat !== true) {
    return [base];
  }
  if (base === "png") {
    return ["png"];
  }
  if (base === "webp") {
    return ["webp", "jpg"];
  }
  return ["jpg", "webp"];
}

function getMarketplaceRules(marketplace?: string | null) {
  if (!marketplace) {
    return null;
  }
  const normalized = marketplace.toLowerCase();
  if (normalized.includes("trendyol")) {
    return {
      minWidth: 1200,
      minHeight: 1200,
      ratio: 1,
      formats: ["jpg"],
      background: "#ffffff",
    };
  }
  if (normalized.includes("hepsiburada")) {
    return {
      minWidth: 1200,
      minHeight: 1200,
      ratio: 1,
      formats: ["jpg"],
      background: "#ffffff",
    };
  }
  if (normalized.includes("instagram")) {
    return {
      minWidth: 1080,
      minHeight: 1080,
      ratio: 1,
      formats: ["jpg", "png"],
      background: null,
    };
  }
  return null;
}

export async function inspectImageBuffer(
  buffer: Buffer,
  options: { profile?: ImageProfile | null; marketplace?: string | null; maxBytes?: number },
): Promise<InspectReport> {
  const meta = await sharp(buffer).metadata();
  const width = meta.width;
  const height = meta.height;
  const sizeBytes = buffer.length;
  const sizeKb = Math.round(sizeBytes / 1024);
  const format = normalizeFormat(meta.format ?? undefined);
  const aspectRatio = width && height ? Number((width / height).toFixed(4)) : undefined;
  const background = await estimateBackground(buffer);

  const profile = options.profile ?? null;
  const marketplace = options.marketplace?.trim() || null;
  const checks: InspectCheck[] = [];
  const strictMode = profile?.strict === true;

  function enrichCheck(check: InspectCheck) {
    let detail: string | undefined;
    let detailTr: string | undefined;
    let hint: string | undefined;
    let hintTr: string | undefined;

    switch (check.id) {
      case "file_size": {
        if (check.actual && check.expected) {
          detail = `File size ${check.actual} (limit ${check.expected})`;
          detailTr = `Dosya boyutu ${check.actual} (limit ${check.expected})`;
        }
        hint = "Compress or reduce quality/size.";
        hintTr = "Dosyayi sikistir veya kalite/boyut dusur.";
        break;
      }
      case "min_dimensions": {
        if (check.actual && check.expected) {
          detail = `Image size ${check.actual} (minimum ${check.expected})`;
          detailTr = `Goruntu boyutu ${check.actual} (minimum ${check.expected})`;
        }
        hint = "Upload a higher resolution image.";
        hintTr = "Daha yuksek cozumurlukte gorsel yukle.";
        break;
      }
      case "aspect_ratio": {
        if (check.actual && check.expected) {
          detail = `Aspect ratio ${check.actual} (target ${check.expected})`;
          detailTr = `Goruntu orani ${check.actual} (hedef ${check.expected})`;
        }
        hint = "Crop or pad to the target aspect ratio.";
        hintTr = "Hedef oran icin crop/pad uygula.";
        break;
      }
      case "format": {
        if (check.actual && check.expected) {
          detail = `Format ${check.actual} (allowed ${check.expected})`;
          detailTr = `Format ${check.actual} (izinli ${check.expected})`;
        }
        hint = "Convert to an allowed format.";
        hintTr = "Izinli formata donustur.";
        break;
      }
      case "background": {
        if (check.actual && check.expected) {
          detail = `Background ${check.actual} (expected ${check.expected})`;
          detailTr = `Arka plan ${check.actual} (beklenen ${check.expected})`;
        }
        hint = "Use a clean background or pad with a solid color.";
        hintTr = "Temiz arka plan kullan veya tek renk pad uygula.";
        break;
      }
      default: {
        break;
      }
    }

    return {
      ...check,
      detail: check.ok ? undefined : detail,
      detailTr: check.ok ? undefined : detailTr,
      hint: check.ok ? undefined : hint,
      hintTr: check.ok ? undefined : hintTr,
    };
  }
  const maxBytes = typeof options.maxBytes === "number" ? options.maxBytes : sizeBytes;

  checks.push({
    id: "file_size",
    label: "File size under limit",
    ok: sizeBytes <= maxBytes,
    expected: `<= ${Math.round(maxBytes / 1024)} KB`,
    actual: `${sizeKb} KB`,
    severity: "fail",
  });

  const profileMinWidth = profile?.width ?? undefined;
  const profileMinHeight = profile?.height ?? undefined;
  const marketRules = getMarketplaceRules(marketplace);

  const minWidth = profileMinWidth ?? marketRules?.minWidth;
  const minHeight = profileMinHeight ?? marketRules?.minHeight;

  if (width && height && minWidth && minHeight) {
    checks.push({
      id: "min_dimensions",
      label: "Minimum dimensions",
      ok: width >= minWidth && height >= minHeight,
      expected: `>= ${minWidth}x${minHeight}`,
      actual: `${width}x${height}`,
      severity: "fail",
    });
  }

  const targetRatio = profile?.width && profile?.height ? profile.width / profile.height : marketRules?.ratio;
  if (width && height && targetRatio) {
    const ratioTolerance =
      typeof profile?.ratioTolerance === "number" ? profile.ratioTolerance : strictMode ? 0.01 : 0.02;
    const delta = Math.abs(width / height - targetRatio);
    checks.push({
      id: "aspect_ratio",
      label: "Aspect ratio",
      ok: delta <= ratioTolerance,
      expected: targetRatio.toFixed(2),
      actual: (width / height).toFixed(2),
      severity: strictMode ? "fail" : "warn",
    });
  }

  const allowedFormats = getFormatCandidates(profile) ?? marketRules?.formats ?? null;
  if (allowedFormats && allowedFormats.length) {
    checks.push({
      id: "format",
      label: "Format allowed",
      ok: !!format && allowedFormats.includes(format),
      expected: allowedFormats.join(", "),
      actual: format ?? "unknown",
      severity: "fail",
    });
  }

  const expectedBackground = profile?.background ?? marketRules?.background;
  const parsedExpected = parseHexColor(expectedBackground ?? null);
  if (parsedExpected) {
    const distance = colorDistance(parsedExpected, { r: background.r, g: background.g, b: background.b });
    const tolerance = typeof profile?.backgroundTolerance === "number" ? profile.backgroundTolerance : 40;
    checks.push({
      id: "background",
      label: "Background close to expected",
      ok: distance <= tolerance,
      expected: expectedBackground ?? "unknown",
      actual: background.hex,
      severity: strictMode ? "fail" : "warn",
    });
  }

  const score = checks.length ? Math.round((checks.filter((check) => check.ok).length / checks.length) * 100) : 100;
  const warnings = checks.filter((check) => !check.ok && check.severity === "warn").map((check) => check.id);
  const hasFailure = checks.some((check) => !check.ok && check.severity === "fail");
  const enrichedChecks = checks.map(enrichCheck);
  const failChecks = enrichedChecks.filter((check) => !check.ok && check.severity === "fail");
  const warningChecks = enrichedChecks.filter((check) => !check.ok && check.severity === "warn");
  const failCount = failChecks.length;
  const warnCount = warningChecks.length;
  const issues = enrichedChecks.filter((check) => !check.ok).map((check) => check.id);
  const rawHints = Array.from(
    new Set(enrichedChecks.filter((check) => !check.ok && check.hint).map((check) => check.hint as string)),
  );
  const rawHintsTr = Array.from(
    new Set(enrichedChecks.filter((check) => !check.ok && check.hintTr).map((check) => check.hintTr as string)),
  );
  const hints = rawHints.map((value) => value.replace(/[.]+$/g, ""));
  const hintsTr = rawHintsTr.map((value) => value.replace(/[.]+$/g, ""));
  const labelMapEn: Record<string, string> = {
    file_size: "File size",
    min_dimensions: "Minimum dimensions",
    aspect_ratio: "Aspect ratio",
    format: "Format",
    background: "Background",
  };
  const labelMapTr: Record<string, string> = {
    file_size: "Dosya boyutu",
    min_dimensions: "Minimum boyut",
    aspect_ratio: "Goruntu orani",
    format: "Format",
    background: "Arka plan",
  };
  const issueListEn = issues.length ? issues.map((id) => labelMapEn[id] ?? id).join(", ") : "-";
  const issueListTr = issues.length ? issues.map((id) => labelMapTr[id] ?? id).join(", ") : "-";
  const summaryEn = issues.length
    ? `Image has ${issues.length} issue(s). Fails: ${failCount}, warnings: ${warnCount}. Issues: ${issueListEn}.`
    : "Image meets the requirements.";
  const summaryTr = issues.length
    ? `Gorsel uygun degil. Hata: ${failCount}, Uyari: ${warnCount}. Sorunlar: ${issueListTr}.`
    : "Gorsel uygun.";
  const targetLabel = profile?.name ?? marketplace ?? "image";
  const suggestionListEn = hints.length ? ` Suggestions: ${hints.join(" | ")}.` : "";
  const suggestionListTr = hintsTr.length ? ` Oneriler: ${hintsTr.join(" | ")}.` : "";
  const commandHintEn = profile?.name ? ` Try: /images/process?profile=${profile.name}.` : "";
  const commandHintTr = profile?.name ? ` Deneme: /images/process?profile=${profile.name}.` : "";
  const summaryEnFull = `${summaryEn} Target: ${targetLabel}.${suggestionListEn}${commandHintEn}`.trim();
  const summaryTrFull = `${summaryTr} Hedef: ${targetLabel}.${suggestionListTr}${commandHintTr}`.trim();

  return {
    ok: !hasFailure,
    width,
    height,
    format: format ?? meta.format ?? undefined,
    sizeBytes,
    sizeKb,
    aspectRatio,
    background,
    profile: profile?.name ?? null,
    marketplace,
    checks: enrichedChecks,
    score,
    warnings,
    issues,
    hints,
    hintsTr,
    failChecks,
    warningChecks,
    failCount,
    warnCount,
    summaryEn: summaryEnFull,
    summaryTr: summaryTrFull,
  };
}
