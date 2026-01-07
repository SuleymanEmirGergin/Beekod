import { pool } from "../db.js";
import { logger } from "../logger.js";
import { IConfiguration, mapConfiguration } from "../models/Configuration.js";

const DEFAULT_CONFIG: IConfiguration = {
  company: { name: "Beekod Wholesale", timezone: "Europe/Istanbul", currency: "TRY", language: "Turkish" },
  notifications: { email: true, order: true, stock: true, marketplace: false },
  security: { twoFactorAuth: false, sessionTimeout: "30", ipWhitelist: false },
  appearance: { theme: "Light", compactMode: false, showAnimations: true },
  data: { autoBackup: true, backupFrequency: "Daily", dataRetention: "12" },
  sync: { products: true, orders: true, autoSyncFrequency: "Every 15 Minutes" },
};

export const getConfig = async (): Promise<IConfiguration> => {
  try {
    const [rows] = await pool.query("SELECT * FROM configuration WHERE id = 1");
    const row = (rows as any[])[0];

    if (!row) {
      // This should not happen due to migration seed, but as fallback:
      await pool.query("INSERT IGNORE INTO configuration (id, data) VALUES (1, ?)", [JSON.stringify(DEFAULT_CONFIG)]);
      return DEFAULT_CONFIG;
    }

    const dbConfig = mapConfiguration(row);

    // Ensure all top-level keys exist by merging with defaults
    return {
      ...DEFAULT_CONFIG,
      ...dbConfig,
      company: { ...DEFAULT_CONFIG.company, ...dbConfig.company },
      notifications: { ...DEFAULT_CONFIG.notifications, ...dbConfig.notifications },
      security: { ...DEFAULT_CONFIG.security, ...dbConfig.security },
      appearance: { ...DEFAULT_CONFIG.appearance, ...dbConfig.appearance },
      data: { ...DEFAULT_CONFIG.data, ...dbConfig.data },
      sync: { ...DEFAULT_CONFIG.sync, ...dbConfig.sync },
    };
  } catch (error) {
    logger.error("config.get_failed", { err: error });
    // Return default config instead of throwing to prevent frontend crashes
    return DEFAULT_CONFIG;
  }
};

export const updateConfig = async (data: Partial<IConfiguration>): Promise<IConfiguration> => {
  try {
    const currentConfig = await getConfig();

    // Simple merge logic
    const updatedConfig = {
      ...currentConfig,
      ...data,
      company: { ...currentConfig.company, ...data.company },
      notifications: { ...currentConfig.notifications, ...data.notifications },
      security: { ...currentConfig.security, ...data.security },
      appearance: { ...currentConfig.appearance, ...data.appearance },
      data: { ...currentConfig.data, ...data.data },
      sync: { ...currentConfig.sync, ...data.sync },
    };

    await pool.query("UPDATE configuration SET data = ? WHERE id = 1", [JSON.stringify(updatedConfig)]);
    return updatedConfig as IConfiguration;
  } catch (error) {
    logger.error("config.update_failed", { err: error });
    throw error;
  }
};
