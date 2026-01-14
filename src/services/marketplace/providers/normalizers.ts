/**
 * Marketplace Normalizers
 * Shared utility functions for normalizing API response data
 * Extracted from trendyolProvider.ts to reduce duplication
 */

import type { TrendyolProductAttribute, TrendyolSizeVariant } from "./trendyolTypes.js";

/**
 * Normalize a value to a finite number
 */
export function normalizeNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

/**
 * Normalize a value to a positive number
 */
export function normalizePositiveNumber(value: unknown): number | undefined {
  const parsed = normalizeNumber(value);
  return parsed != null && parsed > 0 ? parsed : undefined;
}

/**
 * Normalize a value to a trimmed string
 */
export function normalizeString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed || undefined;
}

/**
 * Normalize a value to boolean
 */
export function normalizeBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "active", "on_sale"].includes(normalized)) {
      return true;
    }
    if (["false", "0", "no", "inactive", "off_sale"].includes(normalized)) {
      return false;
    }
  }
  return undefined;
}

/**
 * Normalize array of images to { url: string }[]
 */
export function normalizeImages(value: unknown): Array<{ url: string }> | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const urls = value
    .map((entry) => {
      if (typeof entry === "string") {
        return entry.trim();
      }
      if (entry && typeof entry === "object" && typeof (entry as { url?: unknown }).url === "string") {
        return String((entry as { url?: unknown }).url).trim();
      }
      return "";
    })
    .filter(Boolean);
  return urls.length ? urls.map((url) => ({ url })) : undefined;
}

/**
 * Normalize product attributes
 */
export function normalizeAttributes(value: unknown): TrendyolProductAttribute[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const items = value
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }
      const raw = entry as Record<string, unknown>;
      const attributeId = normalizePositiveNumber(raw.attributeId);
      if (!attributeId) {
        return null;
      }
      const attributeValueId = normalizePositiveNumber(raw.attributeValueId);
      const customAttributeValue = normalizeString(raw.customAttributeValue);
      const item: TrendyolProductAttribute = { attributeId };
      if (attributeValueId) {
        item.attributeValueId = attributeValueId;
      }
      if (customAttributeValue) {
        item.customAttributeValue = customAttributeValue;
      }
      return item;
    })
    .filter((item): item is TrendyolProductAttribute => Boolean(item));
  return items.length ? items : undefined;
}

/**
 * Normalize size variants
 */
export function normalizeSizeVariants(value: unknown): TrendyolSizeVariant[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const items = value
    .map((entry) => {
      if (typeof entry === "number" || typeof entry === "string") {
        const attributeValueId = normalizePositiveNumber(entry);
        return attributeValueId ? { attributeValueId } : null;
      }
      if (!entry || typeof entry !== "object") {
        return null;
      }
      const raw = entry as Record<string, unknown>;
      const attributeValueId = normalizePositiveNumber(raw.attributeValueId ?? raw.valueId ?? raw.id);
      if (!attributeValueId) {
        return null;
      }
      const label = normalizeString(raw.label ?? raw.value ?? raw.name);
      const item: TrendyolSizeVariant = { attributeValueId };
      if (label) {
        item.label = label;
      }
      return item;
    })
    .filter((item): item is TrendyolSizeVariant => Boolean(item));
  return items.length ? items : undefined;
}

/**
 * Extract attributes map for listing display
 */
export function extractAttributesMap(attributes: unknown): Record<string, string | number> {
  if (!Array.isArray(attributes)) return {};
  const map: Record<string, string | number> = {};
  for (const attr of attributes) {
    if (attr && typeof attr === "object" && attr.attributeName && attr.attributeValue) {
      map[attr.attributeName] = attr.attributeValue;
    }
  }
  return map;
}

/**
 * Extract attributes map as strings only
 */
export function extractAttributesMapAsStrings(attributes: unknown): Record<string, string> {
  if (!Array.isArray(attributes)) return {};
  const map: Record<string, string> = {};
  for (const attr of attributes) {
    if (attr && typeof attr === "object" && attr.attributeName && attr.attributeValue) {
      map[attr.attributeName] = String(attr.attributeValue);
    }
  }
  return map;
}
