import fs from "fs/promises";
import path from "path";

export type TokenEntry = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
};

type TokenStore = Record<string, TokenEntry>;

const DEFAULT_TOKEN_PATH = "data/marketplace-tokens.json";

let cache: TokenStore | null = null;

function resolveTokenPath() {
  const base = process.env.MARKETPLACE_TOKEN_PATH ?? DEFAULT_TOKEN_PATH;
  return path.resolve(base);
}

async function readStore(): Promise<TokenStore> {
  if (cache) {
    return cache;
  }
  const filePath = resolveTokenPath();
  try {
    const raw = await fs.readFile(filePath, "utf8");
    cache = JSON.parse(raw) as TokenStore;
    return cache ?? {};
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") {
      cache = {};
      return {};
    }
    throw error;
  }
}

async function writeStore(store: TokenStore) {
  const filePath = resolveTokenPath();
  const data = JSON.stringify(store, null, 2);
  await fs.writeFile(filePath, data, "utf8");
  cache = store;
}

export function getTokenStatus(entry?: TokenEntry | null) {
  if (!entry?.accessToken) {
    return { status: "missing" as const };
  }
  if (!entry.expiresAt) {
    return { status: "unknown" as const };
  }
  const expiresAt = new Date(entry.expiresAt);
  if (Number.isNaN(expiresAt.getTime())) {
    return { status: "unknown" as const };
  }
  const now = Date.now();
  if (expiresAt.getTime() <= now + 60_000) {
    return { status: "expired" as const, expiresAt: entry.expiresAt };
  }
  return { status: "valid" as const, expiresAt: entry.expiresAt };
}

export async function getToken(providerKey: string): Promise<TokenEntry | null> {
  const store = await readStore();
  return store[providerKey] ?? null;
}

export async function setToken(providerKey: string, token: TokenEntry) {
  const store = await readStore();
  store[providerKey] = token;
  await writeStore(store);
}

export async function clearToken(providerKey: string) {
  const store = await readStore();
  delete store[providerKey];
  await writeStore(store);
}
