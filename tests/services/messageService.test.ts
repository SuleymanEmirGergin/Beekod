
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { messageService } from '../../src/services/messageService.js';

// Mock the pool
const mockQuery = vi.fn();
vi.mock('../../src/db.js', () => ({
    pool: {
        query: (...args: any[]) => mockQuery(...args),
    },
}));

describe('MessageService', () => {
    beforeEach(() => {
        mockQuery.mockReset();
    });

    describe('sendMessage', () => {
        it('should insert message and return id', async () => {
            // pool.query returns [result, fields] and code does: const [result] = await pool.query(...)
            // So result should be: { insertId: 123 }
            mockQuery.mockResolvedValueOnce([{ insertId: 123 }, null]);
            const id = await messageService.sendMessage(1, 2, 'hello');
            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO messages'),
                [1, 2, 'hello']
            );
            expect(id).toBe(123);
        });

        it('should throw error if content is empty', async () => {
            await expect(messageService.sendMessage(1, 2, '')).rejects.toThrow('Message content cannot be empty');
            expect(mockQuery).not.toHaveBeenCalled();
        });
    });

    describe('getConversation', () => {
        it('should fetch messages between two users', async () => {
            const mockRows = [
                { id: 1, content: 'hi', created_at: new Date('2023-01-01T10:00:00Z') },
                { id: 2, content: 'hello', created_at: new Date('2023-01-01T10:01:00Z') }
            ];
            // pool.query returns [rows, fields], code does: const [rows] = await pool.query(...)
            mockQuery.mockResolvedValueOnce([mockRows, null]);

            const result = await messageService.getConversation(1, 2);

            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining('SELECT m.*'),
                [1, 2, 2, 1, 50, 0]
            );
            expect(result).toHaveLength(2);
        });
    });

    describe('markAsRead', () => {
        it('should update messages status', async () => {
            mockQuery.mockResolvedValueOnce([{ affectedRows: 5 }, null]);
            await messageService.markAsRead(1, 2);
            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE messages SET is_read = 1'),
                [1, 2]
            );
        });
    });

    describe('getUnreadCount', () => {
        it('should return count of unread messages', async () => {
            // pool.query returns [rows, fields], code does: const [rows] = ...  then rows[0].count
            mockQuery.mockResolvedValueOnce([[{ count: 5 }], null]);
            const count = await messageService.getUnreadCount(1);
            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining('SELECT COUNT(*)'),
                [1]
            );
            expect(count).toBe(5);
        });
    });
});
