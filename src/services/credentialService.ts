import { logger } from "../logger.js";
import { redactSecrets } from "../ai/audit/redact.js";

export interface CredentialStatus {
    marketplace: string;
    isValid: boolean;
    missingKeys: string[];
    maskedValue: string;
}

export class CredentialService {
    private requiredKeys: Record<string, string[]> = {
        Trendyol: ["TRENDYOL_API_KEY", "TRENDYOL_API_SECRET", "TRENDYOL_MERCHANT_ID"],
        Hepsiburada: ["HEPSIBURADA_API_KEY", "HEPSIBURADA_MERCHANT_ID"],
        N11: ["N11_API_KEY", "N11_API_SECRET"],
        PttAVM: ["PTTAVM_API_KEY", "PTTAVM_SHOP_ID"]
    };

    /**
     * Inspects credentials for a specific marketplace.
     */
    inspect(marketplace: string): CredentialStatus {
        const keys = this.requiredKeys[marketplace] || [];
        const missing = keys.filter(k => !process.env[k]);
        
        return {
            marketplace,
            isValid: missing.length === 0,
            missingKeys: missing,
            maskedValue: missing.length === 0 ? "********" : "INCOMPLETE"
        };
    }

    /**
     * Masks sensitive data in a string or object for logging.
     */
    mask(data: any): any {
        return redactSecrets(data);
    }

    /**
     * Validates if a key looks structurally correct (e.g. length, character set).
     */
    validateFormat(key: string, type: 'uuid' | 'base64' | 'string'): boolean {
        if (!key) return false;
        if (type === 'uuid') {
            return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key);
        }
        if (type === 'base64') {
            return /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(key);
        }
        return key.length > 5;
    }

    /**
     * Mock restore of saveCredentials for IntegrationService compatibility.
     */
    async saveCredentials(userId: number, providerId: string, credentials: Record<string, unknown>): Promise<void> {
        // In a real app, this would encrypt and save to DB
        // For now we'll log it (masked)
        logger.info("credential.save_request", { userId, providerId, keys: Object.keys(credentials) });
    }

    async getCredentials(_userId: number, _providerId: string): Promise<Record<string, unknown>> {
        return {}; // Placeholder
    }
}

export const credentialService = new CredentialService();
