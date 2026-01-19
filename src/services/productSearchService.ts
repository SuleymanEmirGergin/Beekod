
import { ProductCard } from "../chatbot/types.js";
import { SearchProviderFactory } from "./providers/SearchProviderFactory.js";

export class ProductSearchService {
    /**
     * Search for products across multiple marketplaces (Uses Factory)
     */
    async searchProducts(query: string): Promise<ProductCard[]> {
        try {
            const provider = SearchProviderFactory.getProvider();
            return await provider.search(query);
        } catch (error) {
            console.error("ProductSearchService Error:", error);
            return [];
        }
    }
}

export const productSearchService = new ProductSearchService();
