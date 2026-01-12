/**
 * Server Configuration
 * @module core/config/server
 */

import { parseNumber } from "./env.js";

const env = process.env;

export const serverConfig = {
  port: parseNumber("PORT", 3000, { min: 1, max: 65535, integer: true }),
  jsonBodyLimit: env.JSON_BODY_LIMIT ?? "10mb",
  urlEncodedBodyLimit: env.URL_ENCODED_BODY_LIMIT ?? env.JSON_BODY_LIMIT ?? "10mb",
};

export type ServerConfig = typeof serverConfig;
