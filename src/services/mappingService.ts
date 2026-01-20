
import path from "path";
import fs from "fs/promises";
import { logger } from "../logger.js";
import { ImportDraft, CategorySuggestion } from "./dto/import.js";

// Basic mapping logic extracted from productImportRoutes.ts
export class MappingService {
    private mappings: any = null;

    async loadMappings() {
        if (this.mappings) return;
        try {
            const mappingsPath = path.resolve(process.cwd(), "data/marketplace-mappings.json");
            const mappingsData = await fs.readFile(mappingsPath, "utf-8");
            this.mappings = JSON.parse(mappingsData);
        } catch (err) {
            logger.warn("mapping_service.load_failed", { err });
            this.mappings = {};
        }
    }

    async mapProduct(hostname: string, attributes: Record<string, any>, category?: string): Promise<{
        attributes: Record<string, string>,
        categorySuggestion?: CategorySuggestion,
        providerKey?: string
    }> {
        await this.loadMappings();

        let providerKey = null;
        for (const [key, config] of Object.entries(this.mappings) as any) {
            if (config.domains.some((d: string) => hostname.includes(d))) {
                providerKey = key;
                break;
            }
        }

        const normalizedAttributes: Record<string, string> = {};
        let categorySuggestion: CategorySuggestion | undefined;

        if (providerKey) {
            const config = this.mappings[providerKey];

            // Map Attributes
            if (attributes) {
                for (const [rawKey, rawValue] of Object.entries(attributes)) {
                    let finalKey = rawKey;

                    if (config.attributeSynonyms) {
                        for (const [canonicalKey, synonyms] of Object.entries(config.attributeSynonyms)) {
                            // @ts-ignore
                            if (synonyms.some(s => s.toLowerCase() === rawKey.toLowerCase())) {
                                finalKey = canonicalKey;
                                break;
                            }
                        }
                    }

                    let finalValue = String(rawValue);
                    if (config.valueNormalizers && config.valueNormalizers[finalKey]) {
                        const normType = config.valueNormalizers[finalKey];
                        if (normType === "gb") {
                            finalValue = finalValue.replace(/gb|gigabyte/gi, "").trim() + " GB";
                        } else if (normType === "inch") {
                            finalValue = finalValue.replace(/inch|inç|"/gi, "").trim() + " inç";
                        } else if (normType === "number") {
                            finalValue = finalValue.replace(/[^0-9]/g, "");
                        }
                    }

                    normalizedAttributes[finalKey] = finalValue;
                }
            }

            // Map Category (Simple Example)
            // In a real DB-backed version, we would look up specific category IDs
            if (category) {
                 categorySuggestion = {
                    id: "unknown", // Needs DB lookup
                    name: category,
                    confidence: 0.5,
                    source: "default"
                };
            }

        } else {
             // Fallback: just copy attributes
             if (attributes) {
                 for (const [k, v] of Object.entries(attributes)) {
                     normalizedAttributes[k] = String(v);
                 }
             }
        }

        return {
            attributes: normalizedAttributes,
            categorySuggestion,
            providerKey: providerKey || "unknown"
        };
    }
}

export const mappingService = new MappingService();
