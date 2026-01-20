
import { IImportProvider } from "../interfaces.js";
import { MockImportProvider } from "./import/MockImportProvider.js";
import { LiveImportProvider } from "./import/LiveImportProvider.js";

export class ImportProviderFactory {
    static getProvider(): IImportProvider {
        const useMock = process.env.USE_MOCK_IMPORT !== 'false'; // Default to true if not set

        if (useMock) {
            return new MockImportProvider();
        }

        return new LiveImportProvider();
    }
}
