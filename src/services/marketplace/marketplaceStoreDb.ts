import { cacheDel, cacheDelByPrefix, cacheGetJson, cacheSetJson } from "../../cache/redisCache.js";
import { query } from "../../db.js";
import { MarketplaceListing, MarketplaceStats } from "../../types.js";

type MarketplaceRow = {
  marketplace: string;
  barcode: string;
  title: string;
  price: number;
  stock: number;
  currency: string;
  active: number;
};

type MarketplaceStatsRow = {
  marketplace: string;
  total: number;
  active: number;
  inactive: number;
};

const CACHE_TTL_SECONDS = Number(process.env.CACHE_MARKETPLACE_TTL_SECONDS ?? 60);

function cacheKey(barcode?: string) {
  return barcode ? `marketplace:listings:${barcode.toLowerCase()}` : "marketplace:listings:all";
}

async function invalidateMarketplaceCache(barcodes: string[]) {
  if (!Number.isFinite(CACHE_TTL_SECONDS) || CACHE_TTL_SECONDS <= 0) {
    return;
  }
  const keys = new Set<string>([cacheKey()]);
  for (const barcode of barcodes) {
    if (barcode) {
      keys.add(cacheKey(barcode));
    }
  }
  await cacheDel([...keys]);
}

function normalizeListing(listing: MarketplaceListing): MarketplaceListing {
  return {
    marketplace: listing.marketplace.trim(),
    barcode: listing.barcode.trim().toLowerCase(),
    title: listing.title?.trim() ?? "",
    price: Number(listing.price ?? 0),
    stock: Math.max(0, Math.trunc(Number(listing.stock ?? 0))),
    currency: listing.currency?.trim().toUpperCase() || "TRY",
    active: Boolean(listing.active),
  };
}

function mapRow(row: MarketplaceRow): MarketplaceListing {
  return {
    marketplace: row.marketplace,
    barcode: row.barcode,
    title: row.title,
    price: Number(row.price),
    stock: Number(row.stock),
    currency: row.currency,
    active: Boolean(row.active),
  };
}

export async function getMarketplaceListings(barcode?: string): Promise<MarketplaceListing[]> {
  if (Number.isFinite(CACHE_TTL_SECONDS) && CACHE_TTL_SECONDS > 0) {
    const cached = await cacheGetJson<MarketplaceListing[]>(cacheKey(barcode));
    if (cached) {
      return cached;
    }
  }
  if (barcode) {
    const rows = await query<MarketplaceRow[]>(
      `SELECT marketplace, barcode, title, price, stock, currency, active
       FROM marketplace_listings
       WHERE barcode = ?
       ORDER BY marketplace ASC`,
      [barcode.toLowerCase()],
    );
    const mapped = rows.map(mapRow);
    if (Number.isFinite(CACHE_TTL_SECONDS) && CACHE_TTL_SECONDS > 0) {
      await cacheSetJson(cacheKey(barcode), mapped, CACHE_TTL_SECONDS);
    }
    return mapped;
  }

  const rows = await query<MarketplaceRow[]>(
    `SELECT marketplace, barcode, title, price, stock, currency, active
     FROM marketplace_listings
     ORDER BY marketplace ASC, barcode ASC`,
  );
  const mapped = rows.map(mapRow);
  if (Number.isFinite(CACHE_TTL_SECONDS) && CACHE_TTL_SECONDS > 0) {
    await cacheSetJson(cacheKey(), mapped, CACHE_TTL_SECONDS);
  }
  return mapped;
}

export async function getMarketplaceStats(): Promise<MarketplaceStats[]> {
  const rows = await query<MarketplaceStatsRow[]>(
    `SELECT marketplace,
            COUNT(*) AS total,
            SUM(active = 1) AS active,
            SUM(active = 0) AS inactive
     FROM marketplace_listings
     GROUP BY marketplace
     ORDER BY marketplace ASC`,
  );
  return rows.map((row) => ({
    marketplace: row.marketplace,
    total: Number(row.total ?? 0),
    active: Number(row.active ?? 0),
    inactive: Number(row.inactive ?? 0),
  }));
}

export async function getMarketplaceListing(barcode: string, marketplace: string): Promise<MarketplaceListing | null> {
  const rows = await query<MarketplaceRow[]>(
    `SELECT marketplace, barcode, title, price, stock, currency, active
     FROM marketplace_listings
     WHERE barcode = ? AND LOWER(marketplace) = LOWER(?)
     LIMIT 1`,
    [barcode.toLowerCase(), marketplace.trim()],
  );
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function upsertMarketplaceListing(listing: MarketplaceListing): Promise<MarketplaceListing> {
  const normalized = normalizeListing(listing);
  await query(
    `INSERT INTO marketplace_listings (marketplace, barcode, title, price, stock, currency, active)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       title = VALUES(title),
       price = VALUES(price),
       stock = VALUES(stock),
       currency = VALUES(currency),
       active = VALUES(active)`,
    [
      normalized.marketplace,
      normalized.barcode,
      normalized.title,
      normalized.price,
      normalized.stock,
      normalized.currency,
      normalized.active ? 1 : 0,
    ],
  );
  await invalidateMarketplaceCache([normalized.barcode]);
  return normalized;
}

export async function upsertMarketplaceListings(listings: MarketplaceListing[]): Promise<MarketplaceListing[]> {
  if (!listings.length) {
    return [];
  }

  const normalized = listings.map(normalizeListing);
  const values = normalized.map((item) => [
    item.marketplace,
    item.barcode,
    item.title,
    item.price,
    item.stock,
    item.currency,
    item.active ? 1 : 0,
  ]);

  await query(
    `INSERT INTO marketplace_listings (marketplace, barcode, title, price, stock, currency, active)
     VALUES ?
     ON DUPLICATE KEY UPDATE
       title = VALUES(title),
       price = VALUES(price),
       stock = VALUES(stock),
       currency = VALUES(currency),
      active = VALUES(active)`,
    [values],
  );

  await invalidateMarketplaceCache(normalized.map((item) => item.barcode));
  return normalized;
}

export async function clearMarketplaceListings() {
  await query("DELETE FROM marketplace_listings");
  await invalidateMarketplaceCache([]);
}

export async function resetMarketplaceCache() {
  if (!Number.isFinite(CACHE_TTL_SECONDS) || CACHE_TTL_SECONDS <= 0) {
    return;
  }
  await cacheDelByPrefix("marketplace:listings:");
}
