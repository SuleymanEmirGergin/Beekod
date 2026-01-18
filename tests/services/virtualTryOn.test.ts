import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateVirtualTryOn, pollTryOnResult } from '../../src/services/virtualTryOnService.js';
import { runVirtualTryOn } from '../../src/services/visualIntelligenceService.js';

vi.mock('../../src/services/visualIntelligenceService.js', () => ({
    runVirtualTryOn: vi.fn(),
}));

// Mock logger
vi.mock('../../src/logger.js', () => ({
    logger: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
    },
}));

describe('Virtual Try-On Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should successfully generate VTO result', async () => {
        const mockUrl = 'http://example.com/result.jpg';
        vi.mocked(runVirtualTryOn).mockResolvedValue(mockUrl);

        const result = await generateVirtualTryOn('human.jpg', 'clothes.jpg');

        expect(result.status).toBe('complete');
        expect(result.imageUrl).toBe(mockUrl);
        expect(runVirtualTryOn).toHaveBeenCalledWith('human.jpg', 'clothes.jpg', 'tops');
    });

    it('should handle errors gracefully', async () => {
        vi.mocked(runVirtualTryOn).mockRejectedValue(new Error('Fal.ai error'));

        const result = await generateVirtualTryOn('human.jpg', 'clothes.jpg');

        expect(result.status).toBe('error');
        expect(result.error).toContain('Fal.ai error');
    });

    it('should return null for deprecated polling', async () => {
        const result = await pollTryOnResult('token-123');
        expect(result).toBeNull();
    });
});
