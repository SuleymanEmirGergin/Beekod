
import { ISearchProvider } from "../interfaces.js";
import { MockSearchProvider } from "./search/MockSearchProvider.js";

// TODO: Implement LiveSearchProvider in Phase 1
// import { LiveSearchProvider } from "./search/LiveSearchProvider.js";

export class SearchProviderFactory {
    static getProvider(): ISearchProvider {
        const useMock = process.env.USE_MOCK_SEARCH !== 'false'; // Default to true if not set

        if (useMock) {
            return new MockSearchProvider();
        }

        // Return LiveSearchProvider when implemented
        // return new LiveSearchProvider();

        throw new Error("LiveSearchProvider not yet implemented. Set USE_MOCK_SEARCH=true.");
    }
}
