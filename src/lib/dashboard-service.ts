import { supabase } from './supabase';
import { demoStorage } from './demo-storage';
import { toZonedTime } from 'date-fns-tz';
import { format } from 'date-fns';

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000000';
const APP_TIME_ZONE = 'America/Sao_Paulo';

interface RangeParams {
  startUtc: string;
  endUtcExclusive: string;
  userId?: string;
}

// Helper for normalization (lowercase and remove accents)
function normalizeString(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

// Generates a search pattern for SQL ILIKE that replaces vowels with % to be accent-insensitive
function buildSQLSearchPattern(query: string): string {
  const normalized = normalizeString(query);
  // Replace vowels with % to catch any accented version in the database
  return normalized.replace(/[aeiou]/g, '%');
}

export const dashboardService = {
  isDemo(userId?: string) {
    return userId === DEMO_USER_ID;
  },

  async getAllRows(columns: string, params: RangeParams) {
    if (!params.userId) {
      console.warn('getAllRows called without userId', params);
      return [];
    }

    let allRows: any[] = [];
    let from = 0;
    const pageSize = 1000;
    
    console.log(`Fetching rows for ${params.userId} between ${params.startUtc} and ${params.endUtcExclusive}`);

    while (true) {
      const { data, error } = await supabase
        .from('affiliate_order_rows')
        .select(columns)
        .eq('user_id', params.userId)
        .gte('order_date', params.startUtc)
        .lt('order_date', params.endUtcExclusive)
        .range(from, from + pageSize - 1);
      
      if (error) {
        console.error(`Error fetching page ${from/pageSize}:`, error);
        throw error;
      }
      if (!data || data.length === 0) break;
      
      allRows = allRows.concat(data);
      if (data.length < pageSize) break;
      from += pageSize;
    }
    
    console.log(`Fetched ${allRows.length} rows total.`);
    return allRows;
  },

  async getSummary(params: RangeParams) {
    let hasAnyData = false;
    let lastUpdate: string | null = null;

    if (this.isDemo(params.userId)) {
      const allImports = demoStorage.getImports();
      hasAnyData = allImports.length > 0;
      if (hasAnyData) {
        const firstImport = allImports[0];
        lastUpdate = firstImport?.created_at ? String(firstImport.created_at) : null;
      }
      
      const rows = demoStorage.getRows(params.userId!, params.startUtc, params.endUtcExclusive);
      const summary = {
        gmvTotal: 0,
        commissionTotal: 0,
        ordersCount: 0,
      };
      const uniqueOrders = new Set<string>();
      rows.forEach(r => {
        summary.gmvTotal += r.gmv;
        summary.commissionTotal += r.estimated_commission;
        uniqueOrders.add(r.order_id);
      });
      summary.ordersCount = uniqueOrders.size;
      return { ...summary, hasAnyData, lastUpdate };
    }

    // Check if user has any data at all in affiliate_order_rows
    const { count, error: countError } = await supabase
      .from('affiliate_order_rows')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', params.userId);
    
    if (!countError && count !== null && count > 0) {
      hasAnyData = true;
      const { data: lastImport } = await supabase
        .from('imports')
        .select('completed_at')
        .eq('user_id', params.userId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (lastImport) {
        lastUpdate = lastImport.completed_at;
      }
    }

    try {
      const { data, error } = await supabase.rpc('get_dashboard_summary', {
        p_start_at: params.startUtc,
        p_end_at_exclusive: params.endUtcExclusive,
      });
      
      if (error) console.error('RPC get_dashboard_summary error:', error);

      if (!error && data) {
        const result = Array.isArray(data) ? data[0] : data;
        return { 
          gmvTotal: result?.gmv_total || 0,
          commissionTotal: result?.commission_total || 0,
          ordersCount: result?.orders_count || 0,
          hasAnyData, 
          lastUpdate 
        };
      }
      if (error && error.code !== 'PGRST202') throw error;
    } catch (e) {
      console.warn('RPC get_dashboard_summary failed, using fallback', e);
    }

    // Fallback: Paginated Query
    try {
      const rows = await this.getAllRows('gmv, estimated_commission, order_id', params);
      const summary = {
        gmvTotal: 0,
        commissionTotal: 0,
        ordersCount: 0,
      };
      const uniqueOrders = new Set<string>();
      rows.forEach(r => {
        summary.gmvTotal += Number(r.gmv || 0);
        summary.commissionTotal += Number(r.estimated_commission || 0);
        uniqueOrders.add(r.order_id);
      });
      summary.ordersCount = uniqueOrders.size;
      return { ...summary, hasAnyData, lastUpdate };
    } catch (e) {
      console.error('Fallback getSummary failed:', e);
      return { gmvTotal: 0, commissionTotal: 0, ordersCount: 0, hasAnyData, lastUpdate };
    }
  },

  async getStatusMetrics(params: RangeParams) {
    if (this.isDemo(params.userId)) {
      const rows = demoStorage.getRows(params.userId!, params.startUtc, params.endUtcExclusive);
      const metrics: any = {
        settled: { count: 0, gmv: 0, commission: 0 },
        pending: { count: 0, gmv: 0, commission: 0 },
        awaiting_payment: { count: 0, gmv: 0, commission: 0 },
        ineligible: { count: 0, gmv: 0, commission: 0 },
      };
      const uniqueOrders = new Map<string, Set<string>>();

      rows.forEach(r => {
        const status = r.normalized_settlement_status;
        if (metrics[status]) {
          if (!uniqueOrders.has(status)) uniqueOrders.set(status, new Set());
          uniqueOrders.get(status)!.add(r.order_id);
          metrics[status].gmv += r.gmv;
          metrics[status].commission += r.estimated_commission;
        }
      });
      Object.keys(metrics).forEach(s => metrics[s].count = uniqueOrders.get(s)?.size || 0);
      return metrics;
    }

    try {
      const { data, error } = await supabase.rpc('get_status_metrics', {
        p_start_at: params.startUtc,
        p_end_at_exclusive: params.endUtcExclusive,
      });
      if (error) console.error('RPC get_status_metrics error:', error);
      if (!error && data) return data;
      if (error && error.code !== 'PGRST202') throw error;
    } catch (e) {
      console.warn('RPC get_status_metrics failed, using fallback', e);
    }

    // Fallback
    try {
      const rows = await this.getAllRows('gmv, estimated_commission, order_id, normalized_settlement_status', params);
      const metrics: any = {
        settled: { count: 0, gmv: 0, commission: 0 },
        pending: { count: 0, gmv: 0, commission: 0 },
        awaiting_payment: { count: 0, gmv: 0, commission: 0 },
        ineligible: { count: 0, gmv: 0, commission: 0 },
      };
      const uniqueOrders = new Map<string, Set<string>>();

      rows.forEach(r => {
        const status = r.normalized_settlement_status;
        if (metrics[status]) {
          if (!uniqueOrders.has(status)) uniqueOrders.set(status, new Set());
          uniqueOrders.get(status)!.add(r.order_id);
          metrics[status].gmv += Number(r.gmv || 0);
          metrics[status].commission += Number(r.estimated_commission || 0);
        }
      });
      Object.keys(metrics).forEach(s => metrics[s].count = uniqueOrders.get(s)?.size || 0);
      return metrics;
    } catch (e) {
      console.error('Fallback getStatusMetrics failed:', e);
      return {
        settled: { count: 0, gmv: 0, commission: 0 },
        pending: { count: 0, gmv: 0, commission: 0 },
        awaiting_payment: { count: 0, gmv: 0, commission: 0 },
        ineligible: { count: 0, gmv: 0, commission: 0 },
      };
    }
  },

  async getChartData(params: RangeParams) {
    if (this.isDemo(params.userId)) {
      const rows = demoStorage.getRows(params.userId!, params.startUtc, params.endUtcExclusive);
      const timeSeriesMap = new Map<string, { gmv: number; commission: number }>();
      
      rows.forEach(row => {
        const localDate = toZonedTime(new Date(row.order_date), APP_TIME_ZONE);
        const dateKey = format(localDate, 'yyyy-MM-dd');
        if (!timeSeriesMap.has(dateKey)) timeSeriesMap.set(dateKey, { gmv: 0, commission: 0 });
        const t = timeSeriesMap.get(dateKey)!;
        t.gmv += row.gmv;
        t.commission += row.estimated_commission;
      });

      return Array.from(timeSeriesMap.entries())
        .map(([date, v]) => ({ date, gmv: v.gmv, commission: v.commission }))
        .sort((a, b) => a.date.localeCompare(b.date));
    }

    try {
      const { data, error } = await supabase.rpc('get_dashboard_chart', {
        p_start_at: params.startUtc,
        p_end_at_exclusive: params.endUtcExclusive,
      });
      if (error) console.error('RPC get_dashboard_chart error:', error);
      if (!error && data) return data;
      if (error && error.code !== 'PGRST202') throw error;
    } catch (e) {
      console.warn('RPC get_dashboard_chart failed, using fallback', e);
    }

    // Fallback
    try {
      const rows = await this.getAllRows('gmv, estimated_commission, order_date', params);
      const timeSeriesMap = new Map<string, { gmv: number; commission: number }>();
      rows.forEach(row => {
        const localDate = toZonedTime(new Date(row.order_date), APP_TIME_ZONE);
        const dateKey = format(localDate, 'yyyy-MM-dd');
        if (!timeSeriesMap.has(dateKey)) timeSeriesMap.set(dateKey, { gmv: 0, commission: 0 });
        const t = timeSeriesMap.get(dateKey)!;
        t.gmv += Number(row.gmv || 0);
        t.commission += Number(row.estimated_commission || 0);
      });

      return Array.from(timeSeriesMap.entries())
        .map(([date, v]) => ({ date, gmv: v.gmv, commission: v.commission }))
        .sort((a, b) => a.date.localeCompare(b.date));
    } catch (e) {
      console.error('Fallback getChartData failed:', e);
      return [];
    }
  },

  async getContentTypeComparison(params: RangeParams) {
    if (this.isDemo(params.userId)) {
      const rows = demoStorage.getRows(params.userId!, params.startUtc, params.endUtcExclusive);
      const stats: any = {
        video: { orders: 0, gmv: 0, commission: 0, gmvReal: 0, commissionReal: 0 },
        live: { orders: 0, gmv: 0, commission: 0, gmvReal: 0, commissionReal: 0 },
        other: { orders: 0, gmv: 0, commission: 0, gmvReal: 0, commissionReal: 0 },
      };
      const uniqueOrders = new Map<string, Set<string>>();

      rows.forEach(r => {
        const content = r.content_type_normalized || 'other';
        if (stats[content]) {
          if (!uniqueOrders.has(content)) uniqueOrders.set(content, new Set());
          uniqueOrders.get(content)!.add(r.order_id);
          const gmvVal = Number(r.gmv || 0);
          const commVal = Number(r.estimated_commission || 0);
          
          stats[content].gmv += gmvVal;
          stats[content].commission += commVal;

          if (r.normalized_settlement_status === 'settled' || r.normalized_settlement_status === 'pending') {
            stats[content].gmvReal += gmvVal;
            stats[content].commissionReal += commVal;
          }
        }
      });
      Object.keys(stats).forEach(c => stats[c].orders = uniqueOrders.get(c)?.size || 0);
      return stats;
    }

    try {
      const { data, error } = await supabase.rpc('get_content_type_comparison', {
        p_start_at: params.startUtc,
        p_end_at_exclusive: params.endUtcExclusive,
      });
      if (!error && data) {
        // Normalize RPC output to ensure new fields exist
        const normalized: any = {};
        ['video', 'live', 'other'].forEach(key => {
          const stats = data[key] || { orders: 0, gmv: 0, commission: 0 };
          normalized[key] = {
            orders: stats.orders || 0,
            gmv: stats.gmv || 0,
            commission: stats.commission || 0,
            gmvReal: stats.gmvReal ?? stats.gmv ?? 0,
            commissionReal: stats.commissionReal ?? stats.commission ?? 0
          };
        });
        return normalized;
      }
      if (error && error.code !== 'PGRST202') throw error;
    } catch (e) {
      console.warn('RPC get_content_type_comparison failed, using fallback', e);
    }

    // Fallback
    try {
      const rows = await this.getAllRows('gmv, estimated_commission, order_id, content_type_normalized, normalized_settlement_status', params);
      const stats: any = {
        video: { orders: 0, gmv: 0, commission: 0, gmvReal: 0, commissionReal: 0 },
        live: { orders: 0, gmv: 0, commission: 0, gmvReal: 0, commissionReal: 0 },
        other: { orders: 0, gmv: 0, commission: 0, gmvReal: 0, commissionReal: 0 },
      };
      const uniqueOrders = new Map<string, Set<string>>();

      rows.forEach(r => {
        const content = r.content_type_normalized || 'other';
        const key = stats[content] ? content : 'other';
        if (!uniqueOrders.has(key)) uniqueOrders.set(key, new Set());
        uniqueOrders.get(key)!.add(r.order_id);
        
        const gmvVal = Number(r.gmv || 0);
        const commVal = Number(r.estimated_commission || 0);

        stats[key].gmv += gmvVal;
        stats[key].commission += commVal;

        if (r.normalized_settlement_status === 'settled' || r.normalized_settlement_status === 'pending') {
          stats[key].gmvReal += gmvVal;
          stats[key].commissionReal += commVal;
        }
      });
      Object.keys(stats).forEach(c => stats[c].orders = uniqueOrders.get(c)?.size || 0);
      return stats;
    } catch (e) {
      console.error('Fallback getContentTypeComparison failed:', e);
      return {
        video: { orders: 0, gmv: 0, commission: 0, gmvReal: 0, commissionReal: 0 },
        live: { orders: 0, gmv: 0, commission: 0, gmvReal: 0, commissionReal: 0 },
        other: { orders: 0, gmv: 0, commission: 0, gmvReal: 0, commissionReal: 0 },
      };
    }
  },

  async getTrafficSourceComparison(params: RangeParams) {
    if (this.isDemo(params.userId)) {
      const rows = demoStorage.getRows(params.userId!, params.startUtc, params.endUtcExclusive);
      const stats: any = {
        organic: { orders: 0, gmv: 0, commission: 0 },
        shop_ads: { orders: 0, gmv: 0, commission: 0 },
        unknown: { orders: 0, gmv: 0, commission: 0 },
      };
      const uniqueOrders = new Map<string, Set<string>>();

      rows.forEach(r => {
        const traffic = r.traffic_source || 'unknown';
        if (stats[traffic]) {
          if (!uniqueOrders.has(traffic)) uniqueOrders.set(traffic, new Set());
          uniqueOrders.get(traffic)!.add(r.order_id);
          stats[traffic].gmv += r.gmv;
          stats[traffic].commission += r.estimated_commission;
        }
      });
      Object.keys(stats).forEach(t => stats[t].orders = uniqueOrders.get(t)?.size || 0);
      return stats;
    }

    try {
      const { data, error } = await supabase.rpc('get_traffic_source_comparison', {
        p_start_at: params.startUtc,
        p_end_at_exclusive: params.endUtcExclusive,
      });
      if (!error && data) return data;
      if (error && error.code !== 'PGRST202') throw error;
    } catch (e) {
      console.warn('RPC get_traffic_source_comparison failed, using fallback', e);
    }

    // Fallback
    try {
      const rows = await this.getAllRows('gmv, estimated_commission, order_id, traffic_source', params);
      const stats: any = {
        organic: { orders: 0, gmv: 0, commission: 0 },
        shop_ads: { orders: 0, gmv: 0, commission: 0 },
        unknown: { orders: 0, gmv: 0, commission: 0 },
      };
      const uniqueOrders = new Map<string, Set<string>>();

      rows.forEach(r => {
        const traffic = r.traffic_source || 'unknown';
        const key = stats[traffic] ? traffic : 'unknown';
        if (!uniqueOrders.has(key)) uniqueOrders.set(key, new Set());
        uniqueOrders.get(key)!.add(r.order_id);
        stats[key].gmv += Number(r.gmv || 0);
        stats[key].commission += Number(r.estimated_commission || 0);
      });
      Object.keys(stats).forEach(t => stats[t].orders = uniqueOrders.get(t)?.size || 0);
      return stats;
    } catch (e) {
      console.error('Fallback getTrafficSourceComparison failed:', e);
      return {
        organic: { orders: 0, gmv: 0, commission: 0 },
        shop_ads: { orders: 0, gmv: 0, commission: 0 },
        unknown: { orders: 0, gmv: 0, commission: 0 },
      };
    }
  },

  async getTopProducts(params: RangeParams) {
    if (this.isDemo(params.userId)) {
      const rows = demoStorage.getRows(params.userId!, params.startUtc, params.endUtcExclusive);
      const productsMap = new Map<string, any>();

      rows.forEach(row => {
        const prodId = row.product_id || row.product_name;
        if (!productsMap.has(prodId)) {
          productsMap.set(prodId, { id: prodId, name: row.product_name, sold: 0, orders: new Set(), gmv: 0, commission: 0 });
        }
        const p = productsMap.get(prodId)!;
        p.sold += row.items_sold;
        p.orders.add(row.order_id);
        p.gmv += row.gmv;
        p.commission += row.estimated_commission;
      });

      return Array.from(productsMap.values())
        .map(p => ({ ...p, orders: p.orders.size }))
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 10);
    }

    try {
      const { data, error } = await supabase.rpc('get_top_products', {
        p_start_at: params.startUtc,
        p_end_at_exclusive: params.endUtcExclusive,
      });
      if (!error && data) return data;
      if (error && error.code !== 'PGRST202') throw error;
    } catch (e) {
      console.warn('RPC get_top_products failed, using fallback', e);
    }

    // Fallback
    try {
      const rows = await this.getAllRows('gmv, estimated_commission, order_id, product_id, product_name, items_sold', params);
      const productsMap = new Map<string, any>();
      rows.forEach(row => {
        const prodId = row.product_id || row.product_name;
        if (!productsMap.has(prodId)) {
          productsMap.set(prodId, { id: prodId, name: row.product_name, sold: 0, orders: new Set(), gmv: 0, commission: 0 });
        }
        const p = productsMap.get(prodId)!;
        p.sold += Number(row.items_sold || 0);
        p.orders.add(row.order_id);
        p.gmv += Number(row.gmv || 0);
        p.commission += Number(row.estimated_commission || 0);
      });

      return Array.from(productsMap.values())
        .map(p => ({ ...p, orders: p.orders.size }))
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 10);
    } catch (e) {
      console.error('Fallback getTopProducts failed:', e);
      return [];
    }
  },

  async getSalesByHour(params: RangeParams) {
    if (this.isDemo(params.userId)) {
      const rows = demoStorage.getRows(params.userId!, params.startUtc, params.endUtcExclusive);
      const hours = Array.from({ length: 24 }, (_, i) => ({ hour: i, orders: 0, gmv: 0, commission: 0 }));
      const uniqueOrders = new Map<number, Set<string>>();

      rows.forEach(r => {
        const localDate = toZonedTime(new Date(r.order_date), APP_TIME_ZONE);
        const hour = localDate.getHours();
        if (!uniqueOrders.has(hour)) uniqueOrders.set(hour, new Set());
        uniqueOrders.get(hour)!.add(r.order_id);
        hours[hour].gmv += r.gmv;
        hours[hour].commission += r.estimated_commission;
      });
      hours.forEach(h => h.orders = uniqueOrders.get(h.hour)?.size || 0);
      return hours;
    }

    try {
      const { data, error } = await supabase.rpc('get_sales_by_hour', {
        p_start_at: params.startUtc,
        p_end_at_exclusive: params.endUtcExclusive,
      });
      if (!error && data) return data;
      if (error && error.code !== 'PGRST202') throw error;
    } catch (e) {
      console.warn('RPC get_sales_by_hour failed, using fallback', e);
    }

    // Fallback
    try {
      const rows = await this.getAllRows('gmv, estimated_commission, order_id, order_date', params);
      const hours = Array.from({ length: 24 }, (_, i) => ({ hour: i, orders: 0, gmv: 0, commission: 0 }));
      const uniqueOrders = new Map<number, Set<string>>();
      rows.forEach(r => {
        const localDate = toZonedTime(new Date(r.order_date), APP_TIME_ZONE);
        const hour = localDate.getHours();
        if (!uniqueOrders.has(hour)) uniqueOrders.set(hour, new Set());
        uniqueOrders.get(hour)!.add(r.order_id);
        hours[hour].gmv += Number(r.gmv || 0);
        hours[hour].commission += Number(r.estimated_commission || 0);
      });
      hours.forEach(h => h.orders = uniqueOrders.get(h.hour)?.size || 0);
      return hours;
    } catch (e) {
      console.error('Fallback getSalesByHour failed:', e);
      return Array.from({ length: 24 }, (_, i) => ({ hour: i, orders: 0, gmv: 0, commission: 0 }));
    }
  },

  async getSalesByWeekday(params: RangeParams) {
    if (this.isDemo(params.userId)) {
      const rows = demoStorage.getRows(params.userId!, params.startUtc, params.endUtcExclusive);
      const days = Array.from({ length: 7 }, (_, i) => ({ day: i, orders: 0, gmv: 0, commission: 0 }));
      const uniqueOrders = new Map<number, Set<string>>();

      rows.forEach(r => {
        const localDate = toZonedTime(new Date(r.order_date), APP_TIME_ZONE);
        const day = localDate.getDay();
        if (!uniqueOrders.has(day)) uniqueOrders.set(day, new Set());
        uniqueOrders.get(day)!.add(r.order_id);
        days[day].gmv += r.gmv;
        days[day].commission += r.estimated_commission;
      });
      days.forEach(d => d.orders = uniqueOrders.get(d.day)?.size || 0);
      return days;
    }

    try {
      const { data, error } = await supabase.rpc('get_sales_by_weekday', {
        p_start_at: params.startUtc,
        p_end_at_exclusive: params.endUtcExclusive,
      });
      if (!error && data) return data;
      if (error && error.code !== 'PGRST202') throw error;
    } catch (e) {
      console.warn('RPC get_sales_by_weekday failed, using fallback', e);
    }

    // Fallback
    try {
      const rows = await this.getAllRows('gmv, estimated_commission, order_id, order_date', params);
      const days = Array.from({ length: 7 }, (_, i) => ({ day: i, orders: 0, gmv: 0, commission: 0 }));
      const uniqueOrders = new Map<number, Set<string>>();
      rows.forEach(r => {
        const localDate = toZonedTime(new Date(r.order_date), APP_TIME_ZONE);
        const day = localDate.getDay();
        if (!uniqueOrders.has(day)) uniqueOrders.set(day, new Set());
        uniqueOrders.get(day)!.add(r.order_id);
        days[day].gmv += Number(r.gmv || 0);
        days[day].commission += Number(r.estimated_commission || 0);
      });
      days.forEach(d => d.orders = uniqueOrders.get(d.day)?.size || 0);
      return days;
    } catch (e) {
      console.error('Fallback getSalesByWeekday failed:', e);
      return Array.from({ length: 7 }, (_, i) => ({ day: i, orders: 0, gmv: 0, commission: 0 }));
    }
  },

  async getDailyReport(params: RangeParams) {
    if (this.isDemo(params.userId)) {
      const rows = demoStorage.getRows(params.userId!, params.startUtc, params.endUtcExclusive);
      const dailyMap = new Map<string, any>();

      rows.forEach(row => {
        const localDate = toZonedTime(new Date(row.order_date), APP_TIME_ZONE);
        const dateKey = format(localDate, 'yyyy-MM-dd');
        if (!dailyMap.has(dateKey)) {
          dailyMap.set(dateKey, { 
            date: dateKey, 
            orders: new Set(), 
            gmv: 0, 
            commission: 0,
            awaiting_commission: 0,
            ineligible_commission: 0,
            settled: new Set(),
            pending: new Set(),
            awaiting: new Set(),
            ineligible: new Set()
          });
        }
        const d = dailyMap.get(dateKey)!;
        d.orders.add(row.order_id);
        const gmvValue = Number(row.gmv || 0) || 0;
        const commValue = Number(row.estimated_commission || 0) || 0;
        
        const s = row.normalized_settlement_status;
        if (s === 'settled' || s === 'pending') {
          d.gmv += gmvValue;
          d.commission += commValue;
        }
        
        if (s === 'settled') d.settled.add(row.order_id);
        else if (s === 'pending') d.pending.add(row.order_id);
        else if (s === 'awaiting_payment') {
          d.awaiting.add(row.order_id);
          d.awaiting_commission += commValue;
        }
        else if (s === 'ineligible') {
          d.ineligible.add(row.order_id);
          d.ineligible_commission += commValue;
        }
      });

      return Array.from(dailyMap.values())
        .map(d => ({ 
          ...d, 
          orders: d.orders.size,
          settled: d.settled.size,
          pending: d.pending.size,
          awaiting: d.awaiting.size,
          ineligible: d.ineligible.size
        }))
        .sort((a, b) => b.date.localeCompare(a.date));
    }

    try {
      const { data, error } = await supabase.rpc('get_daily_report', {
        p_start_at: params.startUtc,
        p_end_at_exclusive: params.endUtcExclusive,
      });
      if (!error && data) return data;
      if (error && error.code !== 'PGRST202') throw error;
    } catch (e) {
      console.warn('RPC get_daily_report failed, using fallback', e);
    }

    // Fallback
    try {
      const rows = await this.getAllRows('gmv, estimated_commission, order_id, order_date, normalized_settlement_status', params);
      const dailyMap = new Map<string, any>();
      rows.forEach(row => {
        const localDate = toZonedTime(new Date(row.order_date), APP_TIME_ZONE);
        const dateKey = format(localDate, 'yyyy-MM-dd');
        if (!dailyMap.has(dateKey)) {
          dailyMap.set(dateKey, { 
            date: dateKey, 
            orders: new Set(), 
            gmv: 0, 
            commission: 0,
            awaiting_commission: 0,
            ineligible_commission: 0,
            settled: new Set(),
            pending: new Set(),
            awaiting: new Set(),
            ineligible: new Set()
          });
        }
        const d = dailyMap.get(dateKey)!;
        d.orders.add(row.order_id);
        const gmvValue = Number(row.gmv || 0) || 0;
        const commValue = Number(row.estimated_commission || 0) || 0;
        
        const s = row.normalized_settlement_status;
        if (s === 'settled' || s === 'pending') {
          d.gmv += gmvValue;
          d.commission += commValue;
        }
        
        if (s === 'settled') d.settled.add(row.order_id);
        else if (s === 'pending') d.pending.add(row.order_id);
        else if (s === 'awaiting_payment') {
          d.awaiting.add(row.order_id);
          d.awaiting_commission += commValue;
        }
        else if (s === 'ineligible') {
          d.ineligible.add(row.order_id);
          d.ineligible_commission += commValue;
        }
      });

      return Array.from(dailyMap.values())
        .map(d => ({ 
          ...d, 
          orders: d.orders.size,
          settled: d.settled.size,
          pending: d.pending.size,
          awaiting: d.awaiting.size,
          ineligible: d.ineligible.size
        }))
        .sort((a, b) => b.date.localeCompare(a.date));
    } catch (e) {
      console.error('Fallback getDailyReport failed:', e);
      return [];
    }
  },

  async searchProducts(userId: string, query: string) {
    if (!query || query.length < 2) return [];

    const normalizedQuery = normalizeString(query);
    const searchPattern = `%${buildSQLSearchPattern(query)}%`;

    if (this.isDemo(userId)) {
      const allRows = demoStorage.getRows(userId);
      const uniqueNames = Array.from(new Set(allRows.map(r => r.product_name?.trim())))
        .filter(name => name && normalizeString(name).includes(normalizedQuery))
        .slice(0, 15);
      return uniqueNames;
    }

    // Use ilike with % wildcards for vowels to find accented versions
    const { data, error } = await supabase
      .from('affiliate_order_rows')
      .select('product_name')
      .eq('user_id', userId)
      .ilike('product_name', searchPattern)
      .order('order_date', { ascending: false })
      .limit(2000);

    if (error) {
      console.error('Error searching products:', error);
      return [];
    }
    
    // JS side accent-insensitive and case-insensitive deduplication
    const names = data.map(d => d.product_name?.trim()).filter(Boolean);
    const seen = new Set<string>();
    const unique: string[] = [];

    for (const name of names) {
      const norm = normalizeString(name);
      // Ensure the result actually matches our normalized query (finer grain than SQL)
      if (norm.includes(normalizedQuery) && !seen.has(norm)) {
        seen.add(norm);
        unique.push(name);
      }
      if (unique.length >= 15) break;
    }

    return unique;
  },

  async getProductAnalytics(userId: string, productNames: string[], startUtc: string, endUtcExclusive: string) {
    if (!productNames || productNames.length === 0) return null;

    let rows: any[] = [];
    const normalizedTargets = productNames.map(name => normalizeString(name));
    
    if (this.isDemo(userId)) {
      rows = demoStorage.getRows(userId, startUtc, endUtcExclusive)
        .filter(r => normalizedTargets.includes(normalizeString(r.product_name || '')));
    } else {
      // Fetch all rows for the period and filter in JS for maximum reliability with complex names and selection
      let allRows: any[] = [];
      let from = 0;
      const pageSize = 1000;
      
      while (true) {
        const { data, error } = await supabase
          .from('affiliate_order_rows')
          .select('gmv, estimated_commission, order_id, normalized_settlement_status, product_name, order_date')
          .eq('user_id', userId)
          .gte('order_date', startUtc)
          .lt('order_date', endUtcExclusive)
          .range(from, from + pageSize - 1);
        
        if (error) {
          console.error('Error fetching product analytics rows:', error);
          throw error;
        }
        if (!data || data.length === 0) break;
        
        allRows.push(...data);
        if (data.length < pageSize) break;
        from += pageSize;
      }
      
      // Filter in JS using our robust normalization logic (handles accents/case/etc)
      rows = allRows.filter(r => {
        const norm = normalizeString(r.product_name || '');
        return normalizedTargets.includes(norm);
      });
    }

    const analytics: any = {
      productNames,
      totalOrders: new Set(rows.map(r => r.order_id)).size,
      pending: { count: 0, gmv: 0, commission: 0 },
      awaiting_payment: { count: 0, gmv: 0, commission: 0 },
      ineligible: { count: 0, gmv: 0, commission: 0 },
      settled: { count: 0, gmv: 0, commission: 0 },
      totalGmvReal: 0,
      totalCommissionReal: 0
    };

    const statusOrders = {
      pending: new Set<string>(),
      awaiting_payment: new Set<string>(),
      ineligible: new Set<string>(),
      settled: new Set<string>()
    };

    rows.forEach(r => {
      const gmv = Number(r.gmv || 0);
      const commission = Number(r.estimated_commission || 0);
      // Ensure status is lowercased to match our analytics keys
      const rawStatus = (r.normalized_settlement_status || 'unknown').toLowerCase();
      const status = rawStatus as keyof typeof statusOrders;

      if (status === 'settled' || status === 'pending') {
        analytics.totalGmvReal += gmv;
        analytics.totalCommissionReal += commission;
      }

      if (analytics[status]) {
        analytics[status].gmv += gmv;
        analytics[status].commission += commission;
        statusOrders[status].add(r.order_id);
      }
    });

    analytics.pending.count = statusOrders.pending.size;
    analytics.awaiting_payment.count = statusOrders.awaiting_payment.size;
    analytics.ineligible.count = statusOrders.ineligible.size;
    analytics.settled.count = statusOrders.settled.size;

    return analytics;
  }

};
