
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchNetwork } from '../../src/services/networkService.js';

// Mock the pool
const mockQuery = vi.fn();
vi.mock('../../src/db.js', () => ({
    pool: {
        query: (...args: any[]) => mockQuery(...args),
    },
}));

describe('NetworkService Integration', () => {
    beforeEach(() => {
        mockQuery.mockReset();
    });

    describe('searchNetwork', () => {
        it('should return wholesalers who have the product', async () => {
            // Mock result (one query)
            const mockResult = [
                {
                    wholesalerName: 'Wholesaler A',
                    phone: '123',
                    email: 'a@a.com',
                    stock: 10,
                    price: 100,
                    currency: 'TL'
                }
            ];
            mockQuery.mockResolvedValueOnce([mockResult]);

            const result = await searchNetwork('123456');

            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining('SELECT w.name'),
                ['123456']
            );

            expect(result).toHaveLength(1);
            expect(result[0].wholesalerName).toBe('Wholesaler A');
        });

        it('should return empty array if no one else has it', async () => {
            mockQuery.mockResolvedValueOnce([[]]); // Empty result

            const result = await searchNetwork('999');
            expect(result).toHaveLength(0);
        });

        it('should check for is_visible = 1 in query', async () => {
            mockQuery.mockResolvedValueOnce([[]]);

            await searchNetwork('123456');

            // Verify SQL query structure contains filtering logic
            expect(mockQuery).toHaveBeenLastCalledWith(
                expect.stringContaining('w.is_visible = 1'),
                expect.anything()
            );
        });
    });
});
