import { pool } from "../db.js";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { logger } from "../logger.js";

export interface CanonicalProduct {
    id?: number;
    gtin?: string;
    title: string;
    description?: string;
    brand?: string;
    attributes?: Record<string, any>;
    images?: string[];
    source_url?: string;
}

export class CanonicalProductService {

    async create(product: CanonicalProduct): Promise<number> {
        try {
            const [result] = await pool.execute<ResultSetHeader>(
                `INSERT INTO canonical_products 
        (gtin, title, description, brand, attributes_json, images_json, source_url) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    product.gtin || null,
                    product.title,
                    product.description || "",
                    product.brand || "",
                    JSON.stringify(product.attributes || {}),
                    JSON.stringify(product.images || []),
                    product.source_url || null
                ]
            );
            return result.insertId;
        } catch (error) {
            logger.error("canonical_product.create_failed", { err: error });
            throw error;
        }
    }

    async findById(id: number): Promise<CanonicalProduct | null> {
        const [rows] = await pool.query<RowDataPacket[]>(
            "SELECT * FROM canonical_products WHERE id = ?",
            [id]
        );
        if (rows.length === 0) return null;
        return this.mapRow(rows[0]);
    }

    async findByGtin(gtin: string): Promise<CanonicalProduct | null> {
        const [rows] = await pool.query<RowDataPacket[]>(
            "SELECT * FROM canonical_products WHERE gtin = ?",
            [gtin]
        );
        if (rows.length === 0) return null;
        return this.mapRow(rows[0]);
    }

    private mapRow(row: any): CanonicalProduct {
        return {
            id: row.id,
            gtin: row.gtin,
            title: row.title,
            description: row.description,
            brand: row.brand,
            attributes: typeof row.attributes_json === 'string' ? JSON.parse(row.attributes_json) : row.attributes_json,
            images: typeof row.images_json === 'string' ? JSON.parse(row.images_json) : row.images_json,
            source_url: row.source_url
        };
    }
}

export const canonicalProductService = new CanonicalProductService();
