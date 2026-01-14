import { z } from "zod";
import { logger } from "../logger.js";

/**
 * Environment Variable Schema
 * Validates all required and optional environment variables at startup
 */
const envSchema = z.object({
  // Server Configuration
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3000),

  // Database
  DB_HOST: z.string().default("localhost"),
  DB_PORT: z.coerce.number().default(3306),
  DB_USER: z.string().min(1, "DB_USER is required"),
  DB_PASSWORD: z.string().optional(),
  DB_NAME: z.string().min(1, "DB_NAME is required"),

  // Redis (Optional)
  REDIS_URL: z.string().url().optional(),
  CACHE_PREFIX: z.string().default("beekod:v1:prod"),
  CACHE_TTL: z.coerce.number().default(300),

  // API Keys
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required for AI features"),
  GEMINI_MODEL: z.string().default("gemini-1.5-flash"),
  GOOGLE_AI_API_KEY: z.string().optional(),
  FAL_KEY: z.string().optional(),
  WIRO_API_KEY: z.string().optional(),
  WIRO_API_SECRET: z.string().optional(),

  // Marketplace Credentials (Optional - validated per provider)
  TRENDYOL_API_KEY: z.string().optional(),
  TRENDYOL_API_SECRET: z.string().optional(),
  TRENDYOL_SUPPLIER_ID: z.string().optional(),

  N11_API_KEY: z.string().optional(),
  N11_API_SECRET: z.string().optional(),

  HEPSIBURADA_USERNAME: z.string().optional(),
  HEPSIBURADA_PASSWORD: z.string().optional(),
  HEPSIBURADA_MERCHANT_ID: z.string().optional(),

  PAZARAMA_API_KEY: z.string().optional(),
  PAZARAMA_API_SECRET: z.string().optional(),

  // Monitoring (Optional)
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ENVIRONMENT: z.string().optional(),
  SENTRY_ENABLED: z
    .enum(["true", "false"])
    .default("false")
    .transform((val) => val === "true"),

  // Admin Security
  ADMIN_API_KEY: z.string().optional(),

  // Session & Security
  SESSION_SECRET: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validates environment variables at startup
 * Throws an error if validation fails
 */
export function validateEnv(): Env {
  try {
    const validated = envSchema.parse(process.env);
    logger.info("env.validation_success", {
      nodeEnv: validated.NODE_ENV,
      port: validated.PORT,
    });
    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error("env.validation_failed", {
        errors: error.issues.map((e: any) => ({
          path: e.path.join("."),
          message: e.message,
        })),
      });

      logger.error("\n❌ Environment Variable Validation Failed:\n");
      error.issues.forEach((err: any) => {
        logger.error(`  - ${err.path.join(".")}: ${err.message}`);
      });
      logger.error("\nPlease check your .env file and ensure all required variables are set.\n");

      process.exit(1);
    }
    throw error;
  }
}

/**
 * Validated environment variables (call validateEnv() first)
 */
export const env = validateEnv();
