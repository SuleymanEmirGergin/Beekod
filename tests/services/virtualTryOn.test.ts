import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateVirtualTryOn } from '../../src/services/virtualTryOnService.js';
import { runVirtualTryOn } from '../../src/services/visualIntelligenceService.js';

vi.mock('../../src/services/visualIntelligenceService.js', () => ({
    runVirtualTryOn: vi.fn()
}));

vi.mock('../../src/logger.js', () => ({
    logger: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
    },
}));

describe('VirtualTryOnService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should successfully generate virtual try-on', async () => {
        const mockUrl = 'https://result.com/image.jpg';
        vi.mocked(runVirtualTryOn).mockResolvedValue(mockUrl);

        const result = await generateVirtualTryOn('human.jpg', 'clothes.jpg');

        expect(result.status).toBe('complete');
        expect(result.imageUrl).toBe(mockUrl);
        expect(runVirtualTryOn).toHaveBeenCalledWith('human.jpg', 'clothes.jpg', 'tops');
    });

    it('should handle errors gracefully', async () => {
        vi.mocked(runVirtualTryOn).mockRejectedValue(new Error('API Error'));

        const result = await generateVirtualTryOn('human.jpg', 'clothes.jpg');

        expect(result.status).toBe('error');
        expect(result.error).toContain('API Error');
    });
});
