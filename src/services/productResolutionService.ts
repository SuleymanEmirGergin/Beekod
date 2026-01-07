import { Product } from "../types.js";
import { getAllProducts, searchProductsByName } from "./productService.js";

export type NameResolution = {
  product?: Product;
  ambiguous?: Array<{ barcode: string; name: string }>;
  notFound?: boolean;
};

export function extractNumericTokens(value: string): string[] {
  const matches = value.match(/\d+/g);
  return matches || [];
}

export function filterByNumericTokens<T extends { name: string }>(items: T[], tokens: string[]): T[] {
  if (!tokens.length) return items;
  return items.filter((item) => {
    const itemName = item.name.toLowerCase();
    return tokens.every((token) => itemName.includes(token));
  });
}

export function levenshtein(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, () =>
    Array.from({ length: b.length + 1 }, (_, bIndex) => bIndex),
  );
  for (let i = 1; i <= a.length; i++) {
    matrix[i][0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
    }
  }
  return matrix[a.length][b.length];
}

export function scoreMatch(queryRaw: string, candidateRaw: string): number {
  const query = queryRaw.toLowerCase().trim();
  const candidate = candidateRaw.toLowerCase().trim();

  if (candidate.includes(query)) {
    return 0.8 + (query.length / candidate.length) * 0.2;
  }

  const dist = levenshtein(query, candidate);
  const maxLen = Math.max(query.length, candidate.length);
  return 1 - dist / maxLen;
}

export async function resolveProductByName(name: string): Promise<NameResolution> {
  const trimmed = name.trim();
  if (trimmed.length < 3) {
    return { notFound: true };
  }
  const numericTokens = extractNumericTokens(trimmed);
  const matches = await searchProductsByName(trimmed, 5);
  const narrowedMatches = filterByNumericTokens(matches, numericTokens);
  const effectiveMatches = narrowedMatches.length ? narrowedMatches : matches;

  if (effectiveMatches.length === 1) {
    return { product: effectiveMatches[0] };
  }
  if (effectiveMatches.length > 1) {
    return { ambiguous: effectiveMatches.map((item) => ({ barcode: item.barcode, name: item.name })) };
  }

  const all = await getAllProducts(50);
  const narrowedAll = filterByNumericTokens(all, numericTokens);
  const candidates = narrowedAll.length ? narrowedAll : all;
  const scored = candidates
    .map((item) => ({ item, score: scoreMatch(trimmed, item.name) }))
    .filter((entry) => entry.score >= 0.6)
    .sort((a, b) => b.score - a.score);

  if (!scored.length) {
    return { notFound: true };
  }

  const best = scored[0];
  const second = scored[1];
  if (second && second.score >= best.score - 0.08) {
    return {
      ambiguous: scored.slice(0, 3).map((entry) => ({ barcode: entry.item.barcode, name: entry.item.name })),
    };
  }

  return { product: best.item };
}
