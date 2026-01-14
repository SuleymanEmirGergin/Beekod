/**
 * AI Tools - Utility Functions
 * Shared helpers extracted from implementations.ts
 */

const DEFAULT_ANALYTICS_DAYS = 30;
const DEFAULT_ANALYTICS_LIMIT = 10;
const MAX_ANALYTICS_DAYS = 365;
const MAX_ANALYTICS_LIMIT = 100;
const DEFAULT_LIST_ORDERS_LIMIT = 50;

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Extract a number from a string
 */
export function extractNumber(input: string): number | null {
  const match = input.match(/\d+/);
  if (!match) return null;
  const parsed = parseInt(match[0], 10);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Infer days from natural language input
 */
export function inferDays(input: string): number {
  const lower = input.toLowerCase();
  if (lower.includes("bugün") || lower.includes("today")) return 1;
  if (lower.includes("hafta") || lower.includes("week")) return 7;
  if (lower.includes("ay") || lower.includes("month")) return 30;
  if (lower.includes("yıl") || lower.includes("year")) return 365;
  
  const extracted = extractNumber(input);
  return extracted ? clamp(extracted, 1, MAX_ANALYTICS_DAYS) : DEFAULT_ANALYTICS_DAYS;
}

/**
 * Infer limit from natural language input
 */
export function inferLimit(input: string): number {
  const lower = input.toLowerCase();
  if (lower.includes("top") || lower.includes("en iyi") || lower.includes("ilk")) {
    const extracted = extractNumber(input);
    return extracted ? clamp(extracted, 1, MAX_ANALYTICS_LIMIT) : DEFAULT_ANALYTICS_LIMIT;
  }
  return DEFAULT_ANALYTICS_LIMIT;
}

export type AnalyticsQueryType =
  | "top_products"
  | "trend_analysis"
  | "revenue_summary"
  | "order_stats"
  | "general";

/**
 * Resolve analytics query type from natural language
 */
export function resolveAnalyticsQuery(nl: string = ""): {
  queryType: AnalyticsQueryType;
  days: number;
  limit: number;
} {
  const lower = nl.toLowerCase();
  
  let queryType: AnalyticsQueryType = "general";
  
  if (lower.includes("en çok satan") || lower.includes("top selling") || lower.includes("popüler")) {
    queryType = "top_products";
  } else if (lower.includes("trend") || lower.includes("eğilim")) {
    queryType = "trend_analysis";
  } else if (lower.includes("gelir") || lower.includes("revenue") || lower.includes("ciro")) {
    queryType = "revenue_summary";
  } else if (lower.includes("sipariş") || lower.includes("order")) {
    queryType = "order_stats";
  }
  
  return {
    queryType,
    days: inferDays(nl),
    limit: inferLimit(nl),
  };
}

// Re-export constants
export { DEFAULT_ANALYTICS_DAYS, DEFAULT_ANALYTICS_LIMIT, MAX_ANALYTICS_DAYS, MAX_ANALYTICS_LIMIT, DEFAULT_LIST_ORDERS_LIMIT };
