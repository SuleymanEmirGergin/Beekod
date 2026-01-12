/**
 * Environment Variable Parsing Utilities
 * @module core/config/env
 */

const env = process.env;

/**
 * Normalizes a boolean string value
 */
export function normalizeBoolean(value: string | undefined): boolean | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes"].includes(normalized)) return true;
  if (["false", "0", "no"].includes(normalized)) return false;
  return null;
}

/**
 * Config validation state
 */
export const configValidation = {
  warnings: [] as string[],
  errors: [] as string[],
  strictMode: false,
};

// Initialize strict mode
const strictRaw = env.ENV_STRICT;
const strictParsed = normalizeBoolean(strictRaw);
configValidation.strictMode = strictParsed ?? false;
if (strictRaw && strictParsed == null) {
  configValidation.warnings.push("ENV_STRICT must be a boolean");
}

/**
 * Requires an environment variable, adding to errors/warnings if missing
 */
export function requireEnv(name: string): string | undefined {
  const value = env[name];
  if (!value) {
    const message = `${name} is required`;
    if (configValidation.strictMode) {
      configValidation.errors.push(message);
    } else {
      configValidation.warnings.push(message);
    }
  }
  return value;
}

/**
 * Parses a number from environment variable with validation
 */
export function parseNumber(
  name: string,
  fallback: number,
  options: { min?: number; max?: number; integer?: boolean } = {}
): number {
  const raw = env[name];
  if (!raw || !raw.trim()) return fallback;

  const value = Number(raw);
  if (!Number.isFinite(value)) {
    configValidation.errors.push(`${name} must be a number`);
    return fallback;
  }
  if (options.integer && !Number.isInteger(value)) {
    configValidation.errors.push(`${name} must be an integer`);
    return fallback;
  }
  if (options.min != null && value < options.min) {
    configValidation.errors.push(`${name} must be >= ${options.min}`);
    return fallback;
  }
  if (options.max != null && value > options.max) {
    configValidation.errors.push(`${name} must be <= ${options.max}`);
    return fallback;
  }
  return value;
}

/**
 * Parses a boolean from environment variable
 */
export function parseBoolean(name: string, fallback: boolean): boolean {
  const raw = env[name];
  if (!raw || !raw.trim()) return fallback;

  const parsed = normalizeBoolean(raw);
  if (parsed == null) {
    configValidation.errors.push(`${name} must be a boolean`);
    return fallback;
  }
  return parsed;
}

/**
 * Parses a comma-separated value from environment variable
 */
export function parseCsv(name: string): string[] {
  const raw = env[name];
  if (!raw || !raw.trim()) return [];
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * Parses a store type (db or mock)
 */
export function parseStore(name: string, fallback: "db" | "mock"): "db" | "mock" {
  const raw = env[name];
  if (!raw || !raw.trim()) return fallback;

  const normalized = raw.trim().toLowerCase();
  if (normalized === "db" || normalized === "mock") return normalized;

  configValidation.warnings.push(`${name} must be "db" or "mock"`);
  return fallback;
}

/**
 * Parses a read source type (db or live)
 */
export function parseReadSource(name: string, fallback: "db" | "live"): "db" | "live" {
  const raw = env[name];
  if (!raw || !raw.trim()) return fallback;

  const normalized = raw.trim().toLowerCase();
  if (normalized === "db" || normalized === "live") return normalized;

  configValidation.warnings.push(`${name} must be "db" or "live"`);
  return fallback;
}
