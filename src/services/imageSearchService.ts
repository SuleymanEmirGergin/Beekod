import { config } from "../config.js";
import { resolveSearchContext } from "../utils/searchContext.js";
import { searchImages } from "./searchService.js";

// Define ImageSearchResult type locally
export type ImageSearchResult = Awaited<ReturnType<typeof searchImages>>;

export type ImageSearchContext = {
  query: string;
  siteSearch?: string;
  num: number;
};

function clampNumber(value: number | undefined, fallback: number, min = 1, max = 10) {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, Math.trunc(value as number)));
}

export function resolveImageSearchContext(input: {
  query: string;
  message?: string;
  siteSearch?: string;
  num?: number;
}): ImageSearchContext {
  const resolved = resolveSearchContext({ query: input.query, message: input.message });
  const query = resolved.query || input.query;
  const siteSearch = input.siteSearch || resolved.siteSearch || config.search.siteDefault || undefined;
  const num = clampNumber(input.num, config.search.imageDefaultNum);
  return { query, siteSearch, num };
}

export async function runImageSearch(input: {
  query: string;
  message?: string;
  siteSearch?: string;
  num?: number;
}): Promise<{ context: ImageSearchContext; result: { query: string; items: any[]; totalResults?: number; searchTime?: number } }> {
  const context = resolveImageSearchContext(input);
  const items = await searchImages(context.query, {
    maxResults: context.num,
  });
  return { context, result: { query: context.query, items } };
}
