
import { IImportProvider } from "../interfaces.js";
import { MockImportProvider } from "./import/MockImportProvider.js";

// TODO: Implement LiveImportProvider in Phase 2
// import { LiveImportProvider } from "./import/LiveImportProvider.js";

export class ImportProviderFactory {
    static getProvider(): IImportProvider {
        const useMock = process.env.USE_MOCK_IMPORT !== 'false'; // Default to true if not set

        if (useMock) {
            return new MockImportProvider();
        }

        // Return LiveImportProvider when implemented
        // return new LiveImportProvider();

        throw new Error("LiveImportProvider not yet implemented. Set USE_MOCK_IMPORT=true.");
    }
}
