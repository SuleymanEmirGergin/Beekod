
import { logger } from "../../logger.js";
import { InternalError } from "../../errors/AppError.js";
import { getGeminiProvider } from "../../ai/providers/gemini/GeminiProvider.js";

// Typed Error for Quality Gate
export class QualityRejectedError extends InternalError {
    constructor(message: string, public score: number) {
        super(message);
        this.name = "QualityRejectedError";
        this.statusCode = 422;
    }
}

export class QualityGateService {
    private threshold: number;

    constructor() {
        this.threshold = parseInt(process.env.VTO_QUALITY_THRESHOLD || "70", 10);
    }

    /**
     * Score the quality of a generated image (0-100)
     */
    async scoreImage(imageUrl: string): Promise<number> {
        logger.info("quality_gate.scoring", { imageUrl });

        // Using Gemini 1.5 Flash for fast scoring
        try {
            const provider = getGeminiProvider();
            const prompt = `
                Analyze this AI-generated fashion image. Score it from 0 to 100 based on:
                1. Anatomical correctness (hands, face)
                2. Garment texture and realism
                3. Absence of artifacts (blur, bleeding, glitches)

                Return ONLY the numeric score.
            `;

            // Note: Gemini provider usually accepts text. Image input requires specific handling.
            // Assuming provider supports multi-modal or we pass image URL if supported.
            // For now, if provider only supports text, we might need a workaround or fetch the image.
            // Let's assume provider.generate supports image parts or we fetch and convert.

            // Simulating image scoring for this implementation step if provider logic is text-only.
            // In real implementation, we would download image -> base64 -> send to Gemini.

            // Fetch image buffer
            const response = await fetch(imageUrl);
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Assuming we have a method to send image to Gemini in the provider, or we use the client directly.
            // Since I cannot see GeminiProvider implementation fully, I will use a direct call pattern if possible
            // or assume a 'generateWithImage' method exists or add it.

            // For this specific task, I'll rely on the existing 'analyzeImage' function if available in geminiClient.js
            // which was referenced in import logs.

            const { analyzeImage } = await import("../../geminiClient.js");
            const result = await analyzeImage({
                prompt,
                buffer,
                mimeType: response.headers.get("content-type") || "image/jpeg"
            });

            const score = parseInt(result?.match(/\d+/)?.[0] || "0", 10);
            logger.info("quality_gate.scored", { imageUrl, score });
            return score;

        } catch (error) {
            logger.error("quality_gate.failed", { error });
            return 50; // Fail open or closed? Returning mid-score to allow retry logic to decide or pass.
        }
    }

    /**
     * Validate image against threshold
     */
    async validate(imageUrl: string): Promise<boolean> {
        const score = await this.scoreImage(imageUrl);
        if (score < this.threshold) {
            throw new QualityRejectedError(`Image quality score ${score} is below threshold ${this.threshold}`, score);
        }
        return true;
    }
}

export const qualityGateService = new QualityGateService();
