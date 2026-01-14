import { pool } from "../db.js";
import { logger } from "../logger.js";
import { runChatCompletion } from "./geminiService.js";

/**
 * Semantic Search Service
 * 
 * Ürün açıklamalarından vector embeddings oluşturarak
 * benzerlik tabanlı arama yapar
 */
export class SemanticSearchService {
    /**
     * Ürün için embedding oluştur ve kaydet
     */
    async generateAndStoreEmbedding(barcode: string, productName: string, description?: string): Promise<void> {
        try {
            const textToEmbed = `${productName} ${description || ""}`.trim();

            // Generate embedding using Gemini
            const embedding = await this.generateEmbedding(textToEmbed);

            if (!embedding || embedding.length === 0) {
                logger.warn("semanticSearch.no_embedding", { barcode });
                return;
            }

            // Store embedding in database
            await pool.execute(
                `INSERT INTO product_embeddings (barcode, embedding, text_content, updated_at)
         VALUES (?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE 
           embedding = VALUES(embedding),
           text_content = VALUES(text_content),
           updated_at = NOW()`,
                [barcode, JSON.stringify(embedding), textToEmbed]
            );

            logger.info("semanticSearch.embedding_stored", { barcode, dimensions: embedding.length });

        } catch (error) {
            logger.error("semanticSearch.generate_failed", { error, barcode });
        }
    }

    /**
     * Semantik arama yap
     */
    async search(query: string, limit = 20): Promise<any[]> {
        try {
            logger.info("semanticSearch.searching", { query, limit });

            // Generate embedding for query
            const queryEmbedding = await this.generateEmbedding(query);

            if (!queryEmbedding || queryEmbedding.length === 0) {
                logger.warn("semanticSearch.no_query_embedding", { query });
                return [];
            }

            // Get all product embeddings
            const [rows] = await pool.execute(
                `SELECT pe.barcode, pe.embedding, pe.text_content, p.name, p.price, p.stock
         FROM product_embeddings pe
         LEFT JOIN products p ON p.barcode = pe.barcode
         LIMIT 1000`
            );

            const products = rows as any[];

            if (products.length === 0) {
                return [];
            }

            // Calculate similarities
            const scored = products.map(p => {
                const productEmbedding = JSON.parse(p.embedding);
                const similarity = this.cosineSimilarity(queryEmbedding, productEmbedding);
                return {
                    barcode: p.barcode,
                    name: p.name,
                    price: p.price,
                    stock: p.stock,
                    textContent: p.text_content,
                    similarity,
                };
            });

            // Sort by similarity and return top results
            const results = scored
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, limit)
                .filter(r => r.similarity > 0.3); // Minimum threshold

            logger.info("semanticSearch.results", {
                query,
                resultCount: results.length,
                topSimilarity: results[0]?.similarity
            });

            return results;

        } catch (error) {
            logger.error("semanticSearch.search_failed", { error, query });
            return [];
        }
    }

    /**
     * Benzer ürünleri bul
     */
    async findSimilar(barcode: string, limit = 10): Promise<any[]> {
        try {
            // Get source product embedding
            const [rows] = await pool.execute(
                `SELECT embedding, text_content FROM product_embeddings WHERE barcode = ?`,
                [barcode]
            );

            const products = rows as any[];
            if (products.length === 0) {
                return [];
            }

            const sourceEmbedding = JSON.parse(products[0].embedding);

            // Get all other embeddings
            const [allRows] = await pool.execute(
                `SELECT pe.barcode, pe.embedding, p.name, p.price, p.stock
         FROM product_embeddings pe
         LEFT JOIN products p ON p.barcode = pe.barcode
         WHERE pe.barcode != ?
         LIMIT 500`,
                [barcode]
            );

            const otherProducts = allRows as any[];

            // Calculate similarities
            const scored = otherProducts.map(p => {
                const productEmbedding = JSON.parse(p.embedding);
                const similarity = this.cosineSimilarity(sourceEmbedding, productEmbedding);
                return {
                    barcode: p.barcode,
                    name: p.name,
                    price: p.price,
                    stock: p.stock,
                    similarity,
                };
            });

            return scored
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, limit)
                .filter(r => r.similarity > 0.5);

        } catch (error) {
            logger.error("semanticSearch.findSimilar_failed", { error, barcode });
            return [];
        }
    }

    /**
     * Generate embedding using Gemini
     * In production, use text-embedding-004 directly
     * For now, we use a simplified approach with Gemini
     */
    private async generateEmbedding(text: string): Promise<number[]> {
        try {
            // Use Gemini to generate a semantic representation
            // This is a workaround - ideally use text-embedding-004 API directly
            const prompt = `Aşağıdaki metin için 64 boyutlu bir embedding vektörü oluştur.
Her değer -1 ile 1 arasında float olsun.
Sadece JSON array döndür, başka hiçbir şey yazma.

Metin: "${text.substring(0, 500)}"

Örnek format: [0.1, -0.2, 0.5, ...]`;

            const response = await runChatCompletion(prompt, {
                thinkingLevel: "low",
                temperature: 0.1,
                maxOutputTokens: 500,
            });

            // Parse embedding from response
            const match = response.match(/\[[\d.,\s\-e]+\]/);
            if (!match) {
                // Fallback: generate simple hash-based embedding
                return this.hashBasedEmbedding(text);
            }

            return JSON.parse(match[0]);

        } catch (error) {
            logger.error("semanticSearch.embedding_generation_failed", { error });
            // Fallback to hash-based embedding
            return this.hashBasedEmbedding(text);
        }
    }

    /**
     * Hash-based embedding fallback
     * Simple but deterministic embedding based on text characteristics
     */
    private hashBasedEmbedding(text: string): number[] {
        const embedding: number[] = [];
        const words = text.toLowerCase().split(/\s+/);

        for (let i = 0; i < 64; i++) {
            let value = 0;
            for (let j = 0; j < words.length; j++) {
                const word = words[j];
                for (let k = 0; k < word.length; k++) {
                    value += Math.sin((word.charCodeAt(k) * (i + 1) * (j + 1)) / 100);
                }
            }
            embedding.push(Math.tanh(value / (words.length + 1)));
        }

        return embedding;
    }

    /**
     * Cosine similarity between two vectors
     */
    private cosineSimilarity(a: number[], b: number[]): number {
        if (a.length !== b.length) {
            // Pad shorter array
            const maxLen = Math.max(a.length, b.length);
            while (a.length < maxLen) a.push(0);
            while (b.length < maxLen) b.push(0);
        }

        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }

        if (normA === 0 || normB === 0) return 0;

        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    /**
     * Batch update embeddings for all products
     */
    async updateAllEmbeddings(): Promise<{ updated: number; failed: number }> {
        let updated = 0;
        let failed = 0;

        try {
            const [rows] = await pool.execute(
                `SELECT barcode, name, description FROM products LIMIT 1000`
            );

            const products = rows as any[];

            for (const product of products) {
                try {
                    await this.generateAndStoreEmbedding(
                        product.barcode,
                        product.name,
                        product.description
                    );
                    updated++;
                } catch {
                    failed++;
                }
            }

            logger.info("semanticSearch.batch_update_complete", { updated, failed });

        } catch (error) {
            logger.error("semanticSearch.batch_update_failed", { error });
        }

        return { updated, failed };
    }
}

// Singleton instance
export const semanticSearchService = new SemanticSearchService();
