import fs from "fs";
import path from "path";
import { config } from "../config.js";
import { logger } from "../logger.js";

export type MarketplaceProfileSet = {
  marketplace: string;
  profiles: string[];
  defaultProfile?: string;
  note?: string;
};

type ProfileSetFile = MarketplaceProfileSet[] | { sets?: MarketplaceProfileSet[] };

function normalizeSets(input: ProfileSetFile | null | undefined): MarketplaceProfileSet[] {
  const list = Array.isArray(input) ? input : (input?.sets ?? []);
  return list
    .filter((item) => item && typeof item.marketplace === "string")
    .map((item) => ({
      marketplace: String(item.marketplace).trim(),
      profiles: Array.isArray(item.profiles) ? item.profiles.map((p) => String(p).trim()).filter(Boolean) : [],
      defaultProfile: item.defaultProfile ? String(item.defaultProfile).trim() : undefined,
      note: item.note ? String(item.note).trim() : undefined,
    }))
    .filter((item) => item.marketplace && item.profiles.length);
}

function readSetsFile(filePath: string): MarketplaceProfileSet[] | null {
  try {
    const resolved = path.resolve(filePath);
    if (!fs.existsSync(resolved)) {
      return null;
    }
    const raw = fs.readFileSync(resolved, "utf8");
    const parsed = JSON.parse(raw) as ProfileSetFile;
    return normalizeSets(parsed);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code && err.code !== "ENOENT") {
      logger.warn("image_profile_sets.read_failed", { path: filePath, err });
    }
    return null;
  }
}

export function getMarketplaceProfileSets(): MarketplaceProfileSet[] {
  const override = readSetsFile(config.images.profileSetsPath);
  if (override && override.length) {
    return override;
  }
  const fallback = readSetsFile(config.images.profileSetsDefaultPath);
  return fallback ?? [];
}

export function resolveMarketplaceProfileSet(marketplace?: string | null): MarketplaceProfileSet | null {
  if (!marketplace) {
    return null;
  }
  const normalized = marketplace.trim().toLowerCase();
  const sets = getMarketplaceProfileSets();
  return (
    sets.find((item) => item.marketplace.trim().toLowerCase() === normalized) ??
    sets.find((item) => normalized.includes(item.marketplace.trim().toLowerCase())) ??
    null
  );
}
