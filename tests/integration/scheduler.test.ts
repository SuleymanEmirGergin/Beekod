import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => {
  return {
    add: vi.fn(),
    getRepeatableJobs: vi.fn().mockResolvedValue([]),
    removeRepeatableByKey: vi.fn(),
    on: vi.fn(),
    close: vi.fn(),
  };
});

// Mock BullMQ completely
vi.mock('bullmq', () => {
    return {
        Queue: class {
            constructor() {}
            add = mocks.add;
            getRepeatableJobs = mocks.getRepeatableJobs;
            removeRepeatableByKey = mocks.removeRepeatableByKey;
            on = mocks.on;
            close = mocks.close;
        },
        Worker: class {
            constructor() {}
            on = vi.fn();
            close = vi.fn();
        },
    };
});

// Import after mock
import { initRepeatedJobs } from '../../src/services/queue/index.js';

describe('Scheduler Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.getRepeatableJobs.mockResolvedValue([]);
        process.env.SCHEDULER_ENABLED = "true";
        process.env.SCHEDULER_MAINTENANCE_MINUTES = "1440";
        process.env.SCHEDULER_SYNC_MINUTES = "60";
        process.env.SCHEDULER_CACHE_MINUTES = "30";
        process.env.SCHEDULER_AI_AUDIT_MINUTES = "60";
        process.env.SCHEDULER_AI_PRICING_MINUTES = "120";
        process.env.SCHEDULER_AI_HEALTH_MINUTES = "720";
        process.env.SCHEDULER_PRICE_COMPARISON_MINUTES = "360";
    });

    it('should register maintenance and sync jobs', async () => {
        await initRepeatedJobs();

        // Check if queue.add was called for specific jobs
        expect(mocks.add).toHaveBeenCalledWith(
            "maintenance.cleanup",
            expect.objectContaining({ type: "maintenance.cleanup" }),
            expect.objectContaining({ repeat: expect.objectContaining({ every: 1440 * 60 * 1000 }) })
        );

        expect(mocks.add).toHaveBeenCalledWith(
            "marketplace.sync_all",
            expect.objectContaining({ type: "marketplace.sync_all" }),
            expect.objectContaining({ repeat: expect.objectContaining({ every: 60 * 60 * 1000 }) })
        );
    });
});
