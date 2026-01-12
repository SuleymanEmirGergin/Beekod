import { Locale } from "./types.js";
import * as locales from "./locales/index.js";

export type MessageKey = keyof typeof locales.tr;

const messages: Record<Locale, Record<MessageKey, string>> = locales;

export function t(locale: Locale, key: MessageKey, vars: Record<string, string | number> = {}) {
  const template = messages[locale]?.[key] ?? messages.en[key];
  if (!template) return key;
  return template.replace(/\{\{(\w+)\}\}/g, (_, name) => String(vars[name] ?? ""));
}

export function formatCurrency(amount: number | string, currency: string) {
  const numeric = typeof amount === "number" ? amount : Number(amount);
  const safe = Number.isFinite(numeric) ? numeric : 0;
  const value = safe.toFixed(2);
  if (currency === "TRY") {
    return `${value} TL`;
  }
  return `${value} ${currency}`;
}
