import api from './api';

export interface Configuration {
  _id?: string;
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
}

export const getConfig = async (): Promise<Configuration> => {
  const response = await api.get('/config');
  return response.data;
};

export const updateConfig = async (data: Partial<Configuration>): Promise<Configuration> => {
  const response = await api.put('/config', data);
  return response.data;
};
