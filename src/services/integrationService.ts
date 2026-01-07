import type { IIntegration, IIntegrationConfig } from "../models/Integration.js";
import { pool, query } from "../db.js";
import { logger } from "../logger.js";

type IntegrationRow = {
  provider_id: string;
  name: string;
  connected: 0 | 1;
  last_sync: string | null;
  items_synced: number;
  config: any;
  created_at?: Date;
  updated_at?: Date;
};

const DEFAULT_INTEGRATIONS: IIntegration[] = [
  {
    providerId: "trendyol",
    name: "Trendyol",
    connected: false,
    config: {
      syncProducts: true,
      syncOrders: true,
      autoSyncFrequency: "Every 15 Minutes",
      autoPriceUpdates: true,
      stockNotifications: true,
      orderAutoImport: true,
    },
  },
  {
    providerId: "hepsiburada",
    name: "Hepsiburada",
    connected: false,
    config: {
      syncProducts: false,
      syncOrders: false,
      autoSyncFrequency: "Manual Only",
      autoPriceUpdates: false,
      stockNotifications: false,
      orderAutoImport: false,
    },
  },
  {
    providerId: "n11",
    name: "N11",
    connected: false,
    config: {
      syncProducts: false,
      syncOrders: false,
      autoSyncFrequency: "Manual Only",
      autoPriceUpdates: false,
      stockNotifications: false,
      orderAutoImport: false,
    },
  },
  {
    providerId: "pazarama",
    name: "Pazarama",
    connected: false,
    config: {
      syncProducts: false,
      syncOrders: false,
      autoSyncFrequency: "Manual Only",
      autoPriceUpdates: false,
      stockNotifications: false,
      orderAutoImport: false,
    },
  },
  {
    providerId: "pttavm",
    name: "PTTAVM",
    connected: false,
    config: {
      syncProducts: false,
      syncOrders: false,
      autoSyncFrequency: "Manual Only",
      autoPriceUpdates: false,
      stockNotifications: false,
      orderAutoImport: false,
    },
  },
  {
    providerId: "ciceksepeti",
    name: "Ciceksepeti",
    connected: false,
    config: {
      syncProducts: false,
      syncOrders: false,
      autoSyncFrequency: "Manual Only",
      autoPriceUpdates: false,
      stockNotifications: false,
      orderAutoImport: false,
    },
  },
  {
    providerId: "shopify",
    name: "Shopify",
    connected: false,
    config: {
      syncProducts: false,
      syncOrders: false,
      autoSyncFrequency: "Manual Only",
      autoPriceUpdates: false,
      stockNotifications: false,
      orderAutoImport: false,
      shopDomain: "",
      accessToken: "",
    },
  },
  {
    providerId: "woocommerce",
    name: "WooCommerce",
    connected: false,
    config: {
      syncProducts: false,
      syncOrders: false,
      autoSyncFrequency: "Manual Only",
      autoPriceUpdates: false,
      stockNotifications: false,
      orderAutoImport: false,
      storeUrl: "",
      consumerKey: "",
      consumerSecret: "",
    },
  },
];

function safeJsonParse(v: any): IIntegrationConfig {
  if (!v) return {} as IIntegrationConfig;
  if (typeof v === "string") {
    try {
      return JSON.parse(v);
    } catch (err) {
      logger.warn("integrations.invalid_config_json", { err });
      return {} as IIntegrationConfig;
    }
  }
  return v as IIntegrationConfig;
}

