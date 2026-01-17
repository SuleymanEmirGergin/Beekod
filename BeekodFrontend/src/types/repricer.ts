export enum PricingStrategy {
  MATCH_COMPETITOR = 'MATCH_COMPETITOR',
  BEAT_COMPETITOR = 'BEAT_COMPETITOR',
  PROFIT_MAXIMIZER = 'PROFIT_MAXIMIZER',
  MANUAL = 'MANUAL'
}

export interface RepricingConfig {
  barcode: string;
  enabled: boolean;
  min_price: number;
  max_price: number;
  strategy: PricingStrategy;
  beat_amount?: number;
  target_margin?: number;
  updated_at?: string;
}
