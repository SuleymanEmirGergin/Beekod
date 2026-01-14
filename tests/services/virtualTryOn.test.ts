import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateVirtualTryOn, pollTryOnResult } from '../../src/services/virtualTryOnService.js';
import * as WiroService from '../../src/services/wiroService.js';

vi.mock('../../src/services/wiroService.js', () => ({
    runVirtualTryOn: vi.fn(),
    getTaskDetail: vi.fn(),
}));

describe('Virtual Try-On Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should successfully start a VTO task', async () => {
        vi.mocked(WiroService.runVirtualTryOn).mockResolvedValue({
            taskid: 'task-123',
            socketaccesstoken: 'token-123',
            status: 'queued'
        });

        const result = await generateVirtualTryOn('human.jpg', 'clothes.jpg');

        expect(result.taskId).toBe('task-123');
        expect(result.token).toBe('token-123');
        expect(result.status).toBe('queued');
        expect(WiroService.runVirtualTryOn).toHaveBeenCalledWith('human.jpg', 'clothes.jpg');
    });

    it('should poll and return image URL when done', async () => {
        vi.mocked(WiroService.getTaskDetail).mockResolvedValue({
            status: 'done',
            output: ['http://example.com/result.jpg']
        });

        const result = await pollTryOnResult('token-123');

        expect(result).toBe('http://example.com/result.jpg');
        expect(WiroService.getTaskDetail).toHaveBeenCalledWith('token-123');
    });

    it('should return null when polling fails or is not done', async () => {
        vi.mocked(WiroService.getTaskDetail).mockResolvedValue({
            status: 'processing'
        });

        const result = await pollTryOnResult('token-123');

        expect(result).toBeNull();
    });
});
