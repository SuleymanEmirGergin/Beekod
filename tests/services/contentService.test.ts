
import { describe, it, expect, beforeEach } from 'vitest';
import { buildSeoContent, buildSocialContent, buildTranslationContent } from '../../src/services/contentService.js';

describe('ContentService', () => {
    const item = {
        name: "Gümüş Kolye",
        price: 150.0,
        currency: "TRY",
        categoryHint: "jewellery",
        toneHint: "premium"
    };

    describe('buildSeoContent', () => {
        it('should generate SEO content in Turkish', () => {
            const result = buildSeoContent(item, 'tr');
            expect(result.text).toBeDefined();
            expect(result.text).toContain("Gümüş Kolye");
            expect(result.category).toBe("jewelry");
            expect(result.tone).toBe("premium");
        });

        it('should generate SEO content in English', () => {
            const result = buildSeoContent(item, 'en');
            expect(result.text).toBeDefined();
            expect(result.text).toContain("Gümüş Kolye");
            expect(result.category).toBe("jewelry");
            expect(result.tone).toBe("premium");
        });
    });

    describe('buildSocialContent', () => {
        it('should generate Social content in Turkish', () => {
            const result = buildSocialContent(item, 'tr');
            expect(result.text).toBeDefined();
            expect(result.text).toContain("Gümüş Kolye");
            expect(result.category).toBe("jewelry");
            expect(result.tone).toBe("premium");
            // Check for hashtags or emojis (premium tone usually has emojis)
        });
    });

    describe('buildTranslationContent', () => {
        it('should format English translation', () => {
            const result = buildTranslationContent("Merhaba", "en", "tr");
            expect(result.text).toContain("Baslik (EN): Merhaba");
        });

        it('should format Turkish translation', () => {
            const result = buildTranslationContent("Hello", "tr", "en");
            expect(result.text).toContain("Turkish title: Hello");
        });
    });
});
