import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { demoStorage } from '../lib/demo-storage';
import { useAuth } from '../contexts/AuthContext';
import { AffiliateOrderRow, SettlementStatus, ContentType, TrafficSource } from '../types';

import { 
  createUtcRangeFromDateKeys, 
  APP_TIME_ZONE,
  toZonedTime
} from '../utils/formatters';
import { format } from 'date-fns';

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000000';

export interface DashboardStats {
  gmvTotal: number;
  commissionTotal: number;
  ordersByStatus: Record<SettlementStatus, { count: number; gmv: number; commission: number }>;
  lostCommission: {
    percentage: number;
    ineligible: number;
    awaiting: number;
  };
  timeSeries: { 
    date: string; 
    gmv: number; 
    commission: number;
    settledCount: number;
    pendingCount: number;
    awaitingCount: number;
    ineligibleCount: number;
    awaitingCommission: number;
    ineligibleCommission: number;
    unexploitedPercentage: number;
  }[];
  contentComparison: Record<ContentType, { orders: number; gmv: number; commission: number }>;
  trafficComparison: Record<TrafficSource, { orders: number; gmv: number; commission: number }>;
  topProducts: { id: string; name: string; sold: number; orders: number; gmv: number; commission: number }[];
  salesByHour: { hour: number; orders: number; gmv: number; commission: number }[];
  salesByWeekday: { day: number; orders: number; gmv: number; commission: number }[];
  lastUpdate: string | Date | null;
  hasAnyData: boolean;
}

