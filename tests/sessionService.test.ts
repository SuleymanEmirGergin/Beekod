import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setPendingSync, getPendingSync, clearPendingSync } from '../src/services/sessionService.js';

describe('SessionService', () => {
    beforeEach(() => {
        // Clear all sessions before each test
        clearPendingSync('test-req-1');
        clearPendingSync('test-req-2');
    });

    describe('setPendingSync', () => {
        it('should store sync context', () => {
            const requestId = 'test-req-1';
            const context = {
                barcode: '123456',
                price: 100,
                stock: 50
            };

            setPendingSync(requestId, context);
            const retrieved = getPendingSync(requestId);

            expect(retrieved).toBeDefined();
            expect(retrieved?.barcode).toBe('123456');
            expect(retrieved?.price).toBe(100);
            expect(retrieved?.stock).toBe(50);
        });

        it('should overwrite existing context', () => {
            const requestId = 'test-req-1';

            setPendingSync(requestId, { barcode: '111', price: 50, stock: 10 });
            setPendingSync(requestId, { barcode: '222', price: 100, stock: 20 });

            const retrieved = getPendingSync(requestId);
            expect(retrieved?.barcode).toBe('222');
            expect(retrieved?.price).toBe(100);
        });
    });

    describe('getPendingSync', () => {
        it('should return null for non-existent request', () => {
            const retrieved = getPendingSync('non-existent');
            expect(retrieved).toBeNull();
        });

        it('should return null for expired context (TTL 5 min)', async () => {
            const requestId = 'test-req-expired';

            // Mock Date.now to simulate time passing
            const originalNow = Date.now;
            const mockNow = vi.fn();
            global.Date.now = mockNow;

            // Set initial time
            mockNow.mockReturnValue(1000000);
            setPendingSync(requestId, { barcode: '123', price: 100, stock: 50 });

            // Simulate 6 minutes passing (TTL is 5 minutes)
            mockNow.mockReturnValue(1000000 + (6 * 60 * 1000));

            const retrieved = getPendingSync(requestId);
            expect(retrieved).toBeNull();

            // Restore original Date.now
            global.Date.now = originalNow;
        });

        it('should return context within TTL window', () => {
            const requestId = 'test-req-valid';
            const originalNow = Date.now;
            const mockNow = vi.fn();
            global.Date.now = mockNow;

            // Set initial time
            mockNow.mockReturnValue(1000000);
            setPendingSync(requestId, { barcode: '123', price: 100, stock: 50 });

            // Simulate 2 minutes passing (within 5 min TTL)
            mockNow.mockReturnValue(1000000 + (2 * 60 * 1000));

            const retrieved = getPendingSync(requestId);
            expect(retrieved).toBeDefined();
            expect(retrieved?.barcode).toBe('123');

            // Restore
            global.Date.now = originalNow;
        });
    });

    describe('clearPendingSync', () => {
        it('should remove context', () => {
            const requestId = 'test-req-clear';

            setPendingSync(requestId, { barcode: '123', price: 100, stock: 50 });
            expect(getPendingSync(requestId)).toBeDefined();

            clearPendingSync(requestId);
            expect(getPendingSync(requestId)).toBeNull();
        });

        it('should handle clearing non-existent context', () => {
            // Should not throw
            expect(() => clearPendingSync('non-existent')).not.toThrow();
        });
    });

    describe('Multiple sessions', () => {
        it('should handle multiple independent sessions', () => {
            setPendingSync('req-1', { barcode: '111', price: 10, stock: 5 });
            setPendingSync('req-2', { barcode: '222', price: 20, stock: 10 });

            const ctx1 = getPendingSync('req-1');
            const ctx2 = getPendingSync('req-2');

            expect(ctx1?.barcode).toBe('111');
            expect(ctx2?.barcode).toBe('222');

            clearPendingSync('req-1');

            expect(getPendingSync('req-1')).toBeNull();
            expect(getPendingSync('req-2')).toBeDefined();
        });
    });
});
