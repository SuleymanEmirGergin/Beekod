
import { query } from "../../db.js";
import { logger } from "../../logger.js";

export interface BaseModel {
    id: number;
    name: string;
    gender: 'male' | 'female' | 'neutral';
    imageUrl: string;
}

export class ModelService {
    async getBaseModel(id: number): Promise<BaseModel | null> {
        const rows = await query("SELECT * FROM base_models WHERE id = ? AND is_active = 1", [id]);
        return (rows as any)[0] || null;
    }

    async getDefaultModel(gender: string): Promise<BaseModel | null> {
        // Deterministic fallback (ordered by ID) to replace random selection.
        // This ensures the pipeline is reproducible.
        const rows = await query(
            "SELECT * FROM base_models WHERE gender = ? AND is_active = 1 ORDER BY id ASC LIMIT 1",
            [gender]
        );
        return (rows as any)[0] || null;
    }
}

export const modelService = new ModelService();
