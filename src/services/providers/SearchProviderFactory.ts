
import { ISearchProvider } from "../interfaces.js";
import { MockSearchProvider } from "./search/MockSearchProvider.js";
import { LiveSearchProvider } from "./search/LiveSearchProvider.js";

export class SearchProviderFactory {
    static getProvider(): ISearchProvider {
        const useMock = process.env.USE_MOCK_SEARCH !== 'false'; // Default to true if not set

        if (useMock) {
            return new MockSearchProvider();
        }

        return new LiveSearchProvider();
    }
}
