import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { usePeriodFilter } from '../contexts/PeriodFilterContext';
import { dashboardService } from '../lib/dashboard-service';

export function useDashboardSummary() {
  const { period } = usePeriodFilter();
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dashboard-summary', user?.id, period.startUtc, period.endUtcExclusive],
    queryFn: () => dashboardService.getSummary({
      userId: user?.id,
      startUtc: period.startUtc,
      endUtcExclusive: period.endUtcExclusive,
    }),
    enabled: !!user,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}

export function useStatusSummary() {
  const { period } = usePeriodFilter();
  const { user } = useAuth();

  return useQuery({
    queryKey: ['status-summary', user?.id, period.startUtc, period.endUtcExclusive],
    queryFn: () => dashboardService.getStatusMetrics({
      userId: user?.id,
      startUtc: period.startUtc,
      endUtcExclusive: period.endUtcExclusive,
    }),
    enabled: !!user,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}

export function useDashboardChart() {
  const { period } = usePeriodFilter();
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dashboard-chart', user?.id, period.startUtc, period.endUtcExclusive],
    queryFn: () => dashboardService.getChartData({
      userId: user?.id,
      startUtc: period.startUtc,
      endUtcExclusive: period.endUtcExclusive,
    }),
    enabled: !!user,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}

export function useContentTypeComparison() {
  const { period } = usePeriodFilter();
  const { user } = useAuth();

  return useQuery({
    queryKey: ['content-type-comparison', user?.id, period.startUtc, period.endUtcExclusive],
    queryFn: () => dashboardService.getContentTypeComparison({
      userId: user?.id,
      startUtc: period.startUtc,
      endUtcExclusive: period.endUtcExclusive,
    }),
    enabled: !!user,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}

export function useTrafficSourceComparison() {
  const { period } = usePeriodFilter();
  const { user } = useAuth();

  return useQuery({
    queryKey: ['traffic-source-comparison', user?.id, period.startUtc, period.endUtcExclusive],
    queryFn: () => dashboardService.getTrafficSourceComparison({
      userId: user?.id,
      startUtc: period.startUtc,
      endUtcExclusive: period.endUtcExclusive,
    }),
    enabled: !!user,
    placeholderData: keepPreviousData,
  });
}

export function useTopProducts() {
  const { period } = usePeriodFilter();
  const { user } = useAuth();

  return useQuery({
    queryKey: ['top-products', user?.id, period.startUtc, period.endUtcExclusive],
    queryFn: () => dashboardService.getTopProducts({
      userId: user?.id,
      startUtc: period.startUtc,
      endUtcExclusive: period.endUtcExclusive,
    }),
    enabled: !!user,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}

export function useSalesByHour() {
  const { period } = usePeriodFilter();
  const { user } = useAuth();

  return useQuery({
    queryKey: ['sales-by-hour', user?.id, period.startUtc, period.endUtcExclusive],
    queryFn: () => dashboardService.getSalesByHour({
      userId: user?.id,
      startUtc: period.startUtc,
      endUtcExclusive: period.endUtcExclusive,
    }),
    enabled: !!user,
    placeholderData: keepPreviousData,
  });
}

export function useSalesByWeekday() {
  const { period } = usePeriodFilter();
  const { user } = useAuth();

  return useQuery({
    queryKey: ['sales-by-weekday', user?.id, period.startUtc, period.endUtcExclusive],
    queryFn: () => dashboardService.getSalesByWeekday({
      userId: user?.id,
      startUtc: period.startUtc,
      endUtcExclusive: period.endUtcExclusive,
    }),
    enabled: !!user,
    placeholderData: keepPreviousData,
  });
}

export function useDailyReport() {
  const { period } = usePeriodFilter();
  const { user } = useAuth();

  return useQuery({
    queryKey: ['daily-report', user?.id, period.startUtc, period.endUtcExclusive],
    queryFn: () => dashboardService.getDailyReport({
      userId: user?.id,
      startUtc: period.startUtc,
      endUtcExclusive: period.endUtcExclusive,
    }),
    enabled: !!user,
    placeholderData: keepPreviousData,
  });
}
