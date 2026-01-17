import api from './api';
import { RepricingConfig } from '../types/repricer';

export const getRepricerConfig = async (barcode: string): Promise<{ ok: boolean, value: RepricingConfig }> => {
  const response = await api.get(`/repricer/config/${barcode}`);
  return response.data;
};

export const updateRepricerConfig = async (barcode: string, config: Partial<RepricingConfig>): Promise<{ ok: boolean, value: RepricingConfig }> => {
  const response = await api.post(`/repricer/config/${barcode}`, config);
  return response.data;
};

export const runRepricerManual = async (barcode: string) => {
  const response = await api.post(`/repricer/run/${barcode}`);
  return response.data;
};
