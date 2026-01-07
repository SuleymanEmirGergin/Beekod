import fs from "fs";
import path from "path";
import { config } from "../config.js";
import { logger } from "../logger.js";

export type ImageFit = "contain" | "cover";
export type ImageFormat = "jpg" | "png" | "webp";
export type ImagePosition =
  | "center"
  | "centre"
  | "north"
  | "east"
  | "south"
  | "west"
  | "northeast"
  | "southeast"
  | "southwest"
  | "northwest"
  | "top"
  | "right"
  | "bottom"
  | "left"
  | "right top"
  | "right bottom"
  | "left bottom"
  | "left top"
  | "entropy"
  | "attention";

export type WatermarkConfig = {
  text: string;
  opacity?: number;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";
  padding?: number;
};

export type ImageProfile = {
  name: string;
  width?: number;
  height?: number;
  fit?: ImageFit;
  position?: ImagePosition;
  subjectMask?: boolean;
  subjectMaskThreshold?: number;
  subjectMaskFeather?: number;
  autoFormat?: boolean;
  autoQuality?: boolean;
  qualityMin?: number;
  qualityMax?: number;
  background?: string;
  backgroundTolerance?: number;
  strict?: boolean;
  ratioTolerance?: number;
  format?: ImageFormat;
  quality?: number;
  watermark?: WatermarkConfig;
};

type ProfileConfigFile = ImageProfile[] | { profiles?: ImageProfile[] };

type CachedProfiles = {
  profiles: ImageProfile[];
  mtimeMs: number;
  source: string;
};

let cachedOverride: CachedProfiles | null = null;
let cachedDefault: CachedProfiles | null = null;

const POSITION_ALIASES: Record<string, ImagePosition> = {
  "top-left": "left top",
  "top-right": "right top",
  "bottom-left": "left bottom",
  "bottom-right": "right bottom",
  middle: "center",
};

const VALID_POSITIONS = new Set<string>([
  "center",
  "centre",
  "north",
  "east",
  "south",
  "west",
  "northeast",
  "southeast",
  "southwest",
  "northwest",
  "top",
  "right",
  "bottom",
  "left",
  "right top",
  "right bottom",
  "left bottom",
  "left top",
  "entropy",
  "attention",
]);

function normalizePosition(value: unknown): ImagePosition | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) {
    return undefined;
  }
  const mapped = POSITION_ALIASES[trimmed] ?? trimmed;
  if (VALID_POSITIONS.has(mapped)) {
    return mapped as ImagePosition;
  }
  return undefined;
}

function normalizeProfiles(input: ProfileConfigFile | null | undefined): ImageProfile[] {
  const list = Array.isArray(input) ? input : (input?.profiles ?? []);
  return list
    .filter((profile) => profile && typeof profile.name === "string" && profile.name.trim())
    .map((profile) => {
      const watermark =
        profile.watermark && typeof profile.watermark.text === "string"
          ? {
              text: profile.watermark.text,
              opacity: typeof profile.watermark.opacity === "number" ? profile.watermark.opacity : undefined,
              position: profile.watermark.position,
              padding: typeof profile.watermark.padding === "number" ? profile.watermark.padding : undefined,
            }
          : undefined;
      return {
        name: String(profile.name).trim(),
        width: typeof profile.width === "number" ? profile.width : undefined,
        height: typeof profile.height === "number" ? profile.height : undefined,
        fit: profile.fit === "cover" || profile.fit === "contain" ? profile.fit : undefined,
        position: normalizePosition(profile.position),
        subjectMask: typeof profile.subjectMask === "boolean" ? profile.subjectMask : undefined,
        subjectMaskThreshold:
          typeof profile.subjectMaskThreshold === "number" ? profile.subjectMaskThreshold : undefined,
        subjectMaskFeather: typeof profile.subjectMaskFeather === "number" ? profile.subjectMaskFeather : undefined,
        autoFormat: typeof profile.autoFormat === "boolean" ? profile.autoFormat : undefined,
        autoQuality: typeof profile.autoQuality === "boolean" ? profile.autoQuality : undefined,
        qualityMin: typeof profile.qualityMin === "number" ? profile.qualityMin : undefined,
        qualityMax: typeof profile.qualityMax === "number" ? profile.qualityMax : undefined,
        background: typeof profile.background === "string" ? profile.background : undefined,
        backgroundTolerance: typeof profile.backgroundTolerance === "number" ? profile.backgroundTolerance : undefined,
        strict: typeof profile.strict === "boolean" ? profile.strict : undefined,
        ratioTolerance: typeof profile.ratioTolerance === "number" ? profile.ratioTolerance : undefined,
        format:
          profile.format === "png" || profile.format === "webp" || profile.format === "jpg"
            ? profile.format
            : undefined,
        quality: typeof profile.quality === "number" ? profile.quality : undefined,
        watermark,
      };
    });
}

function readProfilesFile(filePath: string, cache: CachedProfiles | null): CachedProfiles | null {
  try {
    const resolved = path.resolve(filePath);
    const stat = fs.statSync(resolved);
    if (cache && cache.mtimeMs === stat.mtimeMs) {
      return cache;
    }
    const raw = fs.readFileSync(resolved, "utf8");
    const parsed = JSON.parse(raw) as ProfileConfigFile;
    return { profiles: normalizeProfiles(parsed), mtimeMs: stat.mtimeMs, source: resolved };
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code && err.code !== "ENOENT") {
      logger.warn("image_profiles.read_failed", { path: filePath, err });
    }
    return null;
  }
}

export function loadImageProfiles(): { profiles: ImageProfile[]; source: string } {
  const override = readProfilesFile(config.images.profilesPath, cachedOverride);
  if (override) {
    cachedOverride = override;
    return { profiles: override.profiles, source: override.source };
  }

  const fallback = readProfilesFile(config.images.profilesDefaultPath, cachedDefault);
  if (fallback) {
    cachedDefault = fallback;
    return { profiles: fallback.profiles, source: fallback.source };
  }

  return { profiles: [], source: config.images.profilesDefaultPath };
}

export function getImageProfiles(): ImageProfile[] {
  return loadImageProfiles().profiles;
}

export function getImageProfile(name: string): ImageProfile | null {
  const trimmed = name.trim();
  if (!trimmed) {
    return null;
  }
  const profiles = getImageProfiles();
  const lookup = trimmed.toLowerCase();
  return profiles.find((profile) => profile.name.toLowerCase() === lookup) ?? null;
}

export function resolveImageProfile(name?: string | null): ImageProfile | null {
  const candidate = name?.trim() || config.images.defaultProfile;
  const direct = getImageProfile(candidate);
  if (direct) {
    return direct;
  }
  if (candidate !== config.images.defaultProfile) {
    return getImageProfile(config.images.defaultProfile);
  }
  return null;
}