export function useDashboardData(startDateKey: string, endDateKey: string) {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    async function fetchData() {
      setLoading(true);
      try {
        const isDemo = user?.id === DEMO_USER_ID;
        let rows: AffiliateOrderRow[] = [];
        let hasAnyData = false;

        const range = createUtcRangeFromDateKeys(startDateKey, endDateKey);

        if (isDemo) {
          const allImports = demoStorage.getImports();
          hasAnyData = allImports.length > 0;
          rows = demoStorage.getRows(user.id, range.startUtc, range.endUtc);
        } else {
          // Check if has any data at all
          const { count, error: countError } = await supabase
            .from('imports')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user?.id);
          
          if (!countError) {
            hasAnyData = (count || 0) > 0;
          }

          const { data: fetchRows, error: fetchError } = await supabase
            .from('affiliate_order_rows')
            .select('*')
            .eq('user_id', user?.id)
            .gte('order_date', range.startUtc)
            .lte('order_date', range.endUtc)
            .order('order_date', { ascending: true });

          if (fetchError) throw fetchError;
          rows = fetchRows as unknown as AffiliateOrderRow[];
        }

        // Processing Aggragations
        const stats: DashboardStats = {
          gmvTotal: 0,
          commissionTotal: 0,
          ordersByStatus: {
            settled: { count: 0, gmv: 0, commission: 0 },
            pending: { count: 0, gmv: 0, commission: 0 },
            awaiting_payment: { count: 0, gmv: 0, commission: 0 },
            ineligible: { count: 0, gmv: 0, commission: 0 },
            unknown: { count: 0, gmv: 0, commission: 0 },
          },
          lostCommission: { percentage: 0, ineligible: 0, awaiting: 0 },
          timeSeries: [],
          contentComparison: {
            video: { orders: 0, gmv: 0, commission: 0 },
            live: { orders: 0, gmv: 0, commission: 0 },
            other: { orders: 0, gmv: 0, commission: 0 },
          },
          trafficComparison: {
            organic: { orders: 0, gmv: 0, commission: 0 },
            shop_ads: { orders: 0, gmv: 0, commission: 0 },
            unknown: { orders: 0, gmv: 0, commission: 0 },
          },
          topProducts: [],
          salesByHour: Array.from({ length: 24 }, (_, i) => ({ hour: i, orders: 0, gmv: 0, commission: 0 })),
          salesByWeekday: Array.from({ length: 7 }, (_, i) => ({ day: i, orders: 0, gmv: 0, commission: 0 })),
          lastUpdate: rows && rows.length > 0 ? rows[rows.length - 1].updated_at : null,
          hasAnyData,
        };

        const uniqueOrdersInStatus = new Map<SettlementStatus, Set<string>>();
        const uniqueOrdersInContent = new Map<ContentType, Set<string>>();
        const uniqueOrdersInTraffic = new Map<TrafficSource, Set<string>>();
        const uniqueOrdersInHour = new Map<number, Set<string>>();
        const uniqueOrdersInWeekday = new Map<number, Set<string>>();
        const productsMap = new Map<string, { id: string; name: string; sold: number; orders: Set<string>; gmv: number; commission: number }>();
        const timeSeriesMap = new Map<string, { 
          gmv: number; 
          commission: number;
          settled: Set<string>;
          pending: Set<string>;
          awaiting: Set<string>;
          ineligible: Set<string>;
          awaitingCommission: number;
          ineligibleCommission: number;
        }>();

        rows?.forEach(row => {
          stats.gmvTotal += row.gmv;
          stats.commissionTotal += row.estimated_commission;

          const localOrderDate = toZonedTime(new Date(row.order_date), APP_TIME_ZONE);

          // Status
          const status = row.normalized_settlement_status as SettlementStatus;
          if (!uniqueOrdersInStatus.has(status)) uniqueOrdersInStatus.set(status, new Set());
          uniqueOrdersInStatus.get(status)!.add(row.order_id);
          stats.ordersByStatus[status].gmv += row.gmv;
          stats.ordersByStatus[status].commission += row.estimated_commission;

          // Content
          const content = row.content_type_normalized as ContentType;
          if (!uniqueOrdersInContent.has(content)) uniqueOrdersInContent.set(content, new Set());
          uniqueOrdersInContent.get(content)!.add(row.order_id);
          stats.contentComparison[content].gmv += row.gmv;
          stats.contentComparison[content].commission += row.estimated_commission;

          // Traffic
          const traffic = row.traffic_source as TrafficSource;
          if (!uniqueOrdersInTraffic.has(traffic)) uniqueOrdersInTraffic.set(traffic, new Set());
          uniqueOrdersInTraffic.get(traffic)!.add(row.order_id);
          stats.trafficComparison[traffic].gmv += row.gmv;
          stats.trafficComparison[traffic].commission += row.estimated_commission;

          // Hour
          const hour = localOrderDate.getHours();
          if (!uniqueOrdersInHour.has(hour)) uniqueOrdersInHour.set(hour, new Set());
          uniqueOrdersInHour.get(hour)!.add(row.order_id);
          stats.salesByHour[hour].gmv += row.gmv;
          stats.salesByHour[hour].commission += row.estimated_commission;

          // Weekday
          const day = localOrderDate.getDay(); // 0 is Sunday
          if (!uniqueOrdersInWeekday.has(day)) uniqueOrdersInWeekday.set(day, new Set());
          uniqueOrdersInWeekday.get(day)!.add(row.order_id);
          stats.salesByWeekday[day].gmv += row.gmv;
          stats.salesByWeekday[day].commission += row.estimated_commission;

          // Products
          const prodId = row.product_id || row.product_name;
          if (!productsMap.has(prodId)) {
            productsMap.set(prodId, { id: prodId, name: row.product_name, sold: 0, orders: new Set(), gmv: 0, commission: 0 });
          }
          const p = productsMap.get(prodId)!;
          p.sold += row.items_sold;
          p.orders.add(row.order_id);
          p.gmv += row.gmv;
          p.commission += row.estimated_commission;

          // Time Series
          const dateKey = format(localOrderDate, 'yyyy-MM-dd');
          if (!timeSeriesMap.has(dateKey)) {
            timeSeriesMap.set(dateKey, { 
              gmv: 0, 
              commission: 0,
              settled: new Set(),
              pending: new Set(),
              awaiting: new Set(),
              ineligible: new Set(),
              awaitingCommission: 0,
              ineligibleCommission: 0
            });
          }
          const t = timeSeriesMap.get(dateKey)!;
          t.gmv += row.gmv;
          t.commission += row.estimated_commission;

          const s = row.normalized_settlement_status;
          if (s === 'settled') t.settled.add(row.order_id);
          else if (s === 'pending') t.pending.add(row.order_id);
          else if (s === 'awaiting_payment') {
            t.awaiting.add(row.order_id);
            t.awaitingCommission += row.estimated_commission;
          }
          else if (s === 'ineligible') {
            t.ineligible.add(row.order_id);
            t.ineligibleCommission += row.estimated_commission;
          }
        });

        // Finalize stats
        Object.keys(stats.ordersByStatus).forEach(s => {
          stats.ordersByStatus[s as SettlementStatus].count = uniqueOrdersInStatus.get(s as SettlementStatus)?.size || 0;
        });
        Object.keys(stats.contentComparison).forEach(c => {
          stats.contentComparison[c as ContentType].orders = uniqueOrdersInContent.get(c as ContentType)?.size || 0;
        });
        Object.keys(stats.trafficComparison).forEach(t => {
          stats.trafficComparison[t as TrafficSource].orders = uniqueOrdersInTraffic.get(t as TrafficSource)?.size || 0;
        });
        stats.salesByHour.forEach(h => {
          h.orders = uniqueOrdersInHour.get(h.hour)?.size || 0;
        });
        stats.salesByWeekday.forEach(d => {
          d.orders = uniqueOrdersInWeekday.get(d.day)?.size || 0;
        });

        stats.lostCommission.ineligible = stats.ordersByStatus.ineligible.commission;
        stats.lostCommission.awaiting = stats.ordersByStatus.awaiting_payment.commission;
        if (stats.commissionTotal > 0) {
          stats.lostCommission.percentage = ((stats.lostCommission.ineligible + stats.lostCommission.awaiting) / stats.commissionTotal) * 100;
        }

        stats.topProducts = Array.from(productsMap.values())
          .map(p => ({ ...p, orders: p.orders.size }))
          .sort((a, b) => b.sold - a.sold)
          .slice(0, 10);

        stats.timeSeries = Array.from(timeSeriesMap.entries())
          .map(([date, values]) => {
            const unexploited = values.awaitingCommission + values.ineligibleCommission;
            const percentage = values.commission > 0 ? (unexploited / values.commission) * 100 : 0;
            
            return { 
              date, 
              gmv: values.gmv, 
              commission: values.commission,
              settledCount: values.settled.size,
              pendingCount: values.pending.size,
              awaitingCount: values.awaiting.size,
              ineligibleCount: values.ineligible.size,
              awaitingCommission: values.awaitingCommission,
              ineligibleCommission: values.ineligibleCommission,
              unexploitedPercentage: percentage
            };
          })
          .sort((a, b) => a.date.localeCompare(b.date));

        setData(stats);
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user, startDateKey, endDateKey]);

  return { data, loading, error };
}

