import api from './api';

export interface IntegrationConfig {
  merchantId?: string;
  apiKey?: string;
  apiSecret?: string;
  supplierId?: string;
  webhookUrl?: string;
  syncProducts: boolean;
  syncOrders: boolean;
  autoSyncFrequency: string; // 'Every 15 Minutes', 'Every 30 Minutes', 'Every Hour', 'Manual Only'
  autoPriceUpdates: boolean;
  stockNotifications: boolean;
  orderAutoImport: boolean;
  appKey?: string;
  appSecret?: string;
  username?: string;
  password?: string;
  clientId?: string;
  clientSecret?: string;
}

export interface Integration {
  id: string; // 'trendyol' | 'hepsiburada'
  name: string;
  connected: boolean;
  lastSync?: string;
  itemsSynced?: number;
  config: IntegrationConfig;
}

export interface SyncLog {
  id: string;
  marketplace: string;
  action: string;
  status: 'Success' | 'Warning' | 'Error';
  records: string;
  time: string;
  duration?: string;
  details?: string;
}

// NOTE: Logs are still mocked in the backend for now as we haven't implemented log persistence yet.
// We will retrieve logs from a potential future endpoint or keep them mocked for this iteration
// until Tier 8.5 (Sync Logs).
let mockLogs: SyncLog[] = [
  {
    id: '1',
    marketplace: 'Trendyol',
    action: 'Product Update',
    status: 'Success',
    records: '452 items',
    time: '10:00 AM',
    duration: '2.3s',
    details: 'Updated pricing and stock levels',
  },
  {
    id: '2',
    marketplace: 'Trendyol',
    action: 'Order Import',
    status: 'Success',
    records: '12 orders',
    time: '09:45 AM',
    duration: '1.1s',
    details: 'Imported new orders successfully',
  },
  {
    id: '3',
    marketplace: 'Trendyol',
    action: 'Product Update',
    status: 'Success',
    records: '328 items',
    time: '09:30 AM',
    duration: '1.8s',
    details: 'Bulk inventory sync completed',
  },
  {
    id: '4',
    marketplace: 'Trendyol',
    action: 'Order Import',
    status: 'Warning',
    records: '5 orders',
    time: '09:15 AM',
    duration: '0.9s',
    details: '2 orders with missing address info',
  },
  {
    id: '5',
    marketplace: 'Trendyol',
    action: 'Product Update',
    status: 'Success',
    records: '156 items',
    time: '09:00 AM',
    duration: '1.2s',
    details: 'Category updates synced',
  },
];

export const getIntegrations = async (): Promise<Integration[]> => {
  try {
    const { data } = await api.get('/integrations');
    // Backend returns `providerId`, frontend expects `id`. Map it.
    return data.map((i: any) => ({
      id: i.providerId,
      name: i.name,
      connected: i.connected,
      lastSync: i.lastSync,
      itemsSynced: i.itemsSynced,
      config: i.config,
    }));
  } catch (error) {
    console.warn('API getIntegrations failed');
    return [];
  }
};

export const getSyncLogs = async (): Promise<SyncLog[]> => {
  // For now, return mock logs as backend log persistence is a separate task
  return [...mockLogs];
};

export const connectIntegration = async (id: string, credentials: any): Promise<Integration> => {
  try {
    const { data } = await api.post(`/integrations/${id}/connect`, credentials);
    return {
      id: data.providerId,
      name: data.name,
      connected: data.connected,
      lastSync: data.lastSync,
      itemsSynced: data.itemsSynced,
      config: data.config,
    };
  } catch (error) {
    console.error('API connectIntegration failed', error);
    throw error;
  }
};

export const disconnectIntegration = async (id: string): Promise<void> => {
  try {
    await api.post(`/integrations/${id}/disconnect`);
  } catch (error) {
    console.error('API disconnectIntegration failed', error);
    throw error;
  }
};

export const updateIntegrationConfig = async (
  id: string,
  config: Partial<IntegrationConfig>,
): Promise<Integration> => {
  try {
    const { data } = await api.put(`/integrations/${id}/config`, config);
    return {
      id: data.providerId,
      name: data.name,
      connected: data.connected,
      lastSync: data.lastSync,
      itemsSynced: data.itemsSynced,
      config: data.config,
    };
  } catch (error) {
    console.error('API updateIntegrationConfig failed', error);
    throw error;
  }
};

export const triggerManualSync = async (id?: string): Promise<void> => {
  try {
    // We can call the backend trigger if implemented, or just log a mock entry
    // await api.post(`/integrations/sync`, { id });

    // Mock behavior for UI feedback
    const newLog: SyncLog = {
      id: Date.now().toString(),
      marketplace: id ? (id === 'trendyol' ? 'Trendyol' : 'Hepsiburada') : 'All',
      action: 'Manual Sync',
      status: 'Success',
      records: 'Updated',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      duration: '1.5s',
      details: 'Manual sync triggered by user',
    };
    mockLogs.unshift(newLog);
  } catch (error) {
    console.error('API triggerManualSync failed', error);
  }
};
