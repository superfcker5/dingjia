export interface Product {
  id: string;
  name: string;
  prices: {
    purchase: { box: number; item: number };
    wholesale: { box: number; item: number };
    retail_floor: { box: number; item: number };
    retail: { box: number; item: number };
  };
}

export type PriceType = 'purchase' | 'wholesale' | 'retail_floor' | 'retail';
export type UnitType = 'box' | 'item';

export interface OrderItem {
  productId: string;
  productName: string; // Snapshot in case product is deleted
  quantityBox: number;
  quantityItem: number;
}

export interface AppSettings {
  geminiApiKey: string;
  deepseekApiKey: string;
  deepseekBaseUrl: string; // Default: https://api.deepseek.com
  cashierName: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  geminiApiKey: '',
  deepseekApiKey: '',
  deepseekBaseUrl: 'https://api.deepseek.com',
  cashierName: '',
};

export const PRICE_LABELS: Record<PriceType, string> = {
  purchase: '进货价',
  wholesale: '批发价',
  retail_floor: '零售底价',
  retail: '零售价',
};

export const UNIT_LABELS: Record<UnitType, string> = {
  box: '箱',
  item: '个',
};