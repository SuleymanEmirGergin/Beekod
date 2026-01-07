import { logger } from '../logger.js';
import { inventoryService } from './inventoryService.js';

export interface RepricerConfig {
    barcode: string;
    minPrice: number;
    maxPrice: number;
    targetPosition: 'lowest' | 'average' | 'buybox';
    enabled: boolean;
}

// In-memory store for repricer configs (would be DB in production)
const repricerConfigs: Map<string, RepricerConfig> = new Map();

export const repricerService = {
    /**
     * Save/Update repricer config
     */
    async saveConfig(config: RepricerConfig): Promise<void> {
        logger.info('repricerService.saveConfig', { barcode: config.barcode });
        repricerConfigs.set(config.barcode, config);
    },

    /**
     * Get repricer config
     */
    async getConfig(barcode: string): Promise<RepricerConfig | undefined> {
        return repricerConfigs.get(barcode);
    },

    /**
     * Simulated Repricer Job
     * This would run every hour to check competitor prices
     */
    async runRepricerCycle(): Promise<void> {
        logger.info('repricerService.runRepricerCycle', { activeConfigs: repricerConfigs.size });

        for (const [barcode, config] of repricerConfigs) {
            if (!config.enabled) continue;

            // Simulate finding a competitor price
            const competitorPrice = 100 + Math.random() * 50;
            let myNewPrice = config.minPrice;

            if (config.targetPosition === 'lowest') {
                myNewPrice = Math.max(config.minPrice, competitorPrice - 0.5);
            } else if (config.targetPosition === 'average') {
                myNewPrice = (config.minPrice + config.maxPrice) / 2;
            }

            // Cap at max price
            myNewPrice = Math.min(myNewPrice, config.maxPrice);

            logger.info('repricerService.adjustingPrice', {
                barcode,
                competitorPrice,
                myNewPrice
            });

            // Update on all marketplaces (simulation uses hardcoded marketplaces for now)
            await inventoryService.updateBulkPrice(barcode, myNewPrice, ['Trendyol', 'Hepsiburada', 'N11']);
        }
    }
};
