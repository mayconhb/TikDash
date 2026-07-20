import { 
  addDays,
  subDays,
  startOfDay,
  endOfDay,
  format,
  parse,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toZonedTime, fromZonedTime, formatInTimeZone } from 'date-fns-tz';

export const APP_TIME_ZONE = 'America/Sao_Paulo';

export function getNowInAppTimeZone(): Date {
  return toZonedTime(new Date(), APP_TIME_ZONE);
}

export function getTodayDateKey(): string {
  const nowInSaoPaulo = getNowInAppTimeZone();
  return format(nowInSaoPaulo, 'yyyy-MM-dd');
}

export function getYesterdayDateKey(): string {
  const nowInSaoPaulo = getNowInAppTimeZone();
  const yesterdayInSaoPaulo = subDays(nowInSaoPaulo, 1);
  return format(yesterdayInSaoPaulo, 'yyyy-MM-dd');
}

export interface UtcDateRange {
  startUtc: string;
  endUtc: string;
  startDateKey: string;
  endDateKey: string;
}

function parseDateKeyAsLocalCalendarDate(dateKey: string): Date {
  return parse(dateKey, 'yyyy-MM-dd', new Date());
}

export function createUtcRangeFromDateKeys(
  startDateKey: string,
  endDateKey: string,
): UtcDateRange {
  const startCalendarDate = parseDateKeyAsLocalCalendarDate(startDateKey);
  const endCalendarDate = parseDateKeyAsLocalCalendarDate(endDateKey);

  const startWallClock = startOfDay(startCalendarDate);
  const endWallClock = endOfDay(endCalendarDate);

  const startUtcDate = fromZonedTime(startWallClock, APP_TIME_ZONE);
  const endUtcDate = fromZonedTime(endWallClock, APP_TIME_ZONE);

  return {
    startUtc: startUtcDate.toISOString(),
    endUtc: endUtcDate.toISOString(),
    startDateKey,
    endDateKey,
  };
}

export type PeriodPreset = 'today' | 'yesterday' | 'last7days' | 'last30days' | 'custom';

export function getPresetDateKeys(
  preset: Exclude<PeriodPreset, 'custom'>,
): {
  startDateKey: string;
  endDateKey: string;
} {
  const nowInSaoPaulo = getNowInAppTimeZone();

  if (preset === 'today') {
    const today = format(nowInSaoPaulo, 'yyyy-MM-dd');
    return { startDateKey: today, endDateKey: today };
  }

  if (preset === 'yesterday') {
    const yesterday = format(subDays(nowInSaoPaulo, 1), 'yyyy-MM-dd');
    return { startDateKey: yesterday, endDateKey: yesterday };
  }

  if (preset === 'last7days') {
    return {
      startDateKey: format(subDays(nowInSaoPaulo, 6), 'yyyy-MM-dd'),
      endDateKey: format(nowInSaoPaulo, 'yyyy-MM-dd'),
    };
  }

  return {
    startDateKey: format(subDays(nowInSaoPaulo, 29), 'yyyy-MM-dd'),
    endDateKey: format(nowInSaoPaulo, 'yyyy-MM-dd'),
  };
}

export function formatDateKeyPtBr(dateKey: string): string {
  const date = parse(dateKey, 'yyyy-MM-dd', new Date());
  return format(date, 'dd/MM/yyyy');
}

export function formatDateKeyDayMonth(dateKey: string): string {
  const date = parse(dateKey, 'yyyy-MM-dd', new Date());
  return format(date, 'dd/MM');
}

export function formatDateKeyShort(dateKey: string): string {
  const date = parse(dateKey, 'yyyy-MM-dd', new Date());
  return format(date, "dd 'de' MMM", { locale: ptBR });
}

export function formatDateRangeLabel(
  startDateKey: string,
  endDateKey: string,
): string {
  if (startDateKey === endDateKey) {
    return formatDateKeyPtBr(startDateKey);
  }
  return `${formatDateKeyPtBr(startDateKey)} até ${formatDateKeyPtBr(endDateKey)}`;
}

export function parseTikTokOrderDate(rawValue: string): Date {
  const wallClockDate = parse(rawValue.trim(), 'dd/MM/yyyy HH:mm:ss', new Date());
  if (Number.isNaN(wallClockDate.getTime())) {
    throw new Error(`Data inválida na planilha: ${rawValue}`);
  }
  return fromZonedTime(wallClockDate, APP_TIME_ZONE);
}

export function formatOrderDateInAppTimeZone(utcDate: string): string {
  const localDate = toZonedTime(new Date(utcDate), APP_TIME_ZONE);
  return format(localDate, 'dd/MM/yyyy HH:mm:ss');
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatInTimeZone(d, APP_TIME_ZONE, 'dd/MM/yyyy');
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatInTimeZone(d, APP_TIME_ZONE, "dd/MM/yyyy 'às' HH:mm");
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

export function parseBRLAmount(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === '' || value === '/' || value === '-') return 0;
  if (typeof value === 'number') return value;
  
  let cleanValue = value.toString().replace(/R\$\s?/, '').replace(/\s/g, '').replace(/\./g, '');
  cleanValue = cleanValue.replace(',', '.');
  
  const parsed = parseFloat(cleanValue);
  return isNaN(parsed) ? 0 : parsed;
}

export function parseBRDate(dateStr: string): Date | null {
  try {
    return parse(dateStr, 'dd/MM/yyyy HH:mm:ss', new Date());
  } catch {
    return null;
  }
}

export { fromZonedTime, toZonedTime };
