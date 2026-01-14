/**
 * Unit tests for Analytics Service Modules
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock DB
const mockQuery = vi.fn();
vi.mock('../../../src/db', () => ({
  query: (sql: string, params: any[]) => mockQuery(sql, params)
}));

describe('Analytics Modules', () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  describe('Dashboard Service', () => {
    it('should get dashboard stats correctly', async () => {
      const { getDashboardStats } = await import('../../../src/services/analytics/modules/dashboardService');
      
      // Mock sequential query responses
      mockQuery
        .mockResolvedValueOnce([{ c: 100 }]) // products
        .mockResolvedValueOnce([{ s: 5000 }]) // revenue
        .mockResolvedValueOnce([{ c: 5 }]) // low stock
        .mockResolvedValueOnce([{ name: 'Test', units: 10, revenue: 1000 }]) // top performers
        .mockResolvedValueOnce([{ category: 'A', count: 10, revenue: 100 }]) // breakdown
        .mockResolvedValueOnce([{ date: '2023-01-01', sales: 1, revenue: 100 }]); // recent
        
      const stats = await getDashboardStats();
      
      expect(stats.totalProducts).toBe(100);
      expect(stats.totalRevenue).toBe(5000);
      expect(stats.lowStockCount).toBe(5);
      expect(stats.topPerformers.length).toBe(1);
    });

    it('should handle errors gracefully', async () => {
      const { getDashboardStats } = await import('../../../src/services/analytics/modules/dashboardService');
      
      mockQuery.mockRejectedValue(new Error('DB Error'));
      
      const stats = await getDashboardStats();
      
      expect(stats.totalProducts).toBe(0);
      expect(stats.topPerformers).toEqual([]);
    });

    it('should get sales summary', async () => {
      const { getSalesSummary } = await import('../../../src/services/analytics/modules/dashboardService');
      
      mockQuery.mockResolvedValueOnce([{ orders: 10, units: 20, revenue: 1000 }]);
      
      const summary = await getSalesSummary(30);
      
      expect(summary.orders).toBe(10);
      expect(summary.units).toBe(20);
      expect(summary.revenue).toBe(1000);
    });
  });

  describe('Inventory Analytics Service', () => {
    it('should get inventory health', async () => {
      const { getInventoryHealth } = await import('../../../src/services/analytics/modules/inventoryAnalyticsService');
      
      mockQuery.mockResolvedValueOnce([{ 
        critical: 1, outOfStock: 2, low: 3, normal: 4, overstocked: 5 
      }]);
      
      const health = await getInventoryHealth();
      
      expect(health.critical).toBe(1);
      expect(health.outOfStock).toBe(2);
      expect(health.overstocked).toBe(5);
    });

    it('should get inventory forecast', async () => {
      const { getInventoryForecast } = await import('../../../src/services/analytics/modules/inventoryAnalyticsService');
      
      mockQuery.mockResolvedValueOnce([{ 
        barcode: '123', product_name: 'Test', days_remaining: 10 
      }]);
      
      const forecast = await getInventoryForecast();
      
      expect(forecast.length).toBe(1);
      expect(forecast[0].days_remaining).toBe(10);
    });
  });
});
