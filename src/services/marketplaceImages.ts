import { config } from "../config.js";
import { resolveImageProfile } from "../images/imageProfiles.js";
import { listImagesByBarcode, reprocessLatestOriginal } from "../images/imageService.js";

const DEFAULT_LIMIT = 8;

function resolveProfileName(marketplace?: string | null, profileHint?: string | null) {
  if (profileHint && profileHint.trim()) {
    return profileHint.trim();
  }
  if (!marketplace) {
    return config.images.defaultProfile;
  }
  const normalized = marketplace.toLowerCase();
  if (normalized.includes("trendyol")) {
    return "trendyol_square";
  }
  if (normalized.includes("instagram")) {
    return "instagram_post";
  }
  return config.images.defaultProfile;
}

function collectUrls(items: Awaited<ReturnType<typeof listImagesByBarcode>>, limit: number) {
  const urls: string[] = [];
  for (const item of items) {
    const url = item.processedUrl || item.originalUrl;
    if (!url) {
      continue;
    }
    if (!urls.includes(url)) {
      urls.push(url);
    }
    if (urls.length >= limit) {
      break;
    }
  }
  return urls;
}

export async function resolveMarketplaceImageUrls(input: {
  barcode: string;
  marketplace?: string | null;
  profile?: string | null;
  limit?: number;
}) {
  const barcode = input.barcode.trim().toLowerCase();
  if (!barcode) {
    return [];
  }
  const profileName = resolveProfileName(input.marketplace ?? null, input.profile ?? null);
  const limit = Number.isFinite(input.limit) ? Math.max(1, Math.trunc(input.limit as number)) : DEFAULT_LIMIT;
  const items = await listImagesByBarcode(barcode);
  if (!items.length) {
    return [];
  }

  const matching = profileName ? items.filter((item) => item.profile === profileName) : [];
  if (matching.length) {
    return collectUrls(matching, limit);
  }

  const profile = resolveImageProfile(profileName);
  if (profile) {
    const reprocessed = await reprocessLatestOriginal({
      barcode,
      marketplace: input.marketplace ?? null,
      profile,
    });
    if (reprocessed?.processedUrl) {
      return [reprocessed.processedUrl];
    }
  }

  return collectUrls(items, limit);
}
