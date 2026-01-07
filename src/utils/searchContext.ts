const DOCS_SITE = "developers.trendyol.com";
const DOCS_HINTS = /\b(dokuman|dokumantasyon|documentation|docs|api)\b/i;
const MARKETPLACE_SITE_HINTS = [
  { site: "trendyol.com", pattern: /\btrendyol\b/ },
  { site: "hepsiburada.com", pattern: /\bhepsiburada\b|\bhb\b/ },
  { site: "n11.com", pattern: /\bn11\b/ },
  { site: "amazon.com.tr", pattern: /\bamazon\b/ },
  { site: "akakce.com", pattern: /\bakakce\b/ },
  { site: "cimri.com", pattern: /\bcimri\b/ },
  { site: "teknosa.com", pattern: /\bteknosa\b/ },
  { site: "mediamarkt.com.tr", pattern: /\bmediamarkt\b|\bmedia\s*markt\b/ },
  { site: "vatanbilgisayar.com", pattern: /\bvatan\b/ },
  { site: "turkcell.com.tr", pattern: /\bturkcell\b|\bpasaj\b/ },
  { site: "pttavm.com", pattern: /\bptt\s*avm\b|\bpttavm\b/ },
  { site: "migros.com.tr", pattern: /\bmigros\b/ },
];

function normalizeSiteHost(value: string) {
  return value
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "")
    .trim();
}

function extractSiteFromQuery(query: string) {
  const matches = Array.from(query.matchAll(/\bsite:([^\s]+)/gi));
  if (!matches.length) {
    return {
      query,
      siteSearch: undefined as string | undefined,
      siteFilters: [] as string[],
      hasSiteToken: false,
    };
  }
  const siteFilters = matches
    .map((match) => normalizeSiteHost(match[1]))
    .filter(Boolean)
    .filter((site, index, arr) => arr.indexOf(site) === index);
  const siteSearch = siteFilters[0];
  const cleaned = query
    .replace(/\bsite:[^\s]+/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  return { query: cleaned || query, siteSearch, siteFilters, hasSiteToken: true };
}

function extractSiteFromMessage(message: string) {
  const match = message.match(/\bsite\s*[:=]\s*([^\s]+)/i);
  if (!match) {
    return undefined;
  }
  const siteSearch = normalizeSiteHost(match[1]);
  return siteSearch || undefined;
}

function extractDomainToken(value: string) {
  const match = value.match(/\b([a-z0-9-]+\.[a-z0-9.-]+\.[a-z]{2,}|[a-z0-9-]+\.[a-z]{2,})\b/i);
  if (!match) {
    return { domain: undefined as string | undefined, cleaned: value };
  }
  const domain = normalizeSiteHost(match[1]);
  const cleaned = value.replace(match[1], "").replace(/\s+/g, " ").trim();
  return { domain: domain || undefined, cleaned };
}

function resolveMarketplaceSite(message: string) {
  const normalized = message
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  for (const hint of MARKETPLACE_SITE_HINTS) {
    if (hint.pattern.test(normalized)) {
      return hint.site;
    }
  }
  return undefined;
}

function extractSiteFiltersFromMessage(message: string) {
  if (!/\b(site|kaynak|source)\s*[:=]/i.test(message)) {
    return [] as string[];
  }
  const matches = message.match(/\b([a-z0-9-]+\.[a-z0-9.-]+\.[a-z]{2,})\b/gi) ?? [];
  const sites = matches.map((match) => normalizeSiteHost(match)).filter(Boolean);
  return sites.filter((site, index, arr) => arr.indexOf(site) === index);
}

export function parseBooleanQuery(value: unknown) {
  if (typeof value !== "string") {
    return false;
  }
  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

export function truncateText(value: string, max: number) {
  if (value.length <= max) {
    return value;
  }
  return `${value.slice(0, Math.max(0, max - 3)).trimEnd()}...`;
}

export function extractHost(value: string) {
  try {
    return new URL(value).host;
  } catch {
    return "";
  }
}

export function compactLink(value: string) {
  return value.replace(/^https?:\/\//i, "");
}

export function resolveSearchContext(input: {
  query: string;
  siteParam?: string;
  docsFlag?: boolean;
  message?: string;
}) {
  const extracted = extractSiteFromQuery(input.query);
  const explicitSite = input.siteParam ? normalizeSiteHost(input.siteParam) : undefined;
  let siteSearch = explicitSite || extracted.siteSearch;
  let sourceFilters: string[] = [];
  if (explicitSite) {
    sourceFilters.push(explicitSite);
  }
  if (extracted.siteFilters.length) {
    sourceFilters = sourceFilters.concat(extracted.siteFilters);
  }
  let query = extracted.query;
  if (!siteSearch && input.message) {
    const messageSite = extractSiteFromMessage(input.message);
    if (messageSite) {
      siteSearch = messageSite;
    }
  }
  if (input.message) {
    const messageFilters = extractSiteFiltersFromMessage(input.message);
    if (messageFilters.length) {
      sourceFilters = sourceFilters.concat(messageFilters);
    }
  }
  if (!siteSearch) {
    const domainFromQuery = extractDomainToken(query);
    if (domainFromQuery.domain) {
      siteSearch = domainFromQuery.domain;
      query = domainFromQuery.cleaned || query;
    }
  }
  if (!siteSearch && input.message) {
    const domainFromMessage = extractDomainToken(input.message).domain;
    if (domainFromMessage) {
      siteSearch = domainFromMessage;
    }
  }
  let autoDocs = false;
  if (!siteSearch && input.docsFlag) {
    siteSearch = DOCS_SITE;
    autoDocs = true;
  }
  if (!siteSearch && input.message) {
    const normalizedMessage = input.message
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    const hasTrendyol = normalizedMessage.includes("trendyol");
    if (hasTrendyol && DOCS_HINTS.test(normalizedMessage)) {
      siteSearch = DOCS_SITE;
      autoDocs = true;
    }
  }
  if (!siteSearch && input.message) {
    const marketplaceSite = resolveMarketplaceSite(input.message);
    if (marketplaceSite) {
      siteSearch = marketplaceSite;
    }
  }
  if (siteSearch) {
    sourceFilters.push(siteSearch);
  }
  sourceFilters = sourceFilters.filter(Boolean).filter((site, index, arr) => arr.indexOf(site) === index);
  return { query, siteSearch, sourceFilters, autoDocs, hasSiteToken: extracted.hasSiteToken };
}
