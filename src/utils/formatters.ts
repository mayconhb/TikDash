import { 
  format,
  parse,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toZonedTime, fromZonedTime, formatInTimeZone } from 'date-fns-tz';

export const APP_TIME_ZONE = 'America/Sao_Paulo';

export function getNowInAppTimeZone(): Date {
  return toZonedTime(new Date(), APP_TIME_ZONE);
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
