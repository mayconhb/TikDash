import {
  addDays,
  format,
  isAfter,
  parse,
  subDays,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  fromZonedTime,
  toZonedTime,
} from 'date-fns-tz';

export const APP_TIME_ZONE = 'America/Sao_Paulo';

export type PeriodPreset =
  | 'today'
  | 'yesterday'
  | 'last7days'
  | 'last30days'
  | 'custom';

export interface DateKeyRange {
  startDateKey: string;
  endDateKey: string;
}

export interface UtcRange {
  startUtc: string;
  endUtcExclusive: string;
}

export interface PeriodState extends DateKeyRange, UtcRange {
  preset: PeriodPreset;
  label: string;
}

export function getNowInAppTimeZone(
  now: Date = new Date(),
): Date {
  return toZonedTime(now, APP_TIME_ZONE);
}

export function dateToDateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function parseDateKey(dateKey: string): Date {
  const parsed = parse(
    dateKey,
    'yyyy-MM-dd',
    new Date(2000, 0, 1),
  );

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Data inválida: ${dateKey}`);
  }

  return parsed;
}

export function getPresetDateKeyRange(
  preset: Exclude<PeriodPreset, 'custom'>,
  now: Date = new Date(),
): DateKeyRange {
  const nowInSaoPaulo = getNowInAppTimeZone(now);
  const todayKey = dateToDateKey(nowInSaoPaulo);

  switch (preset) {
    case 'today':
      return {
        startDateKey: todayKey,
        endDateKey: todayKey,
      };

    case 'yesterday': {
      const yesterdayKey = dateToDateKey(
        subDays(nowInSaoPaulo, 1),
      );

      return {
        startDateKey: yesterdayKey,
        endDateKey: yesterdayKey,
      };
    }

    case 'last7days':
      return {
        startDateKey: dateToDateKey(
          subDays(nowInSaoPaulo, 6),
        ),
        endDateKey: todayKey,
      };

    case 'last30days':
      return {
        startDateKey: dateToDateKey(
          subDays(nowInSaoPaulo, 29),
        ),
        endDateKey: todayKey,
      };
  }
}

export function validateDateKeyRange(
  range: DateKeyRange,
): void {
  const startDate = parseDateKey(range.startDateKey);
  const endDate = parseDateKey(range.endDateKey);

  if (isAfter(startDate, endDate)) {
    throw new Error(
      'A data inicial não pode ser posterior à data final.',
    );
  }
}

export function dateKeyRangeToUtcRange(
  range: DateKeyRange,
): UtcRange {
  validateDateKeyRange(range);

  const startDate = parseDateKey(range.startDateKey);
  const endDate = parseDateKey(range.endDateKey);

  const startWallClock = new Date(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate(),
    0,
    0,
    0,
    0,
  );

  const nextDay = addDays(endDate, 1);

  const endExclusiveWallClock = new Date(
    nextDay.getFullYear(),
    nextDay.getMonth(),
    nextDay.getDate(),
    0,
    0,
    0,
    0,
  );

  return {
    startUtc: fromZonedTime(
      startWallClock,
      APP_TIME_ZONE,
    ).toISOString(),

    endUtcExclusive: fromZonedTime(
      endExclusiveWallClock,
      APP_TIME_ZONE,
    ).toISOString(),
  };
}

export function formatDateKeyPtBr(
  dateKey: string,
): string {
  return format(
    parseDateKey(dateKey),
    'dd/MM/yyyy',
  );
}

export function formatDateKeyDayMonth(
  dateKey: string,
): string {
  return format(
    parseDateKey(dateKey),
    'dd/MM',
  );
}

export function formatDateKeyShort(
  dateKey: string,
): string {
  return format(
    parseDateKey(dateKey),
    "dd 'de' MMM",
    { locale: ptBR },
  );
}

export function formatDateKeyRangeLabel(
  range: DateKeyRange,
): string {
  if (range.startDateKey === range.endDateKey) {
    return formatDateKeyPtBr(range.startDateKey);
  }

  return `${formatDateKeyPtBr(
    range.startDateKey,
  )} até ${formatDateKeyPtBr(
    range.endDateKey,
  )}`;
}

export function createPeriodState(
  preset: PeriodPreset,
  customRange?: DateKeyRange,
  now: Date = new Date(),
): PeriodState {
  const dateKeyRange =
    preset === 'custom'
      ? customRange
      : getPresetDateKeyRange(preset, now);

  if (!dateKeyRange) {
    throw new Error(
      'O período personalizado precisa de data inicial e final.',
    );
  }

  const utcRange =
    dateKeyRangeToUtcRange(dateKeyRange);

  return {
    preset,
    ...dateKeyRange,
    ...utcRange,
    label: formatDateKeyRangeLabel(dateKeyRange),
  };
}
