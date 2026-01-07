const MARKETPLACE_ALIASES: Record<string, string> = {
  trendyol: "Trendyol",
  hepsiburada: "Hepsiburada",
  amazon: "Amazon",
  hb: "Hepsiburada",
};

const WORD_NUMBERS: Record<string, number> = {
  bir: 1,
  iki: 2,
  uc: 3,
  dort: 4,
  bes: 5,
  alti: 6,
  yedi: 7,
  sekiz: 8,
  dokuz: 9,
  on: 10,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
};

export function normalizeInput(message: string) {
  return message
    .normalize("NFD")
    .replace(/\u0131/g, "i") // ı -> i
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function isLikelyBarcode(value: string) {
  return /\d/.test(value);
}

export function extractBarcode(normalized: string) {
  const patterns = [/([a-z0-9-]+)\s+(?:barkodlu|barcode|code)/, /(?:barkod\w*|barcode\w*|code)\s*[:#]?\s*([a-z0-9-]+)/];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (!match) continue;
    const candidate = match[1];
    if (!candidate || !isLikelyBarcode(candidate)) continue;
    return candidate;
  }

  const tokens = normalized.split(/[^a-z0-9-]+/).filter(Boolean);
  const fallback = tokens.find((token) => /[a-z]/.test(token) && /\d/.test(token));
  return fallback && isLikelyBarcode(fallback) ? fallback : undefined;
}

export function extractBatchRequestId(message: string) {
  const patterns = [
    /batch-requests\/([a-z0-9-]+)/i,
    /batchrequestid\s*[:#=]?\s*([a-z0-9-]+)/i,
    /batch\s*request\s*(?:id)?\s*[:#=]?\s*([a-z0-9-]+)/i,
    /batch\s*id\s*[:#=]?\s*([a-z0-9-]+)/i,
  ];
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match?.[1]) return match[1].trim();
  }

  const normalized = normalizeInput(message);
  const normalizedPatterns = [
    /toplu\s*(?:islem|istek)\s*(?:id)?\s*[:#=]?\s*([a-z0-9-]+)/i,
    /batch\s*sonuc\s*[:#=]?\s*([a-z0-9-]+)/i,
    /batch\s*durum\s*[:#=]?\s*([a-z0-9-]+)/i,
  ];
  for (const pattern of normalizedPatterns) {
    const match = normalized.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return undefined;
}

export function extractMarketplace(message: string) {
  const normalized = message.toLowerCase();
  for (const [key, value] of Object.entries(MARKETPLACE_ALIASES)) {
    // Allow for suffixes like 'trendyola', 'trendyolda' etc.
    const pattern = new RegExp(`\\b${key}`, "i");
    if (pattern.test(normalized)) return value;
  }
  const allPattern =
    /\b(tum\s+pazaryerleri|pazaryerleri|all\s+marketplaces|marketplaces|alle\s+markt|tous\s+marche|todos\s+mercados)\b/i;
  if (allPattern.test(normalized)) return "ALL";
  return undefined;
}

export function extractTitle(message: string) {
  const match = message.match(/(?:urun|product|title|baslik|name|produkt|produit|producto)\s*[:\-]\s*([^,]+)/i);
  if (!match) return undefined;
  let value = match[1].trim();
  value = value.replace(/\b(fiyat|stok|price|stock|preis|prix|precio)\b.*$/i, "").trim();
  return value || undefined;
}

export function extractLabeledPrice(message: string) {
  const match = message.match(/(?:fiyat|price|preis|prix|precio)\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i);
  if (!match) return undefined;
  return Number(match[1].replace(",", "."));
}

export function extractLabeledStock(message: string) {
  const match = message.match(/(?:stok|stock|bestand|lager|existencias)\s*[:=]?\s*(\d+)/i);
  if (!match) return undefined;
  return Number(match[1]);
}

export function extractCurrency(message: string) {
  if (/\btry\b|\btl\b/i.test(message)) return "TRY";
  if (/\busd\b/i.test(message)) return "USD";
  if (/\beur\b/i.test(message)) return "EUR";
  return undefined;
}

export function extractStatus(message: string) {
  if (/\bpasif|inactive|deactivate|disabled|inactif|inactivo\b/i.test(message)) return "inactive";
  if (/\baktif|active|activate|enabled|actif|activo\b/i.test(message)) return "active";
  return undefined;
}

export function extractAmount(normalized: string, barcode?: string) {
  const matches = [...normalized.matchAll(/\d+(?:[.,]\d+)?/g)];
  const barcodeLower = barcode?.toLowerCase();

  for (const match of matches) {
    const value = match[0];
    const start = match.index ?? 0;
    const end = start + value.length;
    const before = normalized[start - 1] ?? " ";
    const after = normalized[end] ?? " ";
    const windowStart = Math.max(0, start - 10);
    const window = normalized.slice(windowStart, end + 10);

    if (barcodeLower && value === barcodeLower) continue;
    if (/[a-z]/.test(before) || /[a-z]/.test(after)) continue;
    if (/barkod|barcode/.test(window)) continue;

    return Number(value.replace(",", "."));
  }

  for (const [word, value] of Object.entries(WORD_NUMBERS)) {
    const regex = new RegExp(`\\b${word}\\b`);
    if (regex.test(normalized)) return value;
  }

  return undefined;
}

export function extractPercent(normalized: string) {
  const direct = normalized.match(/(\d+(?:[.,]\d+)?)\s*%/);
  if (direct) return Number(direct[1].replace(",", "."));
  const inverse = normalized.match(/%\s*(\d+(?:[.,]\d+)?)/);
  if (inverse) return Number(inverse[1].replace(",", "."));
  const trailing = normalized.match(/(\d+(?:[.,]\d+)?)\s*(?:percent|yuzde|prozent|pourcent|porciento)/);
  if (trailing) return Number(trailing[1].replace(",", "."));
  return undefined;
}

export function extractText(message: string) {
  const quoteMatch = message.match(/"([^"]+)"/) ?? message.match(/'([^']+)'/);
  if (quoteMatch) return quoteMatch[1].trim();

  const colonIndex = message.lastIndexOf(":");
  if (colonIndex !== -1 && colonIndex < message.length - 1) {
    return message.slice(colonIndex + 1).trim();
  }

  const dashIndex = message.lastIndexOf("-");
  if (dashIndex !== -1 && dashIndex < message.length - 1) {
    return message.slice(dashIndex + 1).trim();
  }

  return undefined;
}

export function extractProductName(message: string) {
  const labeled = extractText(message);
  if (labeled) {
    const cleaned = labeled.replace(/\b(fiyat|stok|price|stock|rakip|competitor)\b.*$/i, "").trim();
    return cleaned || labeled;
  }
  const match = message.match(
    /(?:urun|ürün|product|produkt|produit|producto)(?:\s+|:)(.+?)(?:\s+(?:fiyat|stok|price|stock|rakip|competitor)\b|$)/i,
  );
  if (match) return match[1].trim();
  return undefined;
}

export function extractNameFromFor(message: string) {
  const match = message.match(/(.+?)\s+(?:icin|i\u00e7in|for|fuer|pour|para)\b/i);
  if (!match) return undefined;
  let value = match[1].trim();
  value = value.replace(/^(?:bu|su|bir|the|a|an|das|ein|le|la|el|un)\s+/i, "");
  value = value.replace(/^(?:urun|u\u00fcr\u00fcn|product|produkt|produit|producto)\b\s*/i, "");
  const normalized = value.toLowerCase();
  if (!value || value.length < 3) return undefined;

  const blocked = [
    "seo",
    "aciklama",
    "description",
    "sosyal",
    "social",
    "post",
    "fiyat",
    "price",
    "stok",
    "stock",
    "barkod",
    "barcode",
  ];
  if (blocked.some((word) => normalized.includes(word))) return undefined;

  return value;
}

export function extractCategory(message: string) {
  const match = message.match(/(?:kategori|category|kategorie|categorie|categoria)\s*[:\-]?\s*([^\n\r,]+)/i);
  if (!match) return undefined;
  return match[1].trim();
}

export function extractTone(message: string) {
  const labeled = message.match(/(?:ton|tone)\s*[:\-]?\s*([a-z0-9_-]+)/i);
  if (labeled) return labeled[1].trim();
  if (/\bpremium|lux|luks|elite\b/i.test(message)) return "premium";
  if (/\bcasual|samimi|gunluk|daily\b/i.test(message)) return "casual";
  if (/\benerjik|energetic|dinamik|dynamic\b/i.test(message)) return "energetic";
  return undefined;
}

export function extractProfile(message: string) {
  const match = message.match(/(?:profile|profil)\s*[:=]\s*([a-z0-9_-]+)/i);
  if (!match) return undefined;
  return match[1].trim();
}

export function extractSearchQuery(message: string) {
  if (/\bsite\s*[:=]/i.test(message)) return message.trim();
  return undefined;
}

export function extractImageSearchText(message: string) {
  return undefined;
}
