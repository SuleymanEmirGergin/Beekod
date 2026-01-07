import { query } from "../db.js";
import { logger } from "../logger.js";
import crypto from "crypto";

// For demo purposes, we use a simple encryption. In production, use a proper KMS/Vault.
const ENCRYPTION_KEY = process.env.CREDENTIALS_ENCRYPTION_KEY || "fallback-secret-key-32-chars-long!!";
const ALGORITHM = "aes-256-cbc";

interface Credentials {
    [key: string]: any;
}

export const credentialService = {
    async saveCredentials(userId: number, marketplace: string, credentials: Credentials) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
        let encrypted = cipher.update(JSON.stringify(credentials), "utf8", "hex");
        encrypted += cipher.final("hex");

        const payload = JSON.stringify({
            iv: iv.toString("hex"),
            data: encrypted
        });

        await query(
            "INSERT INTO marketplace_credentials (user_id, marketplace, credentials_json, is_active) VALUES (?, ?, ?, 1) ON DUPLICATE KEY UPDATE credentials_json = ?, is_active = 1",
            [userId, marketplace, payload, payload]
        );
    },

    async getCredentials(userId: number, marketplace: string): Promise<Credentials | null> {
        const rows = await query<any[]>(
            "SELECT credentials_json FROM marketplace_credentials WHERE user_id = ? AND marketplace = ? AND is_active = 1",
            [userId, marketplace]
        );

        if (!rows.length) return null;

        try {
            const { iv, data } = JSON.parse(rows[0].credentials_json);
            const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), Buffer.from(iv, "hex"));
            let decrypted = decipher.update(data, "hex", "utf8");
            decrypted += decipher.final("utf8");
            return JSON.parse(decrypted);
        } catch (error) {
            logger.error("credential_service.decryption_failed", { userId, marketplace, err: error });
            return null;
        }
    }
};
