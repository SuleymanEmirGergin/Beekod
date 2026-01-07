export interface IConfiguration {
  company: {
    name: string;
    timezone: string;
    currency: string;
    language: string;
  };
  notifications: {
    email: boolean;
    order: boolean;
    stock: boolean;
    marketplace: boolean;
  };
  security: {
    twoFactorAuth: boolean;
    sessionTimeout: string;
    ipWhitelist: boolean;
  };
  appearance: {
    theme: string;
    compactMode: boolean;
    showAnimations: boolean;
  };
  data: {
    autoBackup: boolean;
    backupFrequency: string;
    dataRetention: string;
  };
  sync: {
    products: boolean;
    orders: boolean;
    autoSyncFrequency: string;
  };
  updatedAt?: Date;
}

export function mapConfiguration(row: any): IConfiguration {
  const data = typeof row.data === "string" ? JSON.parse(row.data) : row.data;
  return {
    ...data,
    updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
  };
}
