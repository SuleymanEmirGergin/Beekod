import { describe, it, expect } from 'vitest';
import { parseMessage, detectLocale } from '../src/services/nlp.js';

describe('NLP Service', () => {
  describe('Price intents', () => {
    it('should detect price.set intent', () => {
      const messages = [
        'Barkodu 123 olan urunun fiyatini 100 yap',
        '123 barkodlu urunu 100 TL yap',
        'Set price to 100 for barcode 123'
      ];

      messages.forEach(msg => {
        const result = parseMessage(msg, 'tr');
        expect(result.intent).toBe('price.set');
        expect(result.barcode).toBe('123');
        expect(result.amount).toBe(100);
      });
    });

    it('should detect price.increase intent', () => {
      const messages = [
        'Barkodu 123 olan urunun fiyatini %10 artir',
        '123 barkodunu 50 TL artir',
        'Increase price by 10% for barcode 123'
      ];

      messages.forEach(msg => {
        const result = parseMessage(msg, 'tr');
        expect(result.intent).toBe('price.increase');
      });
    });

    it('should detect price.decrease intent', () => {
      const messages = [
        'Barkodu 123 olan urunun fiyatini %5 azalt',
        '123 barkodunu 25 TL dusur',
        'Decrease price by 5% for barcode 123'
      ];

      messages.forEach(msg => {
        const result = parseMessage(msg, 'tr');
        expect(result.intent).toBe('price.decrease');
      });
    });
  });

  describe('Stock intents', () => {
    it('should detect stock.set intent', () => {
      const result = parseMessage('Barkodu 123 olanin stogunu 50 yap', 'tr');
      expect(result.intent).toBe('stock.set');
      expect(result.barcode).toBe('123');
      expect(result.amount).toBe(50);
    });

    it('should detect stock.increase intent', () => {
      const result = parseMessage('123 barkodunun stogunu 20 artir', 'tr');
      expect(result.intent).toBe('stock.increase');
    });

    it('should detect stock.decrease intent', () => {
      const result = parseMessage('123 barkodunun stogunu 10 azalt', 'tr');
      expect(result.intent).toBe('stock.decrease');
    });
  });

  describe('Batch operations', () => {
    it('should detect batch.price.update intent', () => {
      const messages = [
        'Tüm ürünlerin fiyatını %10 artır',
        'All products increase price by 10%',
        'Elektronik kategorisinin fiyatını %5 düşür'
      ];

      messages.forEach(msg => {
        const result = parseMessage(msg, 'tr');
        expect(result.intent).toBe('batch.price.update');
      });
    });

    it('should detect batch.stock.update intent', () => {
      const messages = [
        'Tüm ürünlerin stoğunu 50 artır',
        'Giyim kategorisinin stoğunu 100 yap'
      ];

      messages.forEach(msg => {
        const result = parseMessage(msg, 'tr');
        expect(result.intent).toBe('batch.stock.update');
      });
    });
  });

  describe('Sync intents', () => {
    it('should detect sync.confirm intent', () => {
      const confirmations = ['evet', 'yes', 'tamam', 'ok', 'olur'];

      confirmations.forEach(msg => {
        const result = parseMessage(msg, 'tr');
        expect(result.intent).toBe('sync.confirm');
      });
    });
  });

  describe('Marketplace intents', () => {
    it('should detect marketplace.add intent', () => {
      const result = parseMessage('Barkod 123ü Trendyola ekle', 'tr');
      expect(result.intent).toBe('marketplace.add');
      expect(result.marketplace).toBe('Trendyol');
    });

    it('should detect marketplace.list intent', () => {
      const result = parseMessage('Pazaryerlerini listele', 'tr');
      expect(result.intent).toBe('marketplace.list');
    });
  });

  describe('Helper intents', () => {
    it('should detect help intent', () => {
      const messages = ['yardım', 'help', 'komutlar'];

      messages.forEach(msg => {
        const result = parseMessage(msg, 'tr');
        expect(result.intent).toBe('help');
      });
    });

    it('should detect product.info intent', () => {
      const result = parseMessage('Barkod 123 hakkında bilgi ver', 'tr');
      expect(result.intent).toBe('product.info');
    });
  });

  describe('Number and percentage extraction', () => {
    it('should extract percentages', () => {
      const result = parseMessage('Fiyatı %15 artır', 'tr');
      expect(result.percent).toBe(15);
    });

    it('should extract amounts', () => {
      const result = parseMessage('Stoğu 250 yap', 'tr');
      expect(result.amount).toBe(250);
    });

    it('should extract barcodes', () => {
      const messages = [
        'Barkodu 1234567890 olan ürün',
        'Barcode: ABC123',
        'barkod 999'
      ];

      messages.forEach(msg => {
        const result = parseMessage(msg, 'tr');
        expect(result.barcode).toBeDefined();
      });
    });
  });

  describe('Locale detection', () => {
    it('should detect Turkish', () => {
      expect(detectLocale('merhaba')).toBe('tr');
      expect(detectLocale('fiyat nedir')).toBe('tr');
    });

    it('should detect English', () => {
      expect(detectLocale('hello')).toBe('en');
      expect(detectLocale('what is the price')).toBe('en');
    });

    it('should detect German', () => {
      expect(detectLocale('hallo')).toBe('de');
      expect(detectLocale('preis erhöhen')).toBe('de');
      expect(detectLocale('bestand prüfen')).toBe('de');
    });

    it('should detect French', () => {
      expect(detectLocale('bonjour')).toBe('fr');
      expect(detectLocale('prix augmenter')).toBe('fr');
    });

    it('should detect Spanish', () => {
      expect(detectLocale('hola')).toBe('es');
      expect(detectLocale('precio aumentar')).toBe('es');
    });
  });

  describe('Multi-language Price Intents', () => {
    it('should detect price.set in German', () => {
      const result = parseMessage('setze preis auf 100 für barcode 123', 'de');
      expect(result.intent).toBe('price.set');
      expect(result.amount).toBe(100);
    });

    it('should detect price.increase in French', () => {
      const result = parseMessage('augmenter le prix de 10% pour barcode 123', 'fr');
      expect(result.intent).toBe('price.increase');
    });

    it('should detect price.decrease in Spanish', () => {
      const result = parseMessage('disminuir precio 50 para barcode 123', 'es');
      expect(result.intent).toBe('price.decrease');
    });
  });
});
