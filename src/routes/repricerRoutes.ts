import express from 'express';
import { repricerService } from '../services/ai/repricerService.js';
import { logger } from '../logger.js';
import { RepricingConfig } from '../types.js';
import { ok, fail } from '../utils/result.js';
import { query } from '../db.js'; // Assuming direct DB access for configs
import { z } from 'zod';

const router = express.Router();

// Schema for config update
const configSchema = z.object({
  enabled: z.boolean(),
  min_price: z.number().min(0),
  max_price: z.number().min(0),
  strategy: z.enum(['MATCH_COMPETITOR', 'BEAT_COMPETITOR', 'PROFIT_MAXIMIZER', 'MANUAL']),
  beat_amount: z.number().optional(),
  target_margin: z.number().optional()
});

/**
 * GET /api/repricer/config/:barcode
 * Get repricing config for a product
 */
router.get('/config/:barcode', async (req, res) => {
  const { barcode } = req.params;
  try {
    // In a real scenario, we query the DB table 'repricing_configs'
    // For now, we'll return a default/mock or implement the SQL simple query if table exists
    // Let's implement the SQL query assuming table exists (we will create migration next)
    
    const sql = `SELECT * FROM repricing_configs WHERE barcode = $1`;
    const result = await query(sql, [barcode]);

    if (result.rows.length === 0) {
      // Return default config
      return res.json(ok({
        barcode,
        enabled: false,
        min_price: 0,
        max_price: 999999,
        strategy: 'MANUAL'
      }));
    }

    res.json(ok(result.rows[0]));
  } catch (error) {
    logger.error('repricer.get_config_error', { barcode, error });
    res.status(500).json(fail(error as Error));
  }
});

/**
 * POST /api/repricer/config/:barcode
 * Upsert repricing config
 */
router.post('/config/:barcode', async (req, res) => {
  const { barcode } = req.params;
  try {
    const body = configSchema.parse(req.body);
    
    // Upsert Logic
    const sql = `
      INSERT INTO repricing_configs (barcode, enabled, min_price, max_price, strategy, beat_amount, target_margin, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (barcode) 
      DO UPDATE SET 
        enabled = EXCLUDED.enabled,
        min_price = EXCLUDED.min_price,
        max_price = EXCLUDED.max_price,
        strategy = EXCLUDED.strategy,
        beat_amount = EXCLUDED.beat_amount,
        target_margin = EXCLUDED.target_margin,
        updated_at = NOW()
      RETURNING *
    `;

    const values = [
      barcode, 
      body.enabled, 
      body.min_price, 
      body.max_price, 
      body.strategy, 
      body.beat_amount || 0, 
      body.target_margin || 0
    ];

    const result = await query(sql, values);
    res.json(ok(result.rows[0]));

  } catch (error) {
    logger.error('repricer.update_config_error', { barcode, error });
    res.status(400).json(fail(error as Error));
  }
});

/**
 * POST /api/repricer/run/:barcode
 * Manually trigger repricer for a product
 */
router.post('/run/:barcode', async (req, res) => {
  const { barcode } = req.params;
  try {
    // 1. Get Config
    const configRes = await query(`SELECT * FROM repricing_configs WHERE barcode = $1`, [barcode]);
    if (configRes.rows.length === 0) {
      return res.status(404).json(fail(new Error("Config not found. Please save config first.")));
    }
    const config = configRes.rows[0] as RepricingConfig; // DB row matches TS interface roughly

    // 2. Execute
    const result = await repricerService.executeRepricing(barcode, config);
    res.json(result);

  } catch (error) {
    logger.error('repricer.run_manual_error', { barcode, error });
    res.status(500).json(fail(error as Error));
  }
});

export const repricerRouter = router;
