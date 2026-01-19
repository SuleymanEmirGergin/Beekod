
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SearchProviderFactory } from "../../../../src/services/providers/SearchProviderFactory";
import { MockSearchProvider } from "../../../../src/services/providers/search/MockSearchProvider";
import { ImportProviderFactory } from "../../../../src/services/providers/ImportProviderFactory";
import { MockImportProvider } from "../../../../src/services/providers/import/MockImportProvider";

describe("Provider Factories", () => {
    const originalEnv = process.env;

    beforeEach(() => {
        vi.resetModules();
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    it("SearchProviderFactory returns MockSearchProvider by default", () => {
        delete process.env.USE_MOCK_SEARCH;
        const provider = SearchProviderFactory.getProvider();
        expect(provider).toBeInstanceOf(MockSearchProvider);
    });

    it("SearchProviderFactory returns MockSearchProvider when explicitly true", () => {
        process.env.USE_MOCK_SEARCH = 'true';
        const provider = SearchProviderFactory.getProvider();
        expect(provider).toBeInstanceOf(MockSearchProvider);
    });

    it("SearchProviderFactory throws when set to false (Live not implemented yet)", () => {
        process.env.USE_MOCK_SEARCH = 'false';
        expect(() => SearchProviderFactory.getProvider()).toThrowError(/not yet implemented/);
    });

    it("ImportProviderFactory returns MockImportProvider by default", () => {
        delete process.env.USE_MOCK_IMPORT;
        const provider = ImportProviderFactory.getProvider();
        expect(provider).toBeInstanceOf(MockImportProvider);
    });

    it("ImportProviderFactory returns MockImportProvider when explicitly true", () => {
        process.env.USE_MOCK_IMPORT = 'true';
        const provider = ImportProviderFactory.getProvider();
        expect(provider).toBeInstanceOf(MockImportProvider);
    });

    it("ImportProviderFactory throws when set to false (Live not implemented yet)", () => {
        process.env.USE_MOCK_IMPORT = 'false';
        expect(() => ImportProviderFactory.getProvider()).toThrowError(/not yet implemented/);
    });
});
