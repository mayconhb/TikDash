export type SettlementStatus = 'settled' | 'pending' | 'awaiting_payment' | 'ineligible' | 'unknown';
export type ContentType = 'video' | 'live' | 'other';
export type TrafficSource = 'organic' | 'shop_ads' | 'unknown';

export interface Profile {
  id: string;
  name: string;
  onboarding_completed: boolean;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface ImportRecord {
  id: string;
  user_id: string;
  original_filename: string;
  file_size_bytes: number;
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  inserted_rows: number;
  updated_rows: number;
  ignored_rows: number;
  unique_orders: number;
  minimum_order_date: Date | string | null;
  maximum_order_date: Date | string | null;
  gmv_total: number;
  estimated_commission_total: number;
  status: 'processing' | 'completed' | 'completed_with_warnings' | 'failed';
  warnings: string[];
  error_message?: string;
  created_at: Date | string;
  completed_at?: Date | string;
}

export interface AffiliateOrderRow {
  id?: string;
  user_id: string;
  import_id: string;
  row_identity: string;
  row_fingerprint: string;
  order_id: string;
  sku_id?: string;
  product_id?: string;
  product_name: string;
  store_name?: string;
  items_sold: number;
  items_refunded: number;
  order_type?: string;
  original_settlement_status?: string;
  normalized_settlement_status: SettlementStatus;
  content_type_original?: string;
  content_type_normalized: ContentType;
  content_id?: string;
  traffic_source: TrafficSource;
  gmv: number;
  standard_estimated_commission: number;
  shop_ads_estimated_commission: number;
  estimated_bonus: number;
  partner_agency_estimated_bonus: number;
  estimated_commission: number;
  order_date: Date | string;
  created_at: Date | string;
  updated_at: Date | string;
}
