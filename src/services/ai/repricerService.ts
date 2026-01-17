import { getProductByBarcode, updatePrice } from "../product/productService.js";
import { unifiedMarketplaceSearch } from "../search/unifiedMarketplaceSearch.js";
import { logger } from "../../logger.js";
import { ok, fail, Result } from "../../utils/result.js";
import { PricingStrategy, RepricingConfig } from "../../types.js";

export interface RepricingResult {
  oldPrice: number;
  newPrice: number;
  competitorPrice: number;
  action: 'UPDATED' | 'SKIPPED' | 'ERROR';
  reason: string;
}

// Backward compatibility type (if needed)
export interface BuyBoxAnalysis {
  barcode: string;
  isLowest: boolean;
  suggestedPrice: number;
  strategy: string;
  // Add other fields if strictly necessary for legacy code
}

import { query } from '../../db.js';

export class RepricerService {
  
  async ensureTableExists() {
    const sql = `
      CREATE TABLE IF NOT EXISTS repricing_configs (
        barcode VARCHAR(255) PRIMARY KEY,
        enabled BOOLEAN DEFAULT false,
        min_price DECIMAL(10,2) NOT NULL DEFAULT 0,
        max_price DECIMAL(10,2) NOT NULL DEFAULT 999999,
        strategy VARCHAR(50) DEFAULT 'MANUAL',
        beat_amount DECIMAL(10,2) DEFAULT 1.0,
        target_margin DECIMAL(5,2) DEFAULT 0.15,
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
    try {
      await query(sql);
      logger.info('DB: repricing_configs table checked/created.');
    } catch (e) {
      logger.error('DB: Failed to init repricing_configs table', e);
    }
  }

  
  /**
   * Main entry point to reprice a product
   */
  async executeRepricing(barcode: string, config: RepricingConfig): Promise<Result<RepricingResult>> {
    if (!config.enabled) {
      return ok({ oldPrice: 0, newPrice: 0, competitorPrice: 0, action: 'SKIPPED', reason: 'Repricing disabled' });
    }

    try {
      // 1. Get Product Data
      const productRes = await getProductByBarcode(barcode);
      if (!productRes.ok) return fail(new Error(`Product not found: ${barcode}`));
      const product = productRes.value;

      // 2. Scan Competitors
      const searchRes = await unifiedMarketplaceSearch(product.name);
      const competitors = searchRes.ok ? searchRes.value : [];
      
      // Filter valid competitors (exclude ourselves if possible, assuming price match logic filters close prices)
      // For MVP, we assume competitors list contains other sellers.
      const validCompetitors = competitors.filter(c => c.price > 0);
      
      if (validCompetitors.length === 0) {
         // No competitors: Strategy -> Go to Max Price or Stay?
         // Policy: If PROFIT_MAXIMIZER, go to max. Else stay.
         if (config.strategy === PricingStrategy.PROFIT_MAXIMIZER) {
             const newPrice = config.max_price;
             if (newPrice !== product.price) {
                 await updatePrice(barcode, newPrice);
                 return ok({ oldPrice: product.price, newPrice, competitorPrice: 0, action: 'UPDATED', reason: 'No competitors, maximizing profit' });
             }
         }
         return ok({ oldPrice: product.price, newPrice: product.price, competitorPrice: 0, action: 'SKIPPED', reason: 'No competitors found' });
      }

      // Find lowest competitor
      const lowestCompetitorPrice = Math.min(...validCompetitors.map(c => c.price));

      // 3. Calculate Optimal Price
      let optimalPrice = product.price;

      switch (config.strategy) {
        case PricingStrategy.MATCH_COMPETITOR:
          optimalPrice = lowestCompetitorPrice;
          break;
          
        case PricingStrategy.BEAT_COMPETITOR:
          const beatAmount = config.beat_amount || 1.0; // Default 1 TL
          optimalPrice = lowestCompetitorPrice - beatAmount;
          break;
          
        case PricingStrategy.PROFIT_MAXIMIZER:
          // If we are already the lowest, can we increase price?
          // Check 2nd lowest
          const sortedPrices = validCompetitors.map(c => c.price).sort((a,b) => a - b);
          // If product.price is lower than sortedPrices[0], we are lowest (assuming our price not in list)
          // Actually unified search might include us. Let's assume we want to be just below the *next* lowest if we are the lowest.
          // For simplicity in V1: Set price to lowestCompetitor - epsilon
          optimalPrice = lowestCompetitorPrice - 0.10;
          break;
          
        case PricingStrategy.MANUAL:
          return ok({ oldPrice: product.price, newPrice: product.price, competitorPrice: lowestCompetitorPrice, action: 'SKIPPED', reason: 'Manual strategy' });
      }

      // 4. Guardrails (Safety Check)
      let finalPrice = optimalPrice;
      let reason = `Strategy ${config.strategy} applied`;

      if (finalPrice < config.min_price) {
        finalPrice = config.min_price;
        reason += ` (Capped at Min Price)`;
      }

      if (finalPrice > config.max_price) {
        finalPrice = config.max_price;
        reason += ` (Capped at Max Price)`;
      }

      // 5. Execute Update
      if (Math.abs(finalPrice - product.price) < 0.05) {
         // Change is negligible
         return ok({ oldPrice: product.price, newPrice: product.price, competitorPrice: lowestCompetitorPrice, action: 'SKIPPED', reason: 'Price difference negligible' });
      }

      await updatePrice(barcode, finalPrice);
      
      logger.info("repricer.updated", { barcode, old: product.price, new: finalPrice, reason });

      return ok({
        oldPrice: product.price,
        newPrice: finalPrice,
        competitorPrice: lowestCompetitorPrice,
        action: 'UPDATED',
        reason
      });

    } catch (error) {
      logger.error("repricer.error", { barcode, error });
      return fail(error instanceof Error ? error : new Error(String(error)));
    }
  }
}

export const repricerService = new RepricerService();
