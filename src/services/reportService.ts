import { SalesRecord, Locale } from "../types.js";

export type Period = "this_month" | "last_month" | "this_week" | "last_week";

export type PeriodKey = {
  type: "month" | "week";
  key: string;
};

export type SalesSummary = {
  period: string;
  periodLabel?: string;
  orders: number;
  items: number;
  revenue: number;
  averageOrderValue: number;
  currency: string;
  topMarketplace: string;
};

export type TopProduct = {
  barcode: string;
  quantity: number;
  revenue: number;
};

export type MarketplaceSummary = {
  marketplace: string;
  orders: number;
  items: number;
  revenue: number;
  currency: string;
};

function toMonthKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function formatDateUTC(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toWeekKey(date: Date) {
  const utc = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  const weekLabel = String(week).padStart(2, "0");
  return `${utc.getUTCFullYear()}-W${weekLabel}`;
}

function isoWeekStart(year: number, week: number) {
  const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
  const dow = simple.getUTCDay();
  const start = new Date(simple);
  if (dow <= 4 && dow !== 0) {
    start.setUTCDate(simple.getUTCDate() - (dow - 1));
  } else {
    start.setUTCDate(simple.getUTCDate() + (8 - (dow || 7)));
  }
  return start;
}

const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_TR = ["Oca", "Sub", "Mar", "Nis", "May", "Haz", "Tem", "Agu", "Eyl", "Eki", "Kas", "Ara"];
const MONTHS_DE = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
const MONTHS_FR = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
const MONTHS_ES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function getMonths(locale: Locale) {
  switch (locale) {
    case "tr":
      return MONTHS_TR;
    case "de":
      return MONTHS_DE;
    case "fr":
      return MONTHS_FR;
    case "es":
      return MONTHS_ES;
    default:
      return MONTHS_EN;
  }
}

function formatRange(start: Date, end: Date, locale: Locale) {
  const months = getMonths(locale);
  const startDay = pad2(start.getUTCDate());
  const endDay = pad2(end.getUTCDate());
  const startMonth = months[start.getUTCMonth()];
  const endMonth = months[end.getUTCMonth()];
  const startYear = start.getUTCFullYear();
  const endYear = end.getUTCFullYear();

  if (startYear === endYear && startMonth === endMonth) {
    return `${startDay}-${endDay} ${startMonth} ${startYear}`;
  }
  if (startYear === endYear) {
    return `${startDay} ${startMonth}-${endDay} ${endMonth} ${startYear}`;
  }
  return `${startDay} ${startMonth} ${startYear}-${endDay} ${endMonth} ${endYear}`;
}

export function formatPeriodLabel(period: PeriodKey, locale: Locale = "en") {
  if (period.type === "month") {
    const [yearRaw, monthRaw] = period.key.split("-");
    const year = Number(yearRaw);
    const month = Number(monthRaw);
    if (!Number.isFinite(year) || !Number.isFinite(month)) {
      return period.key;
    }
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 0));
    return formatRange(start, end, locale);
  }

  const match = period.key.match(/^(\d{4})-W(\d{2})$/);
  if (!match) {
    return period.key;
  }
  const year = Number(match[1]);
  const week = Number(match[2]);
  if (!Number.isFinite(year) || !Number.isFinite(week)) {
    return period.key;
  }
  const start = isoWeekStart(year, week);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  return formatRange(start, end, locale);
}

function resolveFromKeys(keys: string[], period: Period, fallback: string | null) {
  if (!keys.length) {
    return null;
  }
  const lastKey = keys[keys.length - 1];
  if (period === "last_month" || period === "last_week") {
    return keys.length > 1 ? keys[keys.length - 2] : (fallback ?? lastKey);
  }
  return lastKey;
}

export function resolvePeriod(records: SalesRecord[], period?: Period, explicitMonth?: string): PeriodKey | null {
  const monthPattern = /^\d{4}-\d{2}$/;
  if (explicitMonth && monthPattern.test(explicitMonth)) {
    return { type: "month", key: explicitMonth };
  }

  const wantsWeek = period === "this_week" || period === "last_week";
  if (wantsWeek) {
    const weeks = Array.from(new Set(records.map((record) => toWeekKey(record.date)))).sort();
    if (!weeks.length) {
      return null;
    }
    const key = resolveFromKeys(weeks, period, weeks[0]);
    return key ? { type: "week", key } : null;
  }

  const months = Array.from(new Set(records.map((record) => toMonthKey(record.date)))).sort();
  if (!months.length) {
    return null;
  }
  const key = resolveFromKeys(months, period ?? "this_month", months[0]);
  return key ? { type: "month", key } : null;
}

export function filterByPeriod(records: SalesRecord[], period: PeriodKey) {
  if (period.type === "week") {
    return records.filter((record) => toWeekKey(record.date) === period.key);
  }
  return records.filter((record) => toMonthKey(record.date) === period.key);
}

export function summarizeSales(records: SalesRecord[], periodKey: string): SalesSummary | null {
  if (!records.length) {
    return null;
  }
  const orders = new Set(records.map((record) => record.orderId)).size;
  const items = records.reduce((sum, record) => sum + record.quantity, 0);
  const revenue = records.reduce((sum, record) => sum + record.quantity * record.unitPrice, 0);
  const currency = records[0].currency || "TRY";
  const marketplaceTotals = new Map<string, number>();
  for (const record of records) {
    const key = record.marketplace?.trim() || "Unknown";
    const current = marketplaceTotals.get(key) ?? 0;
    marketplaceTotals.set(key, current + record.quantity * record.unitPrice);
  }
  const topMarketplace = Array.from(marketplaceTotals.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Unknown";
  const averageOrderValue = orders > 0 ? revenue / orders : 0;
  return {
    period: periodKey,
    orders,
    items,
    revenue,
    averageOrderValue,
    currency,
    topMarketplace,
  };
}

export function topProducts(records: SalesRecord[], limit: number): TopProduct[] {
  const totals = new Map<string, { quantity: number; revenue: number }>();
  for (const record of records) {
    const current = totals.get(record.barcode) ?? { quantity: 0, revenue: 0 };
    current.quantity += record.quantity;
    current.revenue += record.quantity * record.unitPrice;
    totals.set(record.barcode, current);
  }

  return Array.from(totals.entries())
    .map(([barcode, totals]) => ({ barcode, ...totals }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, Math.max(1, limit));
}

export function summarizeMarketplaceSales(records: SalesRecord[]): MarketplaceSummary[] {
  const totals = new Map<
    string,
    { marketplace: string; revenue: number; items: number; orders: Set<string>; currency: string }
  >();

  for (const record of records) {
    const key = record.marketplace?.trim() || "Unknown";
    const current = totals.get(key) ?? {
      marketplace: key,
      revenue: 0,
      items: 0,
      orders: new Set<string>(),
      currency: record.currency || "TRY",
    };
    current.revenue += record.quantity * record.unitPrice;
    current.items += record.quantity;
    current.orders.add(record.orderId);
    totals.set(key, current);
  }

  return Array.from(totals.values())
    .map((item) => ({
      marketplace: item.marketplace,
      orders: item.orders.size,
      items: item.items,
      revenue: item.revenue,
      currency: item.currency,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}
