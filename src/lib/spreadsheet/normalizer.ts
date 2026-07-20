import { 
  SettlementStatus, 
  ContentType, 
  TrafficSource, 
  AffiliateOrderRow 
} from '../../types';
import { parseBRLAmount, parseBRDate } from '../../utils/formatters';

export const EXPECTED_HEADERS = {
  order_id: 'ID do pedido',
  sku_id: 'ID do SKU',
  product_name: 'Nome do produto',
  product_id: 'ID do produto',
  items_sold: 'Itens vendidos',
  items_refunded: 'Itens reembolsados',
  store_name: 'Nome da loja',
  order_type: 'Tipo de pedido',
  settlement_status: 'Status de liquidação do pedido',
  content_type: 'Tipo de conteúdo',
  content_id: 'ID do conteúdo',
  pattern: 'Padrão',
  shop_ads: 'Anúncios da loja',
  gmv: 'GMV',
  standard_comm: 'Comissão padrão estimada',
  shop_ads_comm: 'Comissão estimada de anúncios da loja',
  bonus: 'Bônus estimado',
  agency_bonus: 'Bônus estimado da agência parceira',
  order_date: 'Data do pedido',
};

export function normalizeHeader(header: string): string {
  return header
    .trim()
    .replace(/\s+/g, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function mapHeaders(rawHeaders: string[]): Record<string, number> {
  const mapping: Record<string, number> = {};
  const normalizedExpected = Object.entries(EXPECTED_HEADERS).reduce((acc, [key, value]) => {
    acc[normalizeHeader(value)] = key;
    return acc;
  }, {} as Record<string, string>);

  rawHeaders.forEach((header, index) => {
    const norm = normalizeHeader(header);
    const key = normalizedExpected[norm];
    if (key) {
      mapping[key] = index;
    }
  });

  return mapping;
}

export function normalizeStatus(status: string): SettlementStatus {
  const norm = normalizeHeader(status);
  if (norm.includes('liquidado')) return 'settled';
  if (norm.includes('pendente')) return 'pending';
  if (norm.includes('awaitingpayment') || norm.includes('aguardando pagamento')) return 'awaiting_payment';
  if (norm.includes('inelegivel')) return 'ineligible';
  return 'unknown';
}

export function normalizeContentType(type: string): ContentType {
  const norm = normalizeHeader(type);
  if (norm.includes('video')) return 'video';
  if (norm.includes('live')) return 'live';
  return 'other';
}

export function determineTrafficSource(row: any, mapping: Record<string, number>): TrafficSource {
  const orderType = row[mapping.order_type] || '';
  const shopAdsValue = parseBRLAmount(row[mapping.shop_ads]);
  const patternValue = row[mapping.pattern] || '';

  if (normalizeHeader(orderType).includes('anuncios da loja') || shopAdsValue > 0) {
    return 'shop_ads';
  }
  if (patternValue) {
    return 'organic';
  }
  return 'unknown';
}

export function createRowIdentity(row: AffiliateOrderRow): string {
  // Key Identity: user_id + order_id + sku_id + product_id + content_id + order_date
  const dateValue = row.order_date instanceof Date 
    ? row.order_date.getTime() 
    : new Date(row.order_date).getTime();
    
  return `${row.user_id}_${row.order_id}_${row.sku_id || ''}_${row.product_id || ''}_${row.content_id || ''}_${dateValue}`;
}
