/**
 * Security Configuration
 * @module core/config/security
 */

import { parseBoolean, parseNumber, parseCsv } from "./env.js";

const env = process.env;

export const securityConfig = {
  cors: {
    origins: env.CORS_ORIGINS
      ? parseCsv("CORS_ORIGINS")
      : [
          "http://localhost:5173",
          "http://127.0.0.1:5173",
          "http://localhost:5174",
          "http://127.0.0.1:5174",
          "http://localhost:3000",
          "http://localhost:5175",
          "http://127.0.0.1:5175",
        ],
    methods: parseCsv("CORS_ALLOW_METHODS"),
    headers: parseCsv("CORS_ALLOW_HEADERS"),
    allowCredentials: parseBoolean("CORS_ALLOW_CREDENTIALS", false),
  },
  hsts: {
    enabled: parseBoolean("SECURITY_HSTS_ENABLED", false),
    maxAge: parseNumber("SECURITY_HSTS_MAX_AGE", 15552000, { min: 0, integer: true }),
  },
  jwtSecret: env.JWT_SECRET ?? "dev-secret-do-not-use-in-prod",
};

export const adminConfig = {
  apiKey: env.ADMIN_KEY ?? env.ADMIN_API_KEY ?? "",
};

export type SecurityConfig = typeof securityConfig;
export type AdminConfig = typeof adminConfig;
