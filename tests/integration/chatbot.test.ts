import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock database and external services
vi.mock("../../src/db", () => ({
    pool: {
        execute: vi.fn().mockResolvedValue([[]]),
        query: vi.fn().mockResolvedValue([[]]),
    },
}));

vi.mock("../../src/logger", () => ({
    logger: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
    },
}));

vi.mock("../../src/services/wiroService", () => ({
    runChatCompletion: vi.fn().mockResolvedValue(`{
    "intent": "product_search",
    "confidence": 0.95,
    "entities": {
      "query": "iPhone 15 kılıf"
    }
  }`),
}));

// Import chat service
import { chatService, ChatService } from "../../src/chatbot/chatService";
import { intentEngine } from "../../src/chatbot/intentEngine";
import { confirmationService } from "../../src/chatbot/confirmationService";

// ============================================================
// CHAT SERVICE INTEGRATION TESTS
// ============================================================

describe("ChatService Integration", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("processMessage", () => {
        it("should process a simple search query", async () => {
            const result = await chatService.processMessage(
                "test-session-123",
                "user123",
                "iPhone 15 kılıf ara"
            );

            expect(result).toBeDefined();
            expect(result.message).toBeDefined();
            expect(typeof result.message).toBe("string");
        });

        it("should generate new session when not provided", async () => {
            const result = await chatService.processMessage(
                "new-session-" + Date.now(),
                undefined,
                "Merhaba"
            );

            expect(result).toBeDefined();
        });
    });
});

// ============================================================
// INTENT ENGINE INTEGRATION TESTS
// ============================================================

describe("IntentEngine Integration", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should detect mode from keywords", async () => {
        const result = await intentEngine.detectIntent("toptancı ağında ara", "user123");
        expect(result.mode).toBe("TOPTANCI");
    });

    it("should default to BEEKOD mode", async () => {
        const result = await intentEngine.detectIntent("fiyat sorgula", "user123");
        expect(result.mode).toBe("BEEKOD");
    });

    it("should extract entities from message", async () => {
        const result = await intentEngine.detectIntent("8690000000001 ürününün fiyatı ne?", "user123");
        expect(result.entities).toBeDefined();
    });

    it("should return confidence score", async () => {
        const result = await intentEngine.detectIntent("ürün ara iPhone", "user123");
        expect(result.confidence).toBeGreaterThan(0);
        expect(result.confidence).toBeLessThanOrEqual(1);
    });
});

// ============================================================
// CONFIRMATION SERVICE INTEGRATION TESTS
// ============================================================

describe("ConfirmationService Integration", () => {
    beforeEach(() => {
        confirmationService.clearAll();
    });

    describe("Destructive Confirmation", () => {
        it("should create destructive confirmation with 4-digit code", () => {
            const confirmation = confirmationService.createDestructiveConfirmation(
                "session-123",
                "user-456",
                "Toplu fiyat güncelleme",
                { barcodes: ["123", "456"] }
            );

            expect(confirmation.code).toMatch(/^\d{4}$/);
            expect(confirmation.type).toBe("destructive");
            expect(confirmation.action).toBe("Toplu fiyat güncelleme");
        });

        it("should verify correct code", async () => {
            const confirmation = confirmationService.createDestructiveConfirmation(
                "session-123",
                "user-456",
                "Test işlem",
                {}
            );

            const result = await confirmationService.verifyConfirmation(
                "session-123",
                `ONAY ${confirmation.code}`
            );

            expect(result.verified).toBe(true);
            expect(result.confirmation).toBeDefined();
        });

        it("should reject incorrect code", async () => {
            confirmationService.createDestructiveConfirmation(
                "session-123",
                "user-456",
                "Test işlem",
                {}
            );

            const result = await confirmationService.verifyConfirmation(
                "session-123",
                "ONAY 0000"
            );

            expect(result.verified).toBe(false);
        });
    });

    describe("Privacy Confirmation", () => {
        it("should create privacy confirmation with 4-digit code", () => {
            const confirmation = confirmationService.createPrivacyConfirmation(
                "session-123",
                "user-456",
                "Telefon paylaşımı",
                { phone: "05321234567" }
            );

            expect(confirmation.code).toMatch(/^\d{4}$/);
            expect(confirmation.type).toBe("privacy");
        });

        it("should verify with PAYLAŞ prefix", async () => {
            const confirmation = confirmationService.createPrivacyConfirmation(
                "session-123",
                "user-456",
                "Telefon paylaşımı",
                {}
            );

            const result = await confirmationService.verifyConfirmation(
                "session-123",
                `PAYLAŞ ${confirmation.code}`
            );

            expect(result.verified).toBe(true);
        });
    });

    describe("Expiration", () => {
        it("should expire confirmations after timeout", async () => {
            vi.useFakeTimers();

            const confirmation = confirmationService.createDestructiveConfirmation(
                "session-123",
                "user-456",
                "Test",
                {}
            );

            // Advance time by 6 minutes (destructive timeout is 5 min)
            vi.advanceTimersByTime(6 * 60 * 1000);

            const result = await confirmationService.verifyConfirmation(
                "session-123",
                `ONAY ${confirmation.code}`
            );

            expect(result.verified).toBe(false);
            expect(result.error).toContain("süresi dolmuş");

            vi.useRealTimers();
        });
    });
});