function toIntegration(row: IntegrationRow): IIntegration {
  return {
    providerId: row.provider_id,
    name: row.name,
    connected: Boolean(row.connected),
    lastSync: row.last_sync ?? undefined,
    itemsSynced: row.items_synced ?? 0,
    config: safeJsonParse(row.config),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function seedDefaults(): Promise<void> {
  const inserts = DEFAULT_INTEGRATIONS.map((integration) =>
    pool.query(
      `INSERT IGNORE INTO integrations
      (provider_id, name, connected, last_sync, items_synced, config, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        integration.providerId,
        integration.name,
        integration.connected ? 1 : 0,
        integration.lastSync ?? null,
        integration.itemsSynced ?? 0,
        JSON.stringify(integration.config ?? {}),
      ],
    ),
  );

  await Promise.all(inserts);
}

async function getIntegrationRow(id: string): Promise<IntegrationRow | undefined> {
  const rows = await query<IntegrationRow[]>("SELECT * FROM integrations WHERE provider_id = ?", [id]);
  return rows[0];
}

function mergeConfig(base: IIntegrationConfig, patch?: Partial<IIntegrationConfig>): IIntegrationConfig {
  return { ...base, ...(patch ?? {}) };
}

export const getAllIntegrations = async (): Promise<IIntegration[]> => {
  await seedDefaults();
  const rows = await query<IntegrationRow[]>("SELECT * FROM integrations ORDER BY provider_id ASC");
  return rows.map(toIntegration);
};

export const addIntegration = async (integration: IIntegration): Promise<void> => {
  await pool.query(
    `INSERT INTO integrations
    (provider_id, name, connected, last_sync, items_synced, config, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      integration.providerId,
      integration.name,
      integration.connected ? 1 : 0,
      integration.lastSync ?? null,
      integration.itemsSynced ?? 0,
      JSON.stringify(integration.config ?? {}),
    ],
  );
};

import { credentialService } from "./credentialService.js";

export const connectIntegration = async (
  id: string,
  credentials: Partial<IIntegrationConfig>,
): Promise<IIntegration> => {
  await seedDefaults();
  const row = await getIntegrationRow(id);
  if (!row) {
    throw new Error("Integration provider not found");
  }

  // 1. Save sensitive credentials to encrypted storage
  // For now using userId 1 as a placeholder for the system admin/primary user
  const userId = 1;
  await credentialService.saveCredentials(userId, id, credentials);

  // 2. Prepare config for the integrations table (exclude sensitive fields if desired, or keep as fallback)
  const nextConfig = mergeConfig(
    DEFAULT_INTEGRATIONS.find((i) => i.providerId === row.provider_id)?.config ?? {
      ...safeJsonParse(row.config),
      ...credentials,
    },
  );

  await pool.query(
    `UPDATE integrations
     SET connected = 1,
         config = ?,
         last_sync = ?,
         items_synced = 0,
         updated_at = NOW()
     WHERE provider_id = ?`,
    [JSON.stringify(nextConfig), new Date().toISOString(), id],
  );

  const updated = await getIntegrationRow(id);
  return toIntegration(updated as IntegrationRow);
};

export const disconnectIntegration = async (id: string): Promise<IIntegration> => {
  const row = await getIntegrationRow(id);
  if (!row) {
    throw new Error("Integration provider not found");
  }

  await pool.query(
    `UPDATE integrations
     SET connected = 0,
         updated_at = NOW()
     WHERE provider_id = ?`,
    [id],
  );

  const updated = await getIntegrationRow(id);
  return toIntegration(updated as IntegrationRow);
};

export const updateIntegrationConfig = async (
  id: string,
  patch: Partial<IIntegrationConfig>,
): Promise<IIntegration> => {
  const row = await getIntegrationRow(id);
  if (!row) {
    throw new Error("Integration provider not found");
  }

  const nextConfig = mergeConfig(safeJsonParse(row.config), patch);

  await pool.query(
    `UPDATE integrations
     SET config = ?, updated_at = NOW()
     WHERE provider_id = ?`,
    [JSON.stringify(nextConfig), id],
  );

  const updated = await getIntegrationRow(id);
  return toIntegration(updated as IntegrationRow);
};

export const deleteIntegration = async (id: string): Promise<void> => {
  await pool.query("DELETE FROM integrations WHERE provider_id = ?", [id]);
};
