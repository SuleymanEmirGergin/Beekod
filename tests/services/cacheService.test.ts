import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock redis.js before importing anything that uses it
vi.mock("../../src/redis.js", () => ({
    getRedisClient: vi.fn(),
    getRedisPrefix: vi.fn(() => "test"),
}));

import { getCache, setCache, deleteCache, clearCache } from "../../src/services/product/cacheService.js";
import { getRedisClient } from "../../src/redis.js";

describe("CacheService (Redis)", () => {
    const mockRedis = {
        get: vi.fn(),
        set: vi.fn(),
        del: vi.fn(),
        flushDb: vi.fn(),
    };

    beforeEach(async () => {
        vi.clearAllMocks();
        vi.mocked(getRedisClient).mockResolvedValue(mockRedis as any);
    });

    describe("getCache", () => {
        it("should return parsed JSON from Redis", async () => {
            mockRedis.get.mockResolvedValue(JSON.stringify({ name: "Product A" }));
            const result = await getCache<{ name: string }>("product:123");
            expect(result).toEqual({ name: "Product A" });
            expect(mockRedis.get).toHaveBeenCalledWith("test:product:123");
        });

        it("should return null if key not found", async () => {
            mockRedis.get.mockResolvedValue(null);
            const result = await getCache("nonexistent");
            expect(result).toBeNull();
        });
    });

    describe("setCache", () => {
        it("should set value in Redis with TTL", async () => {
            mockRedis.set.mockResolvedValue("OK");
            const result = await setCache("key", { data: "value" }, 300);
            expect(mockRedis.set).toHaveBeenCalledWith("test:key", JSON.stringify({ data: "value" }), { EX: 300 });
            expect(result).toBe(true);
        });
    });

    describe("deleteCache", () => {
        it("should delete key from Redis", async () => {
            mockRedis.del.mockResolvedValue(1);
            const result = await deleteCache("key");
            expect(mockRedis.del).toHaveBeenCalledWith("test:key");
            expect(result).toBe(true);
        });
    });

    describe("clearCache", () => {
        it("should flush the database", async () => {
            mockRedis.flushDb.mockResolvedValue("OK");
            const result = await clearCache();
            expect(mockRedis.flushDb).toHaveBeenCalled();
            expect(result).toBe(true);
        });
    });
});
