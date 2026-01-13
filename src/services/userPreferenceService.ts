import fs from "fs";
import path from "path";
import { logger } from "../logger.js";

// For MVP, we'll store preferences in a JSON file.
// In a real app, this would be in the database.
const PREFS_FILE = path.join(process.cwd(), "data", "user_prefs.json");

export type Tone = "professional" | "friendly" | "concise" | "pirate"; // Added pirate for fun testing
export type DetailLevel = "summary" | "detailed";

export interface UserPreferences {
  tone?: Tone;
  detailLevel?: DetailLevel;
  locale?: string;
  enable_ai_auto_pricing?: boolean;
  enable_ai_stock_notifications?: boolean;
  [key: string]: any;
}

// In-memory cache
let prefsCache: Record<string, UserPreferences> = {};

// Ensure data directory exists
const dataDir = path.dirname(PREFS_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Load perfs on startup
if (fs.existsSync(PREFS_FILE)) {
  try {
    const data = fs.readFileSync(PREFS_FILE, "utf-8");
    prefsCache = JSON.parse(data);
    logger.info("User preferences loaded from disk");
  } catch (error) {
    logger.error("Failed to load user preferences:", error);
  }
}

export const getUserPreferences = (userId: string): UserPreferences => {
  // Return defaults if nothing set
  return prefsCache[userId] || { tone: "friendly", detailLevel: "summary" };
};

export const updateUserPreferences = (userId: string, prefs: Partial<UserPreferences>) => {
  const current = getUserPreferences(userId);
  prefsCache[userId] = { ...current, ...prefs };
  savePreferences();
  logger.info(`Updated preferences for user ${userId}`, prefs);
  return prefsCache[userId];
};

const savePreferences = () => {
  try {
    fs.writeFileSync(PREFS_FILE, JSON.stringify(prefsCache, null, 2));
  } catch (error) {
    logger.error("Failed to save user preferences:", error);
  }
};
