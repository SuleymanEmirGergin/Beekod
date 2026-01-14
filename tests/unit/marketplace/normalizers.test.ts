/**
 * Unit tests for marketplace normalizers
 */

import { describe, it, expect } from 'vitest';
import {
  normalizeNumber,
  normalizePositiveNumber,
  normalizeString,
  normalizeBoolean,
  normalizeImages,
  normalizeAttributes,
  normalizeSizeVariants,
  extractAttributesMap,
  extractAttributesMapAsStrings,
} from '../../../src/services/marketplace/providers/normalizers';

describe('normalizers', () => {
  describe('normalizeNumber', () => {
    it('should return number for valid number', () => {
      expect(normalizeNumber(42)).toBe(42);
      expect(normalizeNumber(3.14)).toBe(3.14);
      expect(normalizeNumber(0)).toBe(0);
      expect(normalizeNumber(-10)).toBe(-10);
    });

    it('should parse valid string to number', () => {
      expect(normalizeNumber('42')).toBe(42);
      expect(normalizeNumber('3.14')).toBe(3.14);
      expect(normalizeNumber('  100  ')).toBe(100);
    });

    it('should return undefined for invalid input', () => {
      expect(normalizeNumber('abc')).toBeUndefined();
      expect(normalizeNumber('')).toBeUndefined();
      expect(normalizeNumber(null)).toBeUndefined();
      expect(normalizeNumber(undefined)).toBeUndefined();
      expect(normalizeNumber({})).toBeUndefined();
      expect(normalizeNumber(NaN)).toBeUndefined();
      expect(normalizeNumber(Infinity)).toBeUndefined();
    });
  });

  describe('normalizePositiveNumber', () => {
    it('should return positive numbers', () => {
      expect(normalizePositiveNumber(42)).toBe(42);
      expect(normalizePositiveNumber('100')).toBe(100);
    });

    it('should return undefined for zero or negative', () => {
      expect(normalizePositiveNumber(0)).toBeUndefined();
      expect(normalizePositiveNumber(-5)).toBeUndefined();
      expect(normalizePositiveNumber('-10')).toBeUndefined();
    });
  });

  describe('normalizeString', () => {
    it('should return trimmed string', () => {
      expect(normalizeString('hello')).toBe('hello');
      expect(normalizeString('  hello  ')).toBe('hello');
    });

    it('should return undefined for empty or non-string', () => {
      expect(normalizeString('')).toBeUndefined();
      expect(normalizeString('   ')).toBeUndefined();
      expect(normalizeString(123)).toBeUndefined();
      expect(normalizeString(null)).toBeUndefined();
    });
  });

  describe('normalizeBoolean', () => {
    it('should return boolean for boolean input', () => {
      expect(normalizeBoolean(true)).toBe(true);
      expect(normalizeBoolean(false)).toBe(false);
    });

    it('should parse truthy strings', () => {
      expect(normalizeBoolean('true')).toBe(true);
      expect(normalizeBoolean('1')).toBe(true);
      expect(normalizeBoolean('yes')).toBe(true);
      expect(normalizeBoolean('active')).toBe(true);
      expect(normalizeBoolean('on_sale')).toBe(true);
    });

    it('should parse falsy strings', () => {
      expect(normalizeBoolean('false')).toBe(false);
      expect(normalizeBoolean('0')).toBe(false);
      expect(normalizeBoolean('no')).toBe(false);
      expect(normalizeBoolean('inactive')).toBe(false);
    });

    it('should return undefined for unknown values', () => {
      expect(normalizeBoolean('maybe')).toBeUndefined();
      expect(normalizeBoolean(123)).toBeUndefined();
      expect(normalizeBoolean(null)).toBeUndefined();
    });
  });

  describe('normalizeImages', () => {
    it('should normalize string array', () => {
      const result = normalizeImages(['url1', 'url2']);
      expect(result).toEqual([{ url: 'url1' }, { url: 'url2' }]);
    });

    it('should normalize object array', () => {
      const result = normalizeImages([{ url: 'url1' }, { url: 'url2' }]);
      expect(result).toEqual([{ url: 'url1' }, { url: 'url2' }]);
    });

    it('should filter empty values', () => {
      const result = normalizeImages(['url1', '', '  ', 'url2']);
      expect(result).toEqual([{ url: 'url1' }, { url: 'url2' }]);
    });

    it('should return undefined for non-array', () => {
      expect(normalizeImages('not-an-array')).toBeUndefined();
      expect(normalizeImages(null)).toBeUndefined();
    });

    it('should return undefined for empty array', () => {
      expect(normalizeImages([])).toBeUndefined();
    });
  });

  describe('normalizeAttributes', () => {
    it('should normalize valid attributes', () => {
      const input = [
        { attributeId: 1, attributeValueId: 100 },
        { attributeId: 2, customAttributeValue: 'custom' },
      ];
      const result = normalizeAttributes(input);
      expect(result).toEqual([
        { attributeId: 1, attributeValueId: 100 },
        { attributeId: 2, customAttributeValue: 'custom' },
      ]);
    });

    it('should filter invalid entries', () => {
      const input = [
        { attributeId: 1 },
        { noAttributeId: true },
        null,
        { attributeId: 0 }, // zero is invalid
      ];
      const result = normalizeAttributes(input);
      expect(result).toEqual([{ attributeId: 1 }]);
    });

    it('should return undefined for non-array', () => {
      expect(normalizeAttributes('not-array')).toBeUndefined();
    });
  });

  describe('normalizeSizeVariants', () => {
    it('should normalize number array', () => {
      const result = normalizeSizeVariants([1, 2, 3]);
      expect(result).toEqual([
        { attributeValueId: 1 },
        { attributeValueId: 2 },
        { attributeValueId: 3 },
      ]);
    });

    it('should normalize object array with labels', () => {
      const input = [
        { attributeValueId: 1, label: 'S' },
        { valueId: 2, name: 'M' },
        { id: 3, value: 'L' },
      ];
      const result = normalizeSizeVariants(input);
      expect(result).toEqual([
        { attributeValueId: 1, label: 'S' },
        { attributeValueId: 2, label: 'M' },
        { attributeValueId: 3, label: 'L' },
      ]);
    });
  });

  describe('extractAttributesMap', () => {
    it('should extract name-value pairs', () => {
      const input = [
        { attributeName: 'Color', attributeValue: 'Red' },
        { attributeName: 'Size', attributeValue: 42 },
      ];
      expect(extractAttributesMap(input)).toEqual({
        Color: 'Red',
        Size: 42,
      });
    });

    it('should return empty object for non-array', () => {
      expect(extractAttributesMap(null)).toEqual({});
      expect(extractAttributesMap('invalid')).toEqual({});
    });
  });

  describe('extractAttributesMapAsStrings', () => {
    it('should convert all values to strings', () => {
      const input = [
        { attributeName: 'Color', attributeValue: 'Red' },
        { attributeName: 'Size', attributeValue: 42 },
      ];
      expect(extractAttributesMapAsStrings(input)).toEqual({
        Color: 'Red',
        Size: '42',
      });
    });
  });
});
