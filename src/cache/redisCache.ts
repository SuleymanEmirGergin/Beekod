import { getRedisClient, getRedisPrefix } from "../redis.js";

const DEFAULT_TTL_SECONDS = Number(process.env.CACHE_DEFAULT_TTL_SECONDS ?? 60);

function withPrefix(key: string) {
  const prefix = getRedisPrefix();
  return `${prefix}:${key}`;
}

export async function cacheGetJson<T>(key: string): Promise<T | null> {
  const client = await getRedisClient();
  if (!client) {
    return null;
  }
  const raw = await client.get(withPrefix(key));
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function cacheSetJson(key: string, value: unknown, ttlSeconds = DEFAULT_TTL_SECONDS) {
  const client = await getRedisClient();
  if (!client) {
    return false;
  }
  const payload = JSON.stringify(value);
  if (ttlSeconds > 0) {
    await client.set(withPrefix(key), payload, { EX: ttlSeconds });
  } else {
    await client.set(withPrefix(key), payload);
  }
  return true;
}

export async function cacheDel(keys: string | string[]) {
  const client = await getRedisClient();
  if (!client) {
    return 0;
  }
  const list = Array.isArray(keys) ? keys : [keys];
  if (!list.length) {
    return 0;
  }
  return client.del(list.map(withPrefix));
}

export async function cacheDelByPrefix(prefixKey: string) {
  const client = await getRedisClient();
  if (!client) {
    return 0;
  }
  const pattern = `${withPrefix(prefixKey)}*`;
  let deleted = 0;
  for await (const key of client.scanIterator({ MATCH: pattern })) {
    deleted += await client.del(key);
  }
  return deleted;
}
