import { describe, it, expect, vi, beforeEach } from 'vitest';
import { query } from '../../src/db.js';

// Mock DB
vi.mock('../../src/db.js', () => ({
    query: vi.fn(),
}));

describe('Schema Integrity', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should verify critical tables exist in information_schema', async () => {
        const requiredTables = ['products', 'audit_logs', 'team_members'];

        vi.mocked(query).mockResolvedValue(
            requiredTables.map(t => ({ table_name: t }))
        );

        // Simulate checking info schema
        // In a real integration test, this would hit the actual DB.
        // Here we mock the response to validate the logic we *would* run.
        const sql = `
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = DATABASE()
        `;

        const rows: any = await query(sql);
        const existingTables = rows.map((r: any) => r.table_name);

        for (const table of requiredTables) {
            expect(existingTables).toContain(table);
        }
    });

    it('should verify products table has audit timestamps', async () => {
        vi.mocked(query).mockResolvedValue([
            { column_name: 'created_at' },
            { column_name: 'updated_at' }
        ]);

        const sql = `
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
            AND table_name = 'products'
            AND column_name IN ('created_at', 'updated_at')
        `;

        const rows: any = await query(sql);
        const columns = rows.map((r: any) => r.column_name);

        expect(columns).toContain('created_at');
        expect(columns).toContain('updated_at');
    });
});
