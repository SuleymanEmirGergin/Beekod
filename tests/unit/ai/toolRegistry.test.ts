/**
 * Tool Registry Tests
 * 
 * Tests for tool registration and routing
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  getAvailableTools, 
  getTool, 
  hasTool,
  executeTool,
  ToolContext 
} from '../../../src/ai/tools/index.js';

vi.mock('../../../src/db.js', () => ({
  query: vi.fn().mockResolvedValue([]),
}));

// Mock context for tests
const mockContext: ToolContext = {
  tenantId: 'test-tenant',
  userId: 'test-user',
  requestId: 'test-request-123',
  locale: 'tr'
};

describe('Tool Registry', () => {
  describe('getAvailableTools', () => {
    it('should return array of tool names', () => {
      const tools = getAvailableTools();
      
      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBeGreaterThan(0);
    });

    it('should include expected tools', () => {
      const tools = getAvailableTools();
      
      expect(tools).toContain('getOrderById');
      expect(tools).toContain('listRecentOrders');
      expect(tools).toContain('searchCheapestProduct');
      expect(tools).toContain('draftCustomerReply');
      expect(tools).toContain('analyticsQuery');
    });
  });

  describe('getTool', () => {
    it('should return tool definition for valid tool', () => {
      const tool = getTool('getOrderById');
      
      expect(tool).toBeDefined();
      expect(tool?.name).toBe('getOrderById');
      expect(tool?.description).toBeTruthy();
      expect(typeof tool?.execute).toBe('function');
    });

    it('should return undefined for unknown tool', () => {
      const tool = getTool('nonExistentTool');
      
      expect(tool).toBeUndefined();
    });
  });

  describe('hasTool', () => {
    it('should return true for registered tools', () => {
      expect(hasTool('getOrderById')).toBe(true);
      expect(hasTool('listRecentOrders')).toBe(true);
    });

    it('should return false for unregistered tools', () => {
      expect(hasTool('fakeToolName')).toBe(false);
      expect(hasTool('')).toBe(false);
    });
  });

  describe('executeTool', () => {
    it('should return error for unknown tool', async () => {
      const result = await executeTool('unknownTool', {}, mockContext);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Bilinmeyen araç');
    });

    it('should return error for invalid arguments', async () => {
      // getOrderById requires orderId
      const result = await executeTool('getOrderById', {}, mockContext);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('should include execution time in meta', async () => {
      const result = await executeTool('getOrderById', { orderId: '123' }, mockContext);
      
      expect(result.meta).toBeDefined();
      expect(typeof result.meta?.executionTimeMs).toBe('number');
      expect(result.meta?.executionTimeMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('analyticsQuery tool', () => {
    it('should only accept allowlisted query types', async () => {
      const validTypes = ['daily_sales', 'top_products', 'revenue_trend', 'order_stats', 'stock_alerts'];
      
      for (const queryType of validTypes) {
        const result = await executeTool('analyticsQuery', { queryType }, mockContext);
        if (result.error) {
          expect(result.error).not.toContain('Bilinmeyen sorgu tipi');
        }
        expect(result.success).toBe(true);
      }
    });

    it('should reject arbitrary query types', async () => {
      const result = await executeTool('analyticsQuery', { 
        queryType: 'DROP TABLE users' 
      }, mockContext);
      
      expect(result.success).toBe(false);
    });
  });
});

describe('Tool Validators', () => {
  describe('getOrderByIdArgsSchema', () => {
    it('should accept string orderId', async () => {
      const { getOrderByIdArgsSchema } = await import('../../../src/ai/tools/validators.js');
      
      const result = getOrderByIdArgsSchema.parse({ orderId: '12345' });
      expect(result.orderId).toBe('12345');
    });

    it('should convert number orderId to string', async () => {
      const { getOrderByIdArgsSchema } = await import('../../../src/ai/tools/validators.js');
      
      const result = getOrderByIdArgsSchema.parse({ orderId: 12345 });
      expect(result.orderId).toBe('12345');
    });
  });

  describe('listRecentOrdersArgsSchema', () => {
    it('should apply defaults', async () => {
      const { listRecentOrdersArgsSchema } = await import('../../../src/ai/tools/validators.js');
      
      const result = listRecentOrdersArgsSchema.parse({});
      expect(result.days).toBe(7);
      expect(result.limit).toBe(20);
    });

    it('should reject invalid days', async () => {
      const { listRecentOrdersArgsSchema } = await import('../../../src/ai/tools/validators.js');
      
      expect(() => listRecentOrdersArgsSchema.parse({ days: 0 })).toThrow();
      expect(() => listRecentOrdersArgsSchema.parse({ days: 100 })).toThrow();
    });
  });

  describe('analyticsQueryArgsSchema', () => {
    it('should only accept allowlisted query types', async () => {
      const { analyticsQueryArgsSchema } = await import('../../../src/ai/tools/validators.js');
      
      // Valid
      expect(() => analyticsQueryArgsSchema.parse({ queryType: 'daily_sales' })).not.toThrow();
      expect(() => analyticsQueryArgsSchema.parse({ queryType: 'top_products' })).not.toThrow();
      
      // Invalid - SQL injection attempt
      expect(() => analyticsQueryArgsSchema.parse({ queryType: 'SELECT * FROM users' })).toThrow();
    });
  });
});
