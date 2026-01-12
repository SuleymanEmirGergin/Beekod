/**
 * Action Schema Tests
 * 
 * Tests for Zod schema validation
 */

import { describe, it, expect } from 'vitest';
import { 
  actionPlanSchema, 
  toolCallSchema,
  responseStyleSchema 
} from '../../../src/ai/schemas/action.schema.js';

describe('Action Schema', () => {
  describe('toolCallSchema', () => {
    it('should validate valid tool call', () => {
      const validToolCall = {
        tool: 'getOrderById',
        args: { orderId: '12345' }
      };

      const result = toolCallSchema.parse(validToolCall);
      expect(result.tool).toBe('getOrderById');
      expect(result.args).toEqual({ orderId: '12345' });
    });

    it('should reject empty tool name', () => {
      const invalidToolCall = {
        tool: '',
        args: {}
      };

      expect(() => toolCallSchema.parse(invalidToolCall)).toThrow();
    });

    it('should default args to empty object', () => {
      const toolCallWithoutArgs = {
        tool: 'listRecentOrders'
      };

      const result = toolCallSchema.parse(toolCallWithoutArgs);
      expect(result.args).toEqual({});
    });
  });

  describe('responseStyleSchema', () => {
    it('should accept valid styles', () => {
      const validStyles = ['concise', 'detailed', 'friendly', 'professional'];
      
      validStyles.forEach(style => {
        expect(responseStyleSchema.parse(style)).toBe(style);
      });
    });

    it('should reject invalid style', () => {
      expect(() => responseStyleSchema.parse('invalid')).toThrow();
    });
  });

  describe('actionPlanSchema', () => {
    it('should validate complete action plan', () => {
      const validPlan = {
        intent: 'get order details',
        toolCalls: [
          { tool: 'getOrderById', args: { orderId: '123' } }
        ],
        responseStyle: 'friendly',
        confidence: 0.95
      };

      const result = actionPlanSchema.parse(validPlan);
      expect(result.intent).toBe('get order details');
      expect(result.toolCalls).toHaveLength(1);
      expect(result.responseStyle).toBe('friendly');
      expect(result.confidence).toBe(0.95);
    });

    it('should validate plan with empty toolCalls', () => {
      const planWithoutTools = {
        intent: 'greeting',
        toolCalls: [],
        responseStyle: 'friendly'
      };

      const result = actionPlanSchema.parse(planWithoutTools);
      expect(result.toolCalls).toEqual([]);
    });

    it('should default responseStyle to friendly', () => {
      const minimalPlan = {
        intent: 'test',
        toolCalls: []
      };

      const result = actionPlanSchema.parse(minimalPlan);
      expect(result.responseStyle).toBe('friendly');
    });

    it('should reject empty intent', () => {
      const invalidPlan = {
        intent: '',
        toolCalls: [],
        responseStyle: 'friendly'
      };

      expect(() => actionPlanSchema.parse(invalidPlan)).toThrow();
    });

    it('should validate confidence range', () => {
      expect(() => actionPlanSchema.parse({
        intent: 'test',
        toolCalls: [],
        confidence: 1.5 // > 1.0
      })).toThrow();

      expect(() => actionPlanSchema.parse({
        intent: 'test',
        toolCalls: [],
        confidence: -0.1 // < 0
      })).toThrow();
    });
  });
});
